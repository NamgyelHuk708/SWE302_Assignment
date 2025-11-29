import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';
import { getAuthHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '2m', target: 50 },     // Ramp up
    { duration: '30m', target: 50 },    // Stay at load for 30 minutes (reduced from 3 hours for assignment)
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
    user: {
      email: 'test@example.com',
      password: 'password'
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (loginRes.status !== 200) {
    const registerRes = http.post(`${BASE_URL}/users`, JSON.stringify({
      user: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (registerRes.status === 200 || registerRes.status === 201) {
      return { token: registerRes.json('user.token') };
    }
  }

  return { token: loginRes.json('user.token') };
}

export default function (data) {
  const authHeaders = getAuthHeaders(data.token);

  // Realistic user behavior
  let response = http.get(`${BASE_URL}/articles`, authHeaders);
  check(response, {
    'articles status is 200': (r) => r.status === 200,
  });
  sleep(3);

  response = http.get(`${BASE_URL}/tags`, authHeaders);
  check(response, {
    'tags status is 200': (r) => r.status === 200,
  });
  sleep(2);

  response = http.get(`${BASE_URL}/user`, authHeaders);
  check(response, {
    'user status is 200': (r) => r.status === 200,
  });
  sleep(3);
}

export function teardown(data) {
  console.log('Soak test completed - Duration: 30 minutes (reduced from 3 hours for assignment purposes)');
}
