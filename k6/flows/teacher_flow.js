import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, headers } from '../core/config.js';
import { metrics } from '../core/metrics.js';

/**
 * 教師端核心業務併發流程 (優化效能與指標回傳版)
 * @param {string} teacherId - 符合格式的教師 ID (如 999703123)
 * @param {string} randomDept - 該次疊代抽選的合法 3 碼科系代碼
 * @param {string} targetStudentId - 該教師預計調閱資料的目標學生 ID
 */
export function teacherFlow(teacherId, randomDept, targetStudentId) {

  // ==========================================
  // 1️⃣ TEACHER REGISTER (教師註冊)
  // ==========================================
  const registerRes = http.post(
    `${BASE_URL}/v1/auth/register/teacher`,
    JSON.stringify({
      id: teacherId,
      name: `Teacher_${teacherId}`,
      password: "Password123!",
      password_confirm: "Password123!",
      department_id: randomDept 
    }),
    { headers, tags: { name: 'TeacherRegister' } }
  );

  if (metrics.teacherRegister) metrics.teacherRegister.add(registerRes.timings.duration);

  const registerOk =
    registerRes.status === 200 ||
    registerRes.status === 201 ||
    registerRes.status === 409;

  check(registerRes, { 'teacher register ok': () => registerOk });

  if (!registerOk) {
    metrics.errors.add(1);
    return null;
  }

  // ==========================================
  // 2️⃣ TEACHER LOGIN (教師登入驗證)
  // ==========================================
  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({
      id: teacherId,
      password: "Password123!"
    }),
    { headers, tags: { name: 'TeacherLogin' } }
  );

  if (metrics.teacherLogin) metrics.teacherLogin.add(loginRes.timings.duration);

  const loginOk = loginRes.status === 200;
  check(loginRes, { 'teacher login ok': () => loginOk });

  if (!loginOk) {
    metrics.errors.add(1);
    return null;
  }

  let token;
  try {
    token = loginRes.json().data.token;
  } catch (e) {
    metrics.errors.add(1);
    return null;
  }

  const auth = {
    headers: {
      'Content-Type': 'application/json',
      token
    }
  };

  if (token) {
    // ==========================================
    // 3️⃣ COURSE SEARCH (全校課程檢索)
    // ==========================================
    const searchPayload = JSON.stringify({
      keyword: "資訊", 
      limit: 20
    });
    const searchRes = http.post(
      `${BASE_URL}/v1/course/search`, 
      searchPayload, 
      Object.assign({}, auth, { tags: { name: 'CourseSearch' } })
    );
    
    if (metrics.courseSearch) metrics.courseSearch.add(searchRes.timings.duration);
    
    const searchOk = searchRes.status === 200;
    check(searchRes, { 'course search ok': () => searchOk });
    
    if (!searchOk) {
      metrics.errors.add(1);
    }

    // ==========================================
    // 4️⃣ CREDIT PROGRESS (批量調閱學生學分進度)
    // ==========================================
    const progressPayload = JSON.stringify({
      student_id: targetStudentId 
    });
    const progressRes = http.post(
      `${BASE_URL}/v1/teachers/students/credit-progress`,
      progressPayload,
      Object.assign({}, auth, { tags: { name: 'CreditProgress' } })
    );
    
    if (metrics.creditProgress) metrics.creditProgress.add(progressRes.timings.duration);
    
    const progressOk = progressRes.status === 200;
    check(progressRes, { 'credit progress ok': () => progressOk });
    
    if (!progressOk) {
      metrics.errors.add(1);
    }

    // ==========================================
    // 5️⃣ GET COURSE RECORDS (調閱特定學生修課紀錄)
    // ==========================================
    const recordsRes = http.get(
      `${BASE_URL}/v1/teachers/students/${targetStudentId}`,
      Object.assign({}, auth, { tags: { name: 'StudentRecords' } })
    );
    
    if (metrics.studentRecords) metrics.studentRecords.add(recordsRes.timings.duration);
    
    const recordsOk = recordsRes.status === 200;
    check(recordsRes, { 'student records ok': () => recordsOk });
    
    if (!recordsOk) {
      metrics.errors.add(1);
    }
  }

  return token;
}