import { studentFlow } from '../flows/student_flow.js';
import { generateStudentId } from '../core/idgen.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',

      preAllocatedVUs: 800,
      maxVUs: 3000,

      stages: [
        { duration: '30s', target: 300 },
        { duration: '30s', target: 600 },
        { duration: '30s', target: 1000 },
        { duration: '30s', target: 1500 },
      ],
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {

  // 🧠 每個 VU 有穩定 identity（避免 collision）
  const studentId = generateStudentId(__VU);

  // 🚀 執行完整學生行為流
  studentFlow(studentId);
}