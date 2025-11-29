import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';
import { getAuthHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Normal load
    { duration: '30s', target: 10 },    // Stable
    { duration: '10s', target: 500 },   // Sudden spike!
    { duration: '3m', target: 500 },    // Stay at spike
    { duration: '10s', target: 10 },    // Back to normal
    { duration: '3m', target: 10 },     // Recovery period
    { duration: '10s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Very relaxed threshold for spike
    http_req_failed: ['rate<0.2'],     // Allow up to 20% errors during spike
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

  const response = http.get(`${BASE_URL}/articles`, authHeaders);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response received': (r) => r.status !== 0,
  });
  
  sleep(0.5); // Shorter sleep during spike test
}

export function teardown(data) {
  console.log('Spike test completed');
}
