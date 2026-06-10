import { studentFlow } from '../flows/student_flow.js';
import { generateStudentId } from '../core/idgen.js';

export const options = {
  scenarios: {
    peak: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',

      preAllocatedVUs: 500,
      maxVUs: 1500,

      stages: [
        { duration: '1m', target: 200 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 100 },
      ],
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {

  // 🔥 更真實的 user distribution
  const studentId = generateStudentId(__VU + __ITER * 1000);

  studentFlow(studentId);
}