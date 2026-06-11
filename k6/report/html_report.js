import fs from "fs";

// 🧮 核心統計演算法（內嵌負數安全防禦濾網）
function calculateDetailedStats(values, errorsCount) {
  const totalReqs = values.length;
  if (totalReqs === 0) {
    return { total: 0, min: 0, avg: 0, p50: 0, p90: 0, p95: 0, max: 0, errorRate: 0 };
  }
  
  // 🛡️ 安全防禦：將 k6 在高壓連線中斷（EOF）時產生的負數延遲雜訊強制校正為 0
  const cleanedValues = values.map(val => val < 0 ? 0 : val);
  
  const sum = cleanedValues.reduce((acc, val) => acc + val, 0);
  const avg = sum / totalReqs;
  const sorted = [...cleanedValues].sort((a, b) => a - b);
  
  return {
    total: totalReqs,
    min: sorted[0],
    avg: avg,
    p50: sorted[Math.floor(totalReqs * 0.5)],
    p90: sorted[Math.floor(totalReqs * 0.90)],
    p95: sorted[Math.floor(totalReqs * 0.95)],
    max: sorted[totalReqs - 1],
    errorRate: (errorsCount / totalReqs) * 100
  };
}

export async function buildReport(inputPath, outputPath) {
  console.log(`📖 Extracting raw metrics from: ${inputPath}`);
  const rawText = fs.readFileSync(inputPath, "utf-8");
  const lines = rawText.split("\n").filter(line => line.trim() !== "");
  const rawRecords = lines.map(line => {
    try { return JSON.parse(line); } catch (e) { return null; }
  }).filter(record => record !== null);

  // 1️⃣ 定義全校師生雙線的 8 大核心監控端點與中文對照表
  const apiKeys = [
    "Login", "Summary", "Category", 
    "TeacherRegister", "TeacherLogin", "CourseSearch", "CreditProgress", "StudentRecords"
  ];

  const apiLabels = {
    Login: "Login (學生登入驗證)",
    Summary: "Summary (學分數據總覽)",
    Category: "Category (學分分類查詢)",
    TeacherRegister: "Teacher Register (教師註冊)",
    TeacherLogin: "Teacher Login (教師登入驗證)",
    CourseSearch: "Course Search (全校課程檢索)",
    CreditProgress: "Credit Progress (學生進度調閱)",
    StudentRecords: "Student Records (歷年修課紀錄)"
  };

  // 動態初始化儲存體
  const durationData = {};
  const errorData = {};
  apiKeys.forEach(key => {
    durationData[key] = [];
    errorData[key] = 0;
  });
  
  let totalRequests = 0;
  let totalErrors = 0;
  let maxVUs = 0;
  let startTime = null;
  let endTime = null;

  // 2️⃣ 單次線性掃描演算法 O(N) 分流提取數據
  rawRecords.forEach(record => {
    if (!record.data) return;

    if (record.data.time) {
      if (!startTime || record.data.time < startTime) startTime = record.data.time;
      if (!endTime || record.data.time > endTime) endTime = record.data.time;
    }
    if (record.metric === "vus" && record.data.value > maxVUs) {
      maxVUs = record.data.value;
    }

    // 識別 API 節點標籤
    const fullTagName = record.data.tags?.name || "";
    const lowerName = fullTagName.toLowerCase();
    let targetKey = null;

    if (lowerName.includes("teacherregister")) targetKey = "TeacherRegister";
    else if (lowerName.includes("teacherlogin")) targetKey = "TeacherLogin";
    else if (lowerName.includes("coursesearch")) targetKey = "CourseSearch";
    else if (lowerName.includes("creditprogress")) targetKey = "CreditProgress";
    else if (lowerName.includes("studentrecords")) targetKey = "StudentRecords";
    else if (lowerName.includes("login")) targetKey = "Login";
    else if (lowerName.includes("summary")) targetKey = "Summary";
    else if (lowerName.includes("category")) targetKey = "Category";

    // 數據歸類
    if (record.metric === "http_req_duration") {
      totalRequests++;
      if (targetKey) durationData[targetKey].push(record.data.value);
    }
    if (record.metric === "http_req_failed" && record.data.value === 1) {
      totalErrors++;
      if (targetKey) errorData[targetKey]++;
    }
  });

  // 3️⃣ 矩陣運算與瓶頸自動識別
  const stats = {};
  apiKeys.forEach(key => {
    stats[key] = calculateDetailedStats(durationData[key], errorData[key]);
  });

  const statsArr = apiKeys.map(key => ({ name: apiLabels[key], p95: stats[key].p95 }));
  statsArr.sort((a, b) => b.p95 - a.p95);
  const bottleneck = statsArr[0] || { name: "None", p95: 0 };

  const globalSuccessRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests * 100) : 100;
  const durationSec = startTime && endTime ? (new Date(endTime) - new Date(startTime)) / 1000 : 30;
  const rps = durationSec > 0 ? (totalRequests / durationSec) : 0;

  // 健康度評級
  let systemStatus = "STABLE";
  let statusColor = "#22c55e";
  if (globalSuccessRate < 99 || bottleneck.p95 > 500) { systemStatus = "DEGRADED"; statusColor = "#f97316"; }
  if (globalSuccessRate < 95 || totalErrors > 20) { systemStatus = "WARNING"; statusColor = "#eab308"; }
  if (globalSuccessRate < 90 || bottleneck.p95 > 1500) { systemStatus = "UNSTABLE"; statusColor = "#ef4444"; }

  // 動態組裝 HTML 表格 Rows
  const tableRowsHtml = apiKeys.map(key => `
    <tr>
      <td><strong>${apiLabels[key]}</strong></td>
      <td>${stats[key].total}</td>
      <td>${stats[key].min.toFixed(1)} ms</td>
      <td>${stats[key].p50.toFixed(1)} ms</td>
      <td>${stats[key].p90.toFixed(1)} ms</td>
      <td style="font-weight:700; color:#4f46e5;">${stats[key].p95.toFixed(1)} ms</td>
      <td>${stats[key].max.toFixed(1)} ms</td>
      <td class="${stats[key].errorRate > 0 ? 'error-text' : ''}">${stats[key].errorRate.toFixed(2)}%</td>
    </tr>
  `).join("");

  // 動態組裝下層流量分配數據表 Rows
  const trafficRowsHtml = apiKeys.map(key => {
    const percent = totalRequests > 0 ? (stats[key].total / totalRequests * 100).toFixed(1) : "0.0";
    return `
      <tr>
        <td><strong>${key}</strong></td>
        <td>${stats[key].total.toLocaleString()}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; background: #f1f5f9; height: 6px; border-radius: 3px; overflow: hidden; border: 1px solid #e2e8f0;">
              <div style="background: linear-gradient(to right, #6366f1, #4f46e5); width: ${percent}%; height: 100%;"></div>
            </div>
            <span style="font-weight: 700; min-width: 45px; text-align: right; color: #475569;">${percent}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // 4️⃣ 生成包含全鏈路大面板的精美 UI 網頁
  const html = `
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <title>k6 全鏈路師生監控報告</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      :root {
        --bg-main: #f8fafc;
        --text-main: #0f172a;
        --text-muted: #64748b;
        --border-color: #e2e8f0;
        --card-bg: #ffffff;
        --primary: #4f46e5;
        --primary-light: #eef2ff;
      }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; background: var(--bg-main); color: var(--text-main); margin: 0; line-height: 1.5; }
      .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-color); padding-bottom: 20px; margin-bottom: 30px; }
      .header-title h1 { margin: 0; font-size: 2.2rem; font-weight: 800; background: linear-gradient(to right, #3b82f6, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .header-meta { display: flex; gap: 15px; font-size: 0.9rem; color: var(--text-muted); }
      .badge { background: var(--primary-light); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-weight: 600; text-transform: uppercase; }
      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
      .kpi-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; overflow: hidden; }
      .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--primary); }
      .kpi-title { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .kpi-value { font-size: 2rem; font-weight: 700; margin-top: 8px; color: var(--text-main); }
      .main-grid { display: grid; grid-template-columns: 2.5fr 1fr; gap: 25px; margin-bottom: 30px; }
      .card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      .card h2 { font-size: 1.25rem; font-weight: 700; margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
      .table-wrapper { overflow-x: auto; margin-top: 15px; }
      table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
      th { background: #f1f5f9; color: var(--text-muted); font-weight: 600; padding: 14px; border-bottom: 2px solid var(--border-color); }
      td { padding: 14px; border-bottom: 1px solid var(--border-color); color: #334155; }
      tr:hover { background-color: #f8fafc; }
      .error-text { color: #ef4444; font-weight: 600; }
      .status-box { font-size: 2.2rem; font-weight: 900; text-align: center; padding: 15px; border-radius: 12px; margin-top: 10px; letter-spacing: 0.05em; }
      .bottleneck-box { background: #fff7ed; border: 1px dashed #ffedd5; padding: 15px; border-radius: 12px; margin-top: 15px; }
      .chart-container { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 25px; }
    </style>
  </head>
  <body>

    <div class="header-container">
      <div class="header-title">
        <h1>🚀 Full Observability Campus Insights</h1>
        <div class="header-meta" style="margin-top: 5px;">
          <span>📅 綜合報告生成時間: <strong>${new Date().toLocaleString()}</strong></span>
          <span>⏱️ 測試歷時: <strong>${durationSec.toFixed(1)} 秒</strong></span>
        </div>
      </div>
      <div>
        <span class="badge">Mixed Traffic Mode</span>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card" style="--primary: #3b82f6">
        <div class="kpi-title">總請求發送量 (Total Requests)</div>
        <div class="kpi-value">${totalRequests.toLocaleString()}</div>
      </div>
      <div class="kpi-card" style="--primary: #10b981">
        <div class="kpi-title">整體成功率 (Success Rate)</div>
        <div class="kpi-value" style="color: ${globalSuccessRate < 95 ? '#ef4444' : '#10b981'}">${globalSuccessRate.toFixed(2)}%</div>
      </div>
      <div class="kpi-card" style="--primary: #ec4899">
        <div class="kpi-title">平均吞吐量 (Avg Throughput)</div>
        <div class="kpi-value">${rps.toFixed(1)} <span style="font-size: 1rem; color: var(--text-muted)">RPS</span></div>
      </div>
      <div class="kpi-card" style="--primary: #6366f1">
        <div class="kpi-title">最大測試併發 (Max VUs)</div>
        <div class="kpi-value">${maxVUs} <span style="font-size: 1rem; color: var(--text-muted)">VUs</span></div>
      </div>
    </div>

    <div class="main-grid">
      <div class="card">
        <h2>📊 師生端各節點效能完整矩陣 (Metrics Data Matrix)</h2>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>API 節點名稱</th>
                <th>請求總數</th>
                <th>最小延遲 (Min)</th>
                <th>中位數 (p50)</th>
                <th>九成用戶 (p90)</th>
                <th>高壓指標 (p95)</th>
                <th>最大延遲 (Max)</th>
                <th>錯誤率 (%)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 20px;">
        <div>
          <h2>🚦 System Health</h2>
          <div class="status-box" style="color: ${statusColor}; background: ${statusColor}12;">
            ${systemStatus}
          </div>
        </div>
        
        <div class="bottleneck-box" style="margin-top: 0;">
          <h3 style="margin: 0 0 8px 0; color: #c2410c; font-size: 0.95rem; text-transform: uppercase;">🔥 Performance Bottleneck</h3>
          <p style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #9a3412;">👑 ${bottleneck.name}</p>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #7c2d12;">該端點的 p95 延遲高達 <strong>${bottleneck.p95.toFixed(1)} ms</strong>，為目前系統中阻礙併發擴展的核心死穴。</p>
        </div>
      </div>
    </div>

    <div class="chart-container">
      <div class="card">
        <h3>📊 8 大端點多維度延遲對比 (Latency Distribution Breakdown)</h3>
        <canvas id="latencyChart"></canvas>
      </div>
      
      <div class="card">
        <h3>📈 校園流量分配實際數據 (Traffic Load Distribution)</h3>
        <div class="table-wrapper">
          <table style="font-size: 0.9rem;">
            <thead>
              <tr>
                <th>API 節點縮寫</th>
                <th>請求總數</th>
                <th>負載權重佔比 (%)</th>
              </tr>
            </thead>
            <tbody>
              ${trafficRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <script>
      // 📊 1. 響應時間多維度長條圖 (橫向配置)
      new Chart(document.getElementById('latencyChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(apiKeys)},
          datasets: [
            {
              label: '中位數延遲 (p50)',
              data: ${JSON.stringify(apiKeys.map(k => parseFloat(stats[k].p50.toFixed(1))))},
              backgroundColor: '#93c5fd'
            },
            {
              label: '九成用戶延遲 (p90)',
              data: ${JSON.stringify(apiKeys.map(k => parseFloat(stats[k].p90.toFixed(1))))},
              backgroundColor: '#3b82f6'
            },
            {
              label: '高壓臨界延遲 (p95)',
              data: ${JSON.stringify(apiKeys.map(k => parseFloat(stats[k].p95.toFixed(1))))},
              backgroundColor: '#4f46e5'
            }
          ]
        },
        options: { 
          responsive: true, 
          indexAxis: 'y', 
          plugins: { legend: { position: 'bottom' } },
          scales: { x: { beginAtZero: true, title: { display: true, text: 'Milliseconds (ms)' } } } 
        }
      });

      // 💡 核心修改三：此處已完全拔除 apiChart 圓餅圖的 JS 建構式，防止因 Canvas 遺失噴錯
    </script>
  </body>
  </html>
  `;

  // 5️⃣ 寫入實體 HTML 檔案
  fs.writeFileSync(outputPath, html);
  console.log(`\n🎉 Professional HTML report compiled successfully! -> ${outputPath}`);
}