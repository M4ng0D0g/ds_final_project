#!/bin/bash

MODE=$1

if [ -z "$MODE" ]; then
  echo "❌ usage: ./report.sh normal|peak|stress"
  exit 1
fi

echo "================================"
echo "🚀 Full Observability Pipeline"
echo "Mode: $MODE"
echo "================================"

RAW_FILE="k6/report/raw/${MODE}.json"
HTML_FILE="k6/report/html/${MODE}.html"

mkdir -p report/raw
mkdir -p report/html

# 1️⃣ 啟動 infra
echo "📦 Starting infra..."
docker compose up -d

echo "⏳ Waiting for Prometheus..."
sleep 10

curl -s http://localhost:9090/-/ready > /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Prometheus not ready"
  exit 1
fi

echo "✅ Prometheus ready"

# 2️⃣ 跑 k6（允許 fail 但不中斷）
echo "🔥 Running k6..."

K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
k6 run k6/tests/${MODE}_test.js \
--out experimental-prometheus-rw \
--out json=$RAW_FILE

K6_EXIT=$?

if [ $K6_EXIT -ne 0 ]; then
  echo "⚠️ k6 finished with errors (report will still be generated)"
fi

echo "📊 k6 raw data saved: $RAW_FILE"

# 3️⃣ 生成 HTML report（正確方式🔥）
echo "🧾 Generating HTML report..."

node --input-type=module <<EOF
import { buildReport } from './k6/report/html_report.js';

// ✨ 修正：同時傳入原始 JSON 路徑與 HTML 輸出路徑
await buildReport('$RAW_FILE', '$HTML_FILE');

EOF

if [ $? -ne 0 ]; then
  echo "❌ HTML report failed"
  exit 1
fi

if [ $? -ne 0 ]; then
  echo "❌ HTML report failed"
  exit 1
fi

echo ""
echo "================================"
echo "✅ DONE"
echo "📊 Grafana   : http://localhost:3000"
echo "📈 Prometheus: http://localhost:9090"
echo "📄 HTML      : $HTML_FILE"
echo "================================"