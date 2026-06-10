import { VALID_DEPARTMENTS } from './config.js';

function pad(n, size) {
  return String(n).padStart(size, '0');
}

export function generateStudentId() {
  const dept = VALID_DEPARTMENTS[Math.floor(Math.random() * VALID_DEPARTMENTS.length)];

  // 1. 使用 k6 專屬的唯一的序號算法 (從 0 開始遞增)
  // 公式：(當前小兵編號 - 1) * 每個小兵跑幾次 + 當前是第幾次跑
  // 這樣算出來的數字，不論哪個 VU 在哪一輪，都絕對是唯一的
  const globalId = (__VU - 1) * 100 + __ITER; 

  // 2. 取後 3 碼並補零（範圍 000 ~ 999）
  const unique = pad(globalId % 1000, 3);

  return `113${dept}${unique}`;
}

export function generateTeacherId() {
  const dept = VALID_DEPARTMENTS[Math.floor(Math.random() * VALID_DEPARTMENTS.length)];

  // 老師也使用同樣邏輯，確保 3 碼獨立
  const globalId = (__VU - 1) * 100 + __ITER; 
  const unique = pad(globalId % 1000, 3);

  return `999${dept}${unique}`;
}
