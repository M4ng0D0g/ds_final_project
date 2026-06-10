export function measure(fn, metric) {
  const start = Date.now();
  const res = fn();
  metric.add(Date.now() - start);
  return res;
}