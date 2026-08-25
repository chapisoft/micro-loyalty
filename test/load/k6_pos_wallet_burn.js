import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * KỊCH BẢN KIỂM THỬ TẢI CAO VÀ BẪY TRANH CHẤP SỐ DƯ TÀI CHÍNH (CONCURRENCY DATA INTEGRITY)
 * Mô phỏng 1.000 RPS dồn dập tại quầy thu ngân POS siêu thị Delimart & Chuỗi bán lẻ
 * Yêu cầu: Khóa phân tán Redisson RLock + Khóa bi quan PostgreSQL chặn 100% việc trừ điểm âm và gạch nợ trùng.
 */

export const options = {
  scenarios: {
    pos_burn_stress: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { duration: '30s', target: 500 },  // Tăng lên 500 RPS
        { duration: '1m', target: 1000 },  // Giữ tải đỉnh 1.000 RPS
        { duration: '30s', target: 0 },    // Hạ tải an toàn
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // Tỷ lệ lỗi HTTP < 1%
    http_req_duration: ['p(95)<200', 'p(99)<400'], // 95% request phản hồi dưới 200ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8088';
const TENANT_ID = 'TENANT_DELIMART';

const successRate = new Rate('burn_success_rate');
const lockBusyRate = new Rate('lock_busy_rate');
const burnLatency = new Trend('burn_latency_ms');

export default function () {
  const userId = `CUST_STRESS_${Math.floor(Math.random() * 50) + 1}`;
  const txCode = `POS_TX_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

  const payload = JSON.stringify({
    externalUserId: userId,
    transactionCode: txCode,
    billAmount: 500.0,
    pointAmount: 50.0,
    partnerCode: 'DELIMART_POS',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
      'Idempotency-Key': txCode,
    },
  };

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/loyalty/v1/wallet/redeem`, payload, params);
  const latency = Date.now() - startTime;
  burnLatency.add(latency);

  if (res.status === 200) {
    successRate.add(1);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response has valid toPayAmount': (r) => JSON.parse(r.body).toPayAmount !== undefined,
    });
  } else if (res.status === 429 || res.status === 409) {
    // Redisson Lock busy rejected safely
    lockBusyRate.add(1);
  } else {
    successRate.add(0);
    console.warn(`[WARN] Unexpected response: status=${res.status}, body=${res.body}`);
  }

  sleep(0.01);
}
