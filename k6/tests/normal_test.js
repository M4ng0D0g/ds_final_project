import { sleep } from 'k6';

import { studentFlow } from '../flows/student_flow.js';
import { generateStudentId } from '../core/idgen.js';

export const options = {
  vus: 10,
  duration: '30s',

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {

  // 🧠 每個 VU 一個唯一學生
  const studentId = generateStudentId(__VU);

  // 🚀 執行完整流程
  studentFlow(studentId);

  sleep(1);
}