import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, headers } from '../core/config.js';
import { metrics } from '../core/metrics.js';

export function studentFlow(studentId) {

  // =========================
  // 1️⃣ REGISTER (idempotent)
  // =========================
  const t0 = Date.now();

  const registerRes = http.post(
    `${BASE_URL}/v1/auth/register/student`,
    JSON.stringify({
      id: studentId,
      name: `Student_${studentId}`,
      password: "Password123!",
      password_confirm: "Password123!"
    }),
    { headers }
  );

  const registerLatency = Date.now() - t0;
  metrics.register.add(registerLatency);

  // 409 = already exists (OK for load test)
  const registerOk =
    registerRes.status === 200 ||
    registerRes.status === 201 ||
    registerRes.status === 409;

  if (!registerOk) {
    metrics.errors.add(1);
    console.log(`❌ Register failed | ${registerRes.status} | ${registerRes.body}`);
    return null;
  }

  // =========================
  // 2️⃣ LOGIN
  // =========================
  const t1 = Date.now();

  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({
      id: studentId,
      password: "Password123!"
    }),
    { headers }
  );

  metrics.login.add(Date.now() - t1);

  if (loginRes.status !== 200) {
    metrics.errors.add(1);
    console.log(`❌ Login failed | ${loginRes.status} | ${loginRes.body}`);
    return null;
  }

  let token;
  try {
    token = loginRes.json().data.token;
  } catch (e) {
    metrics.errors.add(1);
    console.log(`❌ Login JSON parse failed`);
    return null;
  }

  const auth = {
    headers: {
      'Content-Type': 'application/json',
      token
    }
  };

  // =========================
  // 3️⃣ SUMMARY
  // =========================
  const t2 = Date.now();
  const res1 = http.post(`${BASE_URL}/v1/graduation/summary`, null, auth);

  metrics.summary.add(Date.now() - t2);

  check(res1, { 'summary ok': r => r.status === 200 });

  if (res1.status !== 200) {
    metrics.errors.add(1);
  }

  // =========================
  // 4️⃣ CATEGORY
  // =========================
  const t3 = Date.now();
  const res2 = http.get(`${BASE_URL}/v1/graduation/categories/major1`, auth);

  metrics.category.add(Date.now() - t3);

  check(res2, { 'category ok': r => r.status === 200 });

  if (res2.status !== 200) {
    metrics.errors.add(1);
  }

  return token;
}