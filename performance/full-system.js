import http from 'k6/http';
import { check, fail, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const profile = (__ENV.PROFILE || 'smoke').toLowerCase();
const supportedProfiles = ['smoke', 'load', 'stress'];

if (!supportedProfiles.includes(profile)) {
  throw new Error(`Unsupported PROFILE "${profile}". Use smoke, load, or stress.`);
}

const targetVus = positiveInteger(__ENV.TARGET_VUS, 10);
const duration = __ENV.TEST_DURATION || '1m';
const rampDuration = __ENV.RAMP_DURATION || '15s';
const p95Limit = positiveInteger(__ENV.P95_MS, 1000);
const p99Limit = positiveInteger(__ENV.P99_MS, 2000);
const maxFailureRate = decimal(__ENV.MAX_FAILURE_RATE, 0.01);
const minCheckRate = decimal(__ENV.MIN_CHECK_RATE, 0.99);
const measuredServices = ['frontend', 'auth', 'catalogue-inventory', 'purchasing-supplier', 'sales-reporting'];

const serviceRequests = new Counter('medzo_service_requests');
const serviceDuration = new Trend('medzo_service_duration', true);
const serviceFailures = new Rate('medzo_service_failures');

const profiles = {
  smoke: {
    executor: 'shared-iterations',
    vus: 1,
    iterations: 1,
    maxDuration: '30s',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: rampDuration, target: targetVus },
      { duration, target: targetVus },
      { duration: rampDuration, target: 0 },
    ],
    gracefulRampDown: '15s',
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '20s', target: targetVus },
      { duration: '30s', target: targetVus * 2 },
      { duration: '30s', target: targetVus * 3 },
      { duration: '20s', target: 0 },
    ],
    gracefulRampDown: '20s',
  },
};

const thresholds = {
  checks: [{ threshold: `rate>${minCheckRate}`, abortOnFail: false }],
  http_req_failed: [{ threshold: `rate<${maxFailureRate}`, abortOnFail: false }],
  http_req_duration: [
    { threshold: `p(95)<${p95Limit}`, abortOnFail: false },
    { threshold: `p(99)<${p99Limit}`, abortOnFail: false },
  ],
  medzo_service_failures: [{ threshold: `rate<${maxFailureRate}`, abortOnFail: false }],
  medzo_service_duration: [
    { threshold: `p(95)<${p95Limit}`, abortOnFail: false },
    { threshold: `p(99)<${p99Limit}`, abortOnFail: false },
  ],
};

for (const service of measuredServices) {
  thresholds[`medzo_service_requests{service:${service}}`] = ['count>0'];
  thresholds[`medzo_service_failures{service:${service}}`] = [`rate<${maxFailureRate}`];
  thresholds[`medzo_service_duration{service:${service}}`] = [
    `p(95)<${p95Limit}`,
    `p(99)<${p99Limit}`,
  ];
}

export const options = {
  scenarios: {
    full_system_read_journey: profiles[profile],
  },
  thresholds,
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  tags: {
    suite: 'medzo-full-system',
    profile,
  },
};

const targets = {
  frontend: requiredUrl('FRONTEND_URL'),
  auth: requiredUrl('AUTH_API_URL'),
  catalogueInventory: requiredUrl('CATALOGUE_INVENTORY_API_URL'),
  purchasingSupplier: requiredUrl('PURCHASING_SUPPLIER_API_URL'),
  salesReporting: requiredUrl('SALES_REPORTING_API_URL'),
};

export function setup() {
  if (__ENV.ACCESS_TOKEN) {
    return { token: __ENV.ACCESS_TOKEN, profile };
  }

  if (!__ENV.TEST_IDENTIFIER || !__ENV.TEST_PASSWORD) {
    fail('Provide ACCESS_TOKEN or both TEST_IDENTIFIER and TEST_PASSWORD. Use a dedicated test account.');
  }

  const response = http.post(
    endpoint(targets.auth, '/api/auth/login'),
    JSON.stringify({ identifier: __ENV.TEST_IDENTIFIER, password: __ENV.TEST_PASSWORD }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { service: 'auth', operation: 'login_setup' },
      timeout: '15s',
    },
  );

  const loginAccepted = check(response, {
    'auth login: status is 200': (result) => result.status === 200,
    'auth login: access token returned': (result) => Boolean(parseJson(result)?.token),
  });

  if (!loginAccepted) {
    fail(`Authentication setup failed with HTTP ${response.status}.`);
  }

  return { token: parseJson(response).token, profile };
}

export default function fullSystemReadJourney(data) {
  const authenticatedHeaders = {
    Accept: 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('Public frontend and catalogue', () => {
    verifyHtml('frontend', 'home_page', targets.frontend);
    verifyJson(
      'catalogue-inventory',
      'public_catalogue',
      endpoint(targets.catalogueInventory, '/api/catalogue/medicines/public?page=1&pageSize=12'),
      {},
      pagedPayload,
    );
  });

  group('Authenticated service workflow', () => {
    verifyStatus(
      'auth',
      'session',
      endpoint(targets.auth, '/api/auth/session'),
      authenticatedHeaders,
      204,
    );
    verifyJson(
      'catalogue-inventory',
      'catalogue_search',
      endpoint(targets.catalogueInventory, '/api/catalogue/medicines?page=1&pageSize=20'),
      authenticatedHeaders,
      pagedPayload,
    );
    verifyJson(
      'catalogue-inventory',
      'inventory_items',
      endpoint(targets.catalogueInventory, '/api/inventory/items?page=1&pageSize=20'),
      authenticatedHeaders,
      pagedPayload,
    );
    verifyJson(
      'purchasing-supplier',
      'suppliers',
      endpoint(targets.purchasingSupplier, '/api/suppliers?activeOnly=true'),
      authenticatedHeaders,
      arrayOrPagedPayload,
    );
    verifyJson(
      'purchasing-supplier',
      'purchase_orders',
      endpoint(targets.purchasingSupplier, '/api/purchase-orders'),
      authenticatedHeaders,
      arrayOrPagedPayload,
    );
    verifyJson(
      'sales-reporting',
      'sale_items',
      endpoint(targets.salesReporting, '/api/sale-items?page=1&pageSize=20'),
      authenticatedHeaders,
      pagedPayload,
    );
    verifyJson(
      'sales-reporting',
      'expiry_alerts',
      endpoint(targets.salesReporting, '/api/expiry-alerts?withinDays=30&page=1&pageSize=20'),
      authenticatedHeaders,
      pagedPayload,
    );
  });

  sleep(decimal(__ENV.THINK_TIME_SECONDS, 0.2));
}

function verifyHtml(service, operation, url) {
  const response = timedGet(service, operation, url, { Accept: 'text/html' });
  recordChecks(service, response, {
    [`${operation}: status is 200`]: (result) => result.status === 200,
    [`${operation}: HTML returned`]: (result) => String(result.headers['Content-Type'] || '').includes('text/html'),
  });
}

function verifyJson(service, operation, url, headers, payloadCheck) {
  const response = timedGet(service, operation, url, headers);
  recordChecks(service, response, {
    [`${operation}: status is 200`]: (result) => result.status === 200,
    [`${operation}: valid expected JSON`]: (result) => payloadCheck(parseJson(result)),
  });
}

function verifyStatus(service, operation, url, headers, expectedStatus) {
  const response = timedGet(service, operation, url, headers);
  recordChecks(service, response, {
    [`${operation}: status is ${expectedStatus}`]: (result) => result.status === expectedStatus,
  });
}

function timedGet(service, operation, url, headers) {
  const response = http.get(url, {
    headers,
    tags: { service, operation },
    timeout: '15s',
  });
  serviceRequests.add(1, { service, operation });
  serviceDuration.add(response.timings.duration, { service, operation });
  return response;
}

function recordChecks(service, response, assertions) {
  const passed = check(response, assertions, { service });
  serviceFailures.add(!passed, { service });
}

function parseJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

function pagedPayload(payload) {
  return Boolean(payload && Array.isArray(payload.items));
}

function arrayOrPagedPayload(payload) {
  return Array.isArray(payload) || pagedPayload(payload);
}

function requiredUrl(name) {
  const value = (__ENV[name] || '').trim();
  if (!/^https?:\/\//i.test(value)) {
    throw new Error(`${name} must be an absolute http(s) URL.`);
  }
  return value.replace(/\/+$/, '');
}

function endpoint(base, path) {
  return `${base}${path}`;
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function decimal(value, fallback) {
  const parsed = Number.parseFloat(value || '');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function handleSummary(data) {
  const executedProfile = data.setup_data?.profile || profile;
  const markdown = summaryMarkdown(data, executedProfile);
  const safeData = JSON.parse(JSON.stringify(data));
  safeData.setup_data = { profile: executedProfile, credentials: '[REDACTED]' };
  return {
    stdout: `${markdown}\n`,
    'performance/results/summary.json': JSON.stringify(safeData, null, 2),
    'performance/results/summary.md': markdown,
  };
}

function summaryMarkdown(data, executedProfile) {
  const durationMetric = data.metrics.http_req_duration?.values || {};
  const failureMetric = data.metrics.http_req_failed?.values || {};
  const checksMetric = data.metrics.checks?.values || {};
  const iterations = data.metrics.iterations?.values?.count || 0;
  const requests = data.metrics.http_reqs?.values?.count || 0;
  const serviceRows = measuredServices.map((service) => {
    const serviceCount = taggedValues(data, 'medzo_service_requests', service).count || 0;
    const serviceTimings = taggedValues(data, 'medzo_service_duration', service);
    const serviceFailureRate = taggedValues(data, 'medzo_service_failures', service).rate;
    return `| ${service} | ${serviceCount} | ${milliseconds(serviceTimings['p(95)'])} | ${milliseconds(serviceTimings['p(99)'])} | ${percentage(serviceFailureRate)} |`;
  });

  return [
    '# MEDZO Full-System Performance Summary',
    '',
    `- Profile: **${executedProfile}**`,
    `- Iterations: **${iterations}**`,
    `- HTTP requests: **${requests}**`,
    `- Check pass rate: **${percentage(checksMetric.rate)}**`,
    `- HTTP failure rate: **${percentage(failureMetric.rate)}**`,
    `- Average response time: **${milliseconds(durationMetric.avg)}**`,
    `- p95 response time: **${milliseconds(durationMetric['p(95)'])}** (limit ${p95Limit} ms)`,
    `- p99 response time: **${milliseconds(durationMetric['p(99)'])}** (limit ${p99Limit} ms)`,
    '',
    '| Service | Requests | p95 | p99 | Failure rate |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...serviceRows,
    '',
    'Threshold failures make the k6 command and CI job fail.',
  ].join('\n');
}

function taggedValues(data, metric, service) {
  return data.metrics[`${metric}{service:${service}}`]?.values || {};
}

function percentage(value) {
  return `${((value || 0) * 100).toFixed(2)}%`;
}

function milliseconds(value) {
  return `${(value || 0).toFixed(2)} ms`;
}
