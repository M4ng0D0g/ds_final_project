import fs from 'fs';
import path from 'path';

/**
 * 建立並輸出 HTML 報告
 * @param {Object} stats - 來自 analyzer.js 的統計數據
 * @param {Object} bottleneckResult - 來自 bottleneck.js 的分析結果
 * @param {string} outputPath - 要輸出的 HTML 檔案路徑
 */
export function buildReport(stats, bottleneckResult, outputPath) {
  // 1. 計算全域概況 (綜合三個 API 的表現)
  const totalRequests = stats.total;
  const totalErrors = stats.errors;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  
  // 2. 決定網頁上的狀態顏色樣式
  let statusColor = '#22c55e'; // 綠色 (HEALTHY / STABLE)
  if (bottleneckResult.status === 'WARNING') statusColor = '#eab308'; // 黃色
  if (bottleneckResult.status === 'CRITICAL' || bottleneckResult.status === 'UNSTABLE') statusColor = '#ef4444'; // 紅色

  // 3. 組合精美的 HTML 內容 (加入了表格與 CSS 優化)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>k6 效能測試報告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; }
    h1 { margin-top: 0; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #334155; margin-top: 0; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; color: white; font-weight: bold; font-size: 1.1em; background-color: ${statusColor}; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; color: #475569; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .reason { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; color: #991b1b; margin-top: 12px; border-radius: 0 4px 4px 0; }
  </style>
</head>
<body>

  <h1>📊 k6 自動化效能測試報告</h1>

  <!-- 狀態區塊 -->
  <div class="card">
    <h2>🔥 目前系統健康狀態</h2>
    <div class="status-badge">${bottleneckResult.status || 'UNKNOWN'}</div>
    ${bottleneckResult.reason ? `<div class="reason"><strong>原因描述：</strong>${bottleneckResult.reason}</div>` : ''}
  </div>

  <!-- 全域統計摘要 -->
  <div class="card">
    <h2>📌 測試數據總覽 (Summary)</h2>
    <ul>
      <li><strong>總請求發送次數：</strong> ${totalRequests} 次</li>
      <li><strong>總失敗請求次數：</strong> ${totalErrors} 次</li>
      <li><strong>全域平均錯誤率：</strong> ${errorRate.toFixed(2)}%</li>
      <li><strong>格式錯誤日誌行數：</strong> ${stats.invalidLines || 0} 行</li>
    </ul>
  </div>

  <!-- 各 API 詳細效能排行 -->
  <div class="card">
    <h2>📈 各 API 效能表現詳細清單 (依延遲排序)</h2>
    <table>
      <thead>
        <tr>
          <th>API 名稱</th>
          <th>平均回應時間 (Avg Latency)</th>
          <th>95% 抽樣回應時間 (P95)</th>
        </tr>
      </thead>
      <tbody>
        ${bottleneckResult.ranking.map(item => `
          <tr>
            <td><strong>${item.api}</strong></td>
            <td>${item.avg.toFixed(2)} ms</td>
            <td>${item.p95.toFixed(2)} ms</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

</body>
</html>
  `;

  // 4. 自動建立目標資料夾並寫入檔案
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`✅ 網頁報告已成功輸出至: ${outputPath}`);
}
