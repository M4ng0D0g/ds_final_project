import { Trend, Counter } from 'k6/metrics';

export const metrics = {
  register: new Trend('register_latency'),
  login: new Trend('login_latency'),
  summary: new Trend('summary_latency'),
  category: new Trend('category_latency'),

  errors: new Counter('api_errors'),
};