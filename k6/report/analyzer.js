import fs from 'fs';

function safeParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export function analyze(file) {
  const lines = fs.readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean);

  const metrics = {
    login: [],
    summary: [],
    category: [],
    errors: 0,
  };

  for (const line of lines) {
    const data = safeParse(line);
    if (!data || data.type !== 'Point') continue;

    const metric = data.metric;
    const value = data.data?.value;

    if (typeof value !== 'number') continue;

    if (metric === 'login_latency') metrics.login.push(value);
    if (metric === 'summary_latency') metrics.summary.push(value);
    if (metric === 'category_latency') metrics.category.push(value);

    if (metric === 'api_errors') metrics.errors += value;
  }

  const avg = arr =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const p95 = arr => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)];
  };

  return {
    avgLogin: avg(metrics.login),
    avgSummary: avg(metrics.summary),
    avgCategory: avg(metrics.category),

    p95Login: p95(metrics.login),
    p95Summary: p95(metrics.summary),
    p95Category: p95(metrics.category),

    errors: metrics.errors,
  };
}