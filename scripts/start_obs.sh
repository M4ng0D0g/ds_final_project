#!/bin/bash

echo "📦 Starting Prometheus + Grafana..."

docker compose up -d

echo "⏳ Waiting for services..."
sleep 5

echo "📊 Grafana: http://localhost:3000"
echo "📈 Prometheus: http://localhost:9090"