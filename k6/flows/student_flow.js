import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, headers } from '../core/config.js';
import { metrics } from '../core/metrics.js';

export function studentFlow(studentId) {

  // =========================
  // 1️⃣ REGISTER (idempotent)
  // =========================
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

  metrics.register.add(registerRes.timings.duration);

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
  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({
      id: studentId,
      password: "Password123!"
    }),
    { headers }
  );

  metrics.login.add(loginRes.timings.duration);

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
  // 3️⃣ SUMMARY (已修正)
  // =========================
  // 修正點：將 null 改為空字串 ""，避免 FastAPI 在處理 application/json 時因 null 觸發解包崩潰
  // 優化點：改用 k6 內建的精準 timings 數據
  const res1 = http.post(`${BASE_URL}/v1/graduation/summary`, "", auth);

  metrics.summary.add(res1.timings.duration);

  check(res1, { 'summary ok': r => r.status === 200 });

  if (res1.status !== 200) {
    metrics.errors.add(1);
    // 補上 Summary 專屬的除錯雷達，直接印出原始 body 字串，絕不噴出 [object Object]
    console.log(`❌ Summary failed | ${res1.status} | ${res1.body}`);
  }

  // =========================
  // 4️⃣ CATEGORY
  // =========================
  // 修正點：在請求的 options 中加入 tags.name，強行指引 html_report.js 進行歸類
  const categoryParams = {
    headers: auth.headers,
    tags: { name: 'Category' } // 如果報表是比對英文，用 'Category'；若比對中文則改為 'Category (分類查詢)'
  };

  const res2 = http.get(`${BASE_URL}/v1/graduation/categories/major1`, categoryParams);

  metrics.category.add(res2.timings.duration);

  check(res2, { 'category ok': r => r.status === 200 });

  if (res2.status !== 200) {
    metrics.errors.add(1);
    console.log(`❌ Category failed | ${res2.status} | ${res2.body}`);
  }

  return token;
}