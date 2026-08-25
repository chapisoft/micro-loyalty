import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * KỊCH BẢN KIỂM THỬ TẢI CAO SUBMIT KẾT QUẢ 13 MINIGAME (1.000 RPS)
 */

export const options = {
  scenarios: {
    minigame_submit_stress: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { duration: '30s', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<180'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8088';
const TENANT_ID = 'TENANT_NATCASH';
const GAMES = ['FLAPPY_NATCOM', 'KNIFE_HIT', 'FRUIT_SLICE', 'BUBBLE_SHOOTER', 'ENDLESS_RUNNER', 'MEMORY_MATCH'];

const submitSuccessRate = new Rate('game_submit_success_rate');
const submitLatency = new Trend('game_submit_latency_ms');

export default function () {
  const userId = `GAMER_${Math.floor(Math.random() * 100) + 1}`;
  const gameCode = GAMES[Math.floor(Math.random() * GAMES.length)];
  const score = Math.floor(Math.random() * 50) + 1;

  const payload = JSON.stringify({
    externalUserId: userId,
    gameCode: gameCode,
    score: score,
    details: 'STAGE_CLEAR',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
    },
  };

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/gamehub/v1/games/submit-result`, payload, params);
  submitLatency.add(Date.now() - startTime);

  if (res.status === 200) {
    submitSuccessRate.add(1);
    check(res, {
      'submit ok': (r) => r.status === 200,
      'points awarded valid': (r) => JSON.parse(r.body).pointsAwarded !== undefined,
    });
  } else {
    submitSuccessRate.add(0);
  }

  sleep(0.01);
}
