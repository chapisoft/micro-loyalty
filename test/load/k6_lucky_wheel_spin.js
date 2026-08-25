import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * KỊCH BẢN KIỂM THỬ TẢI CAO VÒNG QUAY MAY MẮN (LUCKY WHEEL STRESS TEST)
 * Mô phỏng 2.000 RPS quay thưởng dồn dập vào các khung giờ vàng
 */

export const options = {
  scenarios: {
    wheel_spin_surge: {
      executor: 'ramping-arrival-rate',
      startRate: 200,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 800,
      stages: [
        { duration: '30s', target: 1000 },
        { duration: '1m', target: 2000 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<150', 'p(99)<300'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8088';
const TENANT_ID = 'TENANT_NATCASH';

const spinSuccessRate = new Rate('spin_success_rate');
const spinLatency = new Trend('spin_latency_ms');

export default function () {
  const userId = `USER_WHEEL_${Math.floor(Math.random() * 100) + 1}`;
  const spinRef = `SPIN_REF_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

  const payload = JSON.stringify({
    externalUserId: userId,
    spinReference: spinRef,
    isFreeSpin: true,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
    },
  };

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/loyalty/v1/wheel/spin`, payload, params);
  spinLatency.add(Date.now() - startTime);

  if (res.status === 200) {
    spinSuccessRate.add(1);
    check(res, {
      'spin ok': (r) => r.status === 200,
      'prize returned': (r) => JSON.parse(r.body).prizeWon !== undefined,
    });
  } else {
    spinSuccessRate.add(0);
  }

  sleep(0.01);
}
