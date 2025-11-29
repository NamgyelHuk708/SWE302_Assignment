import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';
import { getAuthHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50 users
    { duration: '5m', target: 50 },    // Stay at 50 for 5 minutes
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 for 5 minutes
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 for 5 minutes
    { duration: '2m', target: 300 },   // Beyond normal load
    { duration: '5m', target: 300 },   // Stay at peak
    { duration: '5m', target: 0 },     // Ramp down gradually
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // More relaxed threshold
    http_req_failed: ['rate<0.1'],     // Allow up to 10% errors
  },
};

export function setup() {
  // Setup: Create test user and get token
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

  // Test most critical endpoints under stress
  let response = http.get(`${BASE_URL}/articles`, authHeaders);
  check(response, {
    'articles status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 3000,
  });
  sleep(1);

  // Test tags endpoint
  response = http.get(`${BASE_URL}/tags`, authHeaders);
  check(response, {
    'tags status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // Test user endpoint
  response = http.get(`${BASE_URL}/user`, authHeaders);
  check(response, {
    'user status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function teardown(data) {
  console.log('Stress test completed');
}
