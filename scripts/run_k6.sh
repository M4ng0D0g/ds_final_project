#!/bin/bash

MODE=$1

if [ -z "$MODE" ]; then
  echo "Usage: ./run_k6.sh normal|peak|stress"
  exit 1
fi

echo "🚀 Starting k6: $MODE"

K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
k6 run k6/tests/${MODE}_test.js