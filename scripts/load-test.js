import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const homepageLatency = new Trend('homepage_latency');
const readerLatency = new Trend('reader_latency');
const searchLatency = new Trend('search_latency');

export const options = {
  scenarios: {
    // Scenario 1: 100 Virtual Users browsing public homepage
    homepage_browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'browseHomepage',
    },
    // Scenario 2: 50 Virtual Users reading articles
    article_reading: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'readArticles',
    },
    // Scenario 3: 20 Virtual Users executing search and discovery queries
    search_discovery: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'searchArticles',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    errors: ['rate<0.01'],                          // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function browseHomepage() {
  const res = http.get(`${BASE_URL}/`, {
    headers: { 'Accept': 'text/html' },
    tags: { name: 'Homepage' },
  });

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'has security headers': (r) => r.headers['X-Frame-Options'] === 'DENY',
  });

  homepageLatency.add(res.timings.duration);
  errorRate.add(!success);
  sleep(1);
}

export function readArticles() {
  // Test catalog browsing then reading
  const catalogRes = http.get(`${BASE_URL}/articles`, {
    tags: { name: 'ArticlesCatalog' },
  });

  const successCatalog = check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
  });
  errorRate.add(!successCatalog);
  sleep(0.5);

  const articleRes = http.get(`${BASE_URL}/articles/renewable-energy-future`, {
    tags: { name: 'ArticleDetail' },
  });

  const successArticle = check(articleRes, {
    'article status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  readerLatency.add(articleRes.timings.duration);
  errorRate.add(!successArticle);
  sleep(2);
}

export function searchArticles() {
  const query = 'technology';
  const res = http.get(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
    tags: { name: 'SearchApi' },
  });

  const success = check(res, {
    'search api returns 200': (r) => r.status === 200,
    'content type is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  searchLatency.add(res.timings.duration);
  errorRate.add(!success);
  sleep(0.5);
}
