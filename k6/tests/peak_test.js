import { studentFlow } from '../flows/student_flow.js';
import { teacherFlow } from '../flows/teacher_flow.js'; // 💡 核心注入：引入教師業務流
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
        { duration: '1m', target: 200 }, // 1分鐘內快速爬升到 200 RPS
        { duration: '2m', target: 500 }, // 核心高壓：維持 500 RPS 瘋狂轟炸 2 分鐘！
        { duration: '1m', target: 100 }, // 1分鐘內緩步退場
      ],
    },
  },

  thresholds: {
    // 考慮到 500 RPS 單機極限壓力，容許錯誤率設在 2%，p(95) 反應時間及格線為 1.5 秒
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
  },
};

const VALID_DEPARTMENTS = [
  '000', '101', '102', '103', '104', '162', '202', '203', '204', '205', 
  '206', '207', '208', '209', '301', '302', '303', '304', '305', '306', 
  '307', '308', '401', '402', '403', '404', '405', '501', '502', '504', 
  '506', '507', '508', '509', '510', '5T1', '601', '701', '702', '703', 
  'B00', 'ZU1'
];

export default function () {
  // 1. 動態計算唯一序號（防範 ramping 模式下併發撞車）
  const uniqueIdOffset = __VU + __ITER * 1500;
  
  // 2. 生成完全合規的政大師生編碼格式
  const randomDept = VALID_DEPARTMENTS[uniqueIdOffset % VALID_DEPARTMENTS.length];
  const studentSerial = 100 + (uniqueIdOffset % 899);
  
  const studentId = `113${randomDept}${studentSerial}`;
  const teacherId = `999${randomDept}${studentSerial}`;

  // 3. 20% 流量執行教師聯動流，80% 流量執行常規學生流
  if (uniqueIdOffset % 5 === 0) {
    // 🛡️ 聯動防禦：先幫老師把欲調閱的學生資料在資料庫裡初始化好
    studentFlow(studentId);
    
    // 老師隨後切入，調閱、檢索全校課程，對資料庫發動 Heavy Reads 猛攻
    teacherFlow(teacherId, randomDept, studentId);
  } else {
    // 其餘 80% 流量維持純學生高頻操作
    studentFlow(studentId);
  }
}