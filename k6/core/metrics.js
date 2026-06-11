import { Trend, Counter } from 'k6/metrics';

export const metrics = {
  errors: new Counter('api_errors'),
  
  // 學生端專屬指標
  register: new Trend('student_register_duration'),
  login: new Trend('student_login_duration'),
  summary: new Trend('student_summary_duration'),
  category: new Trend('student_category_duration'),
  
  // 教師端專屬指標
  teacherRegister: new Trend('teacher_register_duration'),
  teacherLogin: new Trend('teacher_login_duration'),
  courseSearch: new Trend('course_search_duration'),
  creditProgress: new Trend('credit_progress_duration'),
  studentRecords: new Trend('student_records_duration'),
};