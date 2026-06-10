export function findBottleneck(stats) {
  const safe = (v) => (typeof v === 'number' ? v : 0);

  const list = [
    {
      api: 'login',
      avg: safe(stats.login?.avg),
      p95: safe(stats.login?.p95),
    },
    {
      api: 'summary',
      avg: safe(stats.summary?.avg),
      p95: safe(stats.summary?.p95),
    },
    {
      api: 'category',
      avg: safe(stats.category?.avg),
      p95: safe(stats.category?.p95),
    },
  ];

  // 1. latency score（p95 > avg 更重要）
  const scored = list.map(item => ({
    ...item,
    latencyScore: item.p95 * 0.7 + item.avg * 0.3,
  }));

  scored.sort((a, b) => b.latencyScore - a.latencyScore);

  const worstApi = scored[0];

  // 2. system status
  const errorCount = safe(stats.errors);

  let status = 'HEALTHY';
  let bottleneckReason = '';

  if (errorCount > 0) {
    status = 'CRITICAL';
    bottleneckReason =
      `系統發生 ${errorCount} 次錯誤。` +
      `最嚴重 API: ${worstApi.api}，p95=${worstApi.p95.toFixed(2)}ms`;
  } else if (worstApi.p95 > 1500) {
    status = 'WARNING';
    bottleneckReason =
      `API ${worstApi.api} 延遲過高，p95=${worstApi.p95.toFixed(2)}ms，已接近瓶頸。`;
  } else {
    bottleneckReason =
      `系統運行正常，最慢 API: ${worstApi.api}（p95=${worstApi.p95.toFixed(2)}ms）`;
  }

  return {
    status,
    bottleneck: worstApi,
    reason: bottleneckReason,
    ranking: scored,
  };
}