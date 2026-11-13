/* global __ENV, __VU, __ITER */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * KỊCH BẢN KIỂM THỬ TẢI CAO & BẪY TOÀN VẸN ĐỒNG THỜI V2.0
 * Bao gồm 3 luồng đồng thời:
 *   1. Luồng 1 (FIFO Bucket Race): 50 VUs bắn đồng thời tiêu điểm trừ lô FIFO trên cùng 1 tài khoản
 *      (POST /loyalty/v1/reward-wallet/redeem + GET /loyalty/v1/ledger/expiring-buckets) để bẫy lỗi trừ âm bucket.
 *   2. Luồng 2 (Monthly Budget Cap): Bắn đồng thời nhận thưởng nhiệm vụ
 *      (POST /loyalty/v1/campaigns/milestones/1/claim) kiểm chứng giới hạn ngân sách tháng (Redis DECRBY).
 *   3. Luồng 3 (Lucky Scratch Card): Bắn đồng thời chơi thẻ cào may mắn
 *      (POST /gamehub/v1/scratch-card/play) kiểm chứng trừ lượt & trả thưởng an toàn.
 */

// Đánh dấu mã lỗi nghiệp vụ từ chối an toàn (400/409/422/429) không bị tính là lỗi hạ tầng trong k6
if (typeof http.setResponseCallback === 'function') {
  http.setResponseCallback(
    http.expectedStatuses({ min: 200, max: 299 }, 400, 409, 422, 429)
  );
}

