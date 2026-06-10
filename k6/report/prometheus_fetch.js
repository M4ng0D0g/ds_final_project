import fetch from "node-fetch";

const PROM = "http://localhost:9090/api/v1/query";

async function query(q) {
  const res = await fetch(`${PROM}?query=${encodeURIComponent(q)}`);
  const json = await res.json();
  return json.data.result;
}

export async function fetchMetrics() {
  const [qps, errorRate, p95, vus] = await Promise.all([
    query(`rate(k6_http_reqs_total[1m])`),
    query(`rate(k6_http_req_failed[1m])`),
    query(`k6_http_req_duration_p95`),
    query(`k6_vus`)
  ]);

  return {
    qps,
    errorRate,
    p95,
    vus
  };
}