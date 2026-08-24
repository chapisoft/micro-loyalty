import http from 'k6/http';
import { check, sleep } from 'k6';
import crypto from 'k6/crypto';

export const options = {
  scenarios: {
    lucky_wheel_spike_load: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '30s', target: 200 },  // Tăng lên 200 CCU trong 30s
        { duration: '1m', target: 500 },   // Đạt đỉnh 500 CCU quay thưởng đồng thời
        { duration: '2m', target: 500 },   // Duy trì 500 CCU trong 2 phút
        { duration: '30s', target: 0 },    // Giảm dần về 0
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'],     // 95% lượt quay phản hồi dưới 200ms
    http_req_failed: ['rate<0.01'],       // Tỷ lệ lỗi mạng dưới 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8088';
const TENANT_ID = 'TENANT_DELIMART';
const API_KEY = 'KEY_CRM_DELIMART';
const SECRET_KEY = 'SEC_CRM_DELI_01';

function signPayload(payload, secretKey) {
  return crypto.hmac('sha256', secretKey, payload, 'hex');
}

export default function () {
  const timestamp = Date.now().toString();
  const userId = `USER_SPIN_${__VU}`;

  // 1. Luồng Lấy cấu hình Vòng quay (GET Wheel Config)
  const configHeaders = {
    'X-Tenant-Id': TENANT_ID,
  };
  const configRes = http.get(`${BASE_URL}/wheel/v1/config/LUCKY_WHEEL_CRM?externalUserId=${userId}`, {
    headers: configHeaders,
  });

  check(configRes, {
    'wheel config status is 200': (r) => r.status === 200,
  });

  sleep(0.05);

  // 2. Luồng Thực thi Quay thưởng (Execute Spin)
  const spinPayload = JSON.stringify({
    externalUserId: userId,
    wheelCode: 'LUCKY_WHEEL_CRM',
  });

  const spinSignature = signPayload(spinPayload, SECRET_KEY);

  const spinHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': TENANT_ID,
    'X-Api-Key': API_KEY,
    'X-Signature': spinSignature,
    'X-Timestamp': timestamp,
  };

  const spinRes = http.post(`${BASE_URL}/wheel/v1/spin`, spinPayload, {
    headers: spinHeaders,
  });

  check(spinRes, {
    'spin status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'spin response time OK': (r) => r.timings.duration < 200,
    'prize awarded properly': (r) => {
      if (r.status === 200) {
        const body = JSON.parse(r.body);
        return body.data && body.data.prizeName !== undefined;
      }
      return true;
    },
  });

  sleep(0.2);
}