export const options = {
  scenarios: {
    fifo_bucket_burn_race: {
      executor: 'per-vu-iterations',
      exec: 'fifoBurnScenario',
      vus: 50,
      iterations: 5,
      maxDuration: '1m',
    },
    monthly_budget_cap_claim: {
      executor: 'constant-vus',
      exec: 'milestoneClaimScenario',
      vus: 40,
      duration: '30s',
      startTime: '0s',
    },
    lucky_scratch_card_play: {
      executor: 'constant-vus',
      exec: 'scratchCardPlayScenario',
      vus: 50,
      duration: '30s',
      startTime: '0s',
    },
  },
  thresholds: {
    server_error_rate: ['rate<0.01'], // Tỷ lệ lỗi máy chủ 5xx < 1%
    negative_bucket_detected: ['count==0'], // Tuyệt đối không được phát sinh bucket âm
    fifo_burn_latency_ms: ['p(95)<300', 'p(99)<600'],
    milestone_claim_latency_ms: ['p(95)<250', 'p(99)<500'],
    scratch_card_latency_ms: ['p(95)<250', 'p(99)<500'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8088';
const TENANT_ID = __ENV.TENANT_ID || 'TENANT_NATCASH';
const FIFO_USER_ID = __ENV.FIFO_USER_ID || '50937123456';
const MILESTONE_ID = Number(__ENV.MILESTONE_ID || '1');
const PARTNER_CODE = __ENV.PARTNER_CODE || 'NATCASH_WALLET';
const PARTNER_ID = Number(__ENV.PARTNER_ID || '1');

const serverErrorRate = new Rate('server_error_rate');
const negativeBucketDetected = new Counter('negative_bucket_detected');

const fifoBurnSuccessRate = new Rate('fifo_burn_success_rate');
const fifoBurnSafeRejectRate = new Rate('fifo_burn_safe_reject_rate');
const fifoBurnLatency = new Trend('fifo_burn_latency_ms');

const milestoneClaimSuccessRate = new Rate('milestone_claim_success_rate');
const milestoneClaimSafeRejectRate = new Rate('milestone_claim_safe_reject_rate');
const milestoneClaimLatency = new Trend('milestone_claim_latency_ms');

const scratchPlaySuccessRate = new Rate('scratch_play_success_rate');
const scratchPlaySafeRejectRate = new Rate('scratch_play_safe_reject_rate');
const scratchCardLatency = new Trend('scratch_card_latency_ms');

function buildHeaders(idempotencyKey) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': TENANT_ID,
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  if (__ENV.API_KEY) {
    headers['X-API-Key'] = __ENV.API_KEY;
  }
  if (__ENV.AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${__ENV.AUTH_TOKEN}`;
  }
  return headers;
}

function safeParseJson(body) {
  try {
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

/**
 * LUỒNG 1: 50 VUs đồng thời tiêu điểm trừ lô FIFO trên cùng 1 tài khoản
 */
export function fifoBurnScenario() {
  const txCode = `FIFO_BURN_${__VU}_${__ITER}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const burnPayload = JSON.stringify({
    externalUserId: FIFO_USER_ID,
    transactionCode: txCode,
    pointsToBurn: 50,
    totalBillAmount: 500,
    partnerCode: PARTNER_CODE,
    redeemerPartnerId: PARTNER_ID,
    description: 'K6 FIFO concurrency stress test',
  });

  const startTime = Date.now();
  const burnRes = http.post(
    `${BASE_URL}/loyalty/v1/reward-wallet/redeem`,
    burnPayload,
    { headers: buildHeaders(txCode), tags: { flow: 'fifo_burn' } }
  );
  fifoBurnLatency.add(Date.now() - startTime);

  if (burnRes.status >= 500 || burnRes.status === 0) {
    serverErrorRate.add(1);
    fifoBurnSuccessRate.add(0);
    console.warn(`[FIFO-BURN-5XX] status=${burnRes.status}, body=${burnRes.body}`);
  } else {
    serverErrorRate.add(0);
    if (burnRes.status === 200) {
      fifoBurnSuccessRate.add(1);
      const body = safeParseJson(burnRes.body);
      check(burnRes, {
        'fifo burn status 200': (r) => r.status === 200,
        'fifo remainingPoints non-negative': () =>
          body === null || body.remainingPoints === undefined || Number(body.remainingPoints) >= 0,
      });
    } else if (burnRes.status === 400 || burnRes.status === 409 || burnRes.status === 422 || burnRes.status === 429) {
      // Từ chối an toàn khi hết điểm hoặc Redisson RLock đang bận
      fifoBurnSafeRejectRate.add(1);
    } else {
      fifoBurnSuccessRate.add(0);
    }
  }

  // Kiểm tra danh sách lô điểm sắp hết hạn FIFO để phát hiện tức thì nếu có lô bị trừ âm
  const bucketsRes = http.get(
    `${BASE_URL}/loyalty/v1/ledger/expiring-buckets?externalUserId=${encodeURIComponent(FIFO_USER_ID)}`,
    { headers: buildHeaders(null), tags: { flow: 'fifo_buckets_check' } }
  );

  if (bucketsRes.status === 200) {
    const parsed = safeParseJson(bucketsRes.body);
    const buckets = Array.isArray(parsed)
      ? parsed
      : (parsed && (parsed.buckets || parsed.items || parsed.content)) || [];

    let hasNegativeBucket = false;
    for (let i = 0; i < buckets.length; i++) {
      const rem = buckets[i].remainingPoints !== undefined
        ? Number(buckets[i].remainingPoints)
        : Number(buckets[i].remaining_points);
      if (!Number.isNaN(rem) && rem < 0) {
        hasNegativeBucket = true;
        negativeBucketDetected.add(1);
      }
    }

    check(bucketsRes, {
      'expiring-buckets has zero negative buckets': () => !hasNegativeBucket,
    });
  }

  sleep(0.01);
}

/**
 * LUỒNG 2: Nhận thưởng nhiệm vụ đồng thời để kiểm chứng giới hạn ngân sách tháng (Redis DECRBY)
 */
export function milestoneClaimScenario() {
  // Kết hợp đa người dùng (ép cạn ngân sách tháng) và một nhóm trùng người dùng (bẫy khóa claim trùng)
  const userId = __ITER % 5 === 0
    ? `CLAIM_RACE_USER_${(__VU % 5) + 1}`
    : `CLAIM_BUDGET_USER_${__VU}_${__ITER}`;
  const idempotencyKey = `CLAIM_M${MILESTONE_ID}_${__VU}_${__ITER}_${Date.now()}`;

  const claimPayload = JSON.stringify({
    externalUserId: userId,
    milestoneId: MILESTONE_ID,
  });

  const startTime = Date.now();
  const res = http.post(
    `${BASE_URL}/loyalty/v1/campaigns/milestones/${MILESTONE_ID}/claim`,
    claimPayload,
    { headers: buildHeaders(idempotencyKey), tags: { flow: 'milestone_claim' } }
  );
  milestoneClaimLatency.add(Date.now() - startTime);

  if (res.status >= 500 || res.status === 0) {
    serverErrorRate.add(1);
    milestoneClaimSuccessRate.add(0);
    console.warn(`[CLAIM-5XX] status=${res.status}, body=${res.body}`);
  } else {
    serverErrorRate.add(0);
    if (res.status === 200) {
      milestoneClaimSuccessRate.add(1);
      check(res, {
        'milestone claim status 200': (r) => r.status === 200,
      });
    } else if (res.status === 400 || burnLikeReject(res.status)) {
      // Từ chối an toàn khi chạm trần ngân sách tháng (PAUSED_BUDGET_EXCEEDED) hoặc đã nhận thưởng
      milestoneClaimSafeRejectRate.add(1);
    } else {
      milestoneClaimSuccessRate.add(0);
    }
  }

  sleep(0.01);
}

function burnLikeReject(status) {
  return status === 409 || status === 422 || status === 429;
}

/**
 * LUỒNG 3: Chơi Lucky Scratch Card đồng thời (SecureRandom + trừ lượt an toàn)
 */
export function scratchCardPlayScenario() {
  const userId = `SCRATCH_STRESS_USER_${((__VU - 1) % 25) + 1}`;
  const txRef = `SCRATCH_${__VU}_${__ITER}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const payload = JSON.stringify({
    externalUserId: userId,
    gameCode: 'SCRATCH_CARD',
    clientTransactionRef: txRef,
  });

  const startTime = Date.now();
  const res = http.post(
    `${BASE_URL}/gamehub/v1/scratch-card/play`,
    payload,
    { headers: buildHeaders(txRef), tags: { flow: 'scratch_card_play' } }
  );
  scratchCardLatency.add(Date.now() - startTime);

  if (res.status >= 500 || res.status === 0) {
    serverErrorRate.add(1);
    scratchPlaySuccessRate.add(0);
    console.warn(`[SCRATCH-5XX] status=${res.status}, body=${res.body}`);
  } else {
    serverErrorRate.add(0);
    if (res.status === 200) {
      scratchPlaySuccessRate.add(1);
      const body = safeParseJson(res.body);
      check(res, {
        'scratch-card status 200': (r) => r.status === 200,
        'scratch-card has valid payload': () => body !== null,
      });
    } else if (res.status === 400 || res.status === 409 || res.status === 422 || res.status === 429) {
      scratchPlaySafeRejectRate.add(1);
    } else {
      scratchPlaySuccessRate.add(0);
    }
  }

  sleep(0.01);
}
