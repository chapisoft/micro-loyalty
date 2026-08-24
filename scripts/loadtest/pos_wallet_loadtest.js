import http from 'k6/http';
import { check, sleep } from 'k6';
import crypto from 'k6/crypto';

export const options = {
  scenarios: {
    pos_high_load: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 1000,
      stages: [
        { target: 500, duration: '1m' },   // Tăng dần lên 500 RPS trong 1 phút
        { target: 1000, duration: '3m' },  // Duy trì tải cao 1.000 RPS trong 3 phút
        { target: 1000, duration: '5m' },  // Ổn định ở 1.000 RPS trong 5 phút
        { target: 0, duration: '1m' },     // Hạ tải về 0 trong 1 phút
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<150'],     // 95% số yêu cầu phải hoàn thành dưới 150ms
    http_req_failed: ['rate<0.001'],      // Tỷ lệ lỗi cho phép dưới 0.1%
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
  const userId = `CUST_${Math.floor(Math.random() * 10000) + 1}`;
  const txCode = `POS_TX_${Date.now()}_${__VU}_${__ITER}`;

  // 1. Luồng Tra cứu Số dư và Voucher tại quầy POS (Inquiry)
  const inquiryPayload = JSON.stringify({
    externalUserId: userId,
    totalBillAmount: 500.00,
  });

  const inquirySignature = signPayload(inquiryPayload, SECRET_KEY);

  const inquiryHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': TENANT_ID,
    'X-Api-Key': API_KEY,
    'X-Signature': inquirySignature,
    'X-Timestamp': timestamp,
  };

  const inquiryRes = http.post(`${BASE_URL}/wallet/v1/inquiry`, inquiryPayload, {
    headers: inquiryHeaders,
  });

  check(inquiryRes, {
    'inquiry status is 200': (r) => r.status === 200,
    'inquiry response time OK': (r) => r.timings.duration < 150,
  });

  sleep(0.05);

  // 2. Luồng Khấu trừ Điểm và Áp dụng Voucher tại quầy POS (Redeem)
  const redeemPayload = JSON.stringify({
    externalUserId: userId,
    transactionCode: txCode,
    totalBillAmount: 500.00,
    pointsToBurn: 50.00,
    redeemerPartnerId: 2,
  });

  const redeemSignature = signPayload(redeemPayload, SECRET_KEY);

  const redeemHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': TENANT_ID,
    'X-Api-Key': API_KEY,
    'X-Signature': redeemSignature,
    'X-Timestamp': timestamp,
  };

  const redeemRes = http.post(`${BASE_URL}/wallet/v1/redeem`, redeemPayload, {
    headers: redeemHeaders,
  });

  check(redeemRes, {
    'redeem status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'redeem response time OK': (r) => r.timings.duration < 200,
  });

  sleep(0.1);
}
