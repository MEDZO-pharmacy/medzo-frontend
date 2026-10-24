import http from 'k6/http';
import { check, fail, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const profile = (__ENV.PROFILE || 'smoke').toLowerCase();
const supportedProfiles = ['smoke', 'load', 'stress'];
if (!supportedProfiles.includes(profile)) throw new Error(`Unsupported PROFILE "${profile}". Use smoke, load, or stress.`);

const targetVus = positiveInteger(__ENV.TARGET_VUS, 10);
const duration = __ENV.TEST_DURATION || '1m';
const rampDuration = __ENV.RAMP_DURATION || '15s';
const p95Limit = positiveInteger(__ENV.P95_MS, 1000);
const p99Limit = positiveInteger(__ENV.P99_MS, 2000);
const maxFailureRate = decimal(__ENV.MAX_FAILURE_RATE, 0.01);
const minCheckRate = decimal(__ENV.MIN_CHECK_RATE, 0.99);
const measuredOperations = ['public-catalogue', 'catalogue-search', 'inventory-items', 'low-stock', 'near-expiry'];

const sliceRequests = new Counter('medzo_slice_requests');
const sliceDuration = new Trend('medzo_slice_duration', true);
const sliceFailures = new Rate('medzo_slice_failures');

const profiles = {
  smoke: { executor: 'shared-iterations', vus: 1, iterations: 1, maxDuration: '30s' },
  load: {
    executor: 'ramping-vus', startVUs: 0,
    stages: [{ duration: rampDuration, target: targetVus }, { duration, target: targetVus }, { duration: rampDuration, target: 0 }],
    gracefulRampDown: '15s',
  },
  stress: {
    executor: 'ramping-vus', startVUs: 0,
    stages: [{ duration: '20s', target: targetVus }, { duration: '30s', target: targetVus * 2 }, { duration: '30s', target: targetVus * 3 }, { duration: '20s', target: 0 }],
    gracefulRampDown: '20s',
  },
};

const thresholds = {
  checks: [`rate>${minCheckRate}`],
  http_req_failed: [`rate<${maxFailureRate}`],
  http_req_duration: [`p(95)<${p95Limit}`, `p(99)<${p99Limit}`],
  medzo_slice_failures: [`rate<${maxFailureRate}`],
  medzo_slice_duration: [`p(95)<${p95Limit}`, `p(99)<${p99Limit}`],
};
for (const operation of measuredOperations) {
  thresholds[`medzo_slice_requests{operation:${operation}}`] = ['count>0'];
  thresholds[`medzo_slice_failures{operation:${operation}}`] = [`rate<${maxFailureRate}`];
  thresholds[`medzo_slice_duration{operation:${operation}}`] = [`p(95)<${p95Limit}`, `p(99)<${p99Limit}`];
}

export const options = {
  scenarios: { catalogue_inventory_read_journey: profiles[profile] },
  thresholds,
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  tags: { suite: 'medzo-catalogue-inventory', profile },
};

const catalogueInventoryUrl = requiredUrl('CATALOGUE_INVENTORY_API_URL');
const authUrl = optionalUrl('AUTH_API_URL');

export function setup() {
  if (__ENV.ACCESS_TOKEN) return { token: __ENV.ACCESS_TOKEN, profile };
  if (!authUrl || !__ENV.TEST_IDENTIFIER || !__ENV.TEST_PASSWORD) {
    fail('Provide ACCESS_TOKEN or AUTH_API_URL plus TEST_IDENTIFIER and TEST_PASSWORD. Use a dedicated test account.');
  }
  const response = http.post(endpoint(authUrl, '/api/auth/login'), JSON.stringify({
    identifier: __ENV.TEST_IDENTIFIER,
    password: __ENV.TEST_PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' }, tags: { operation: 'login-setup' }, timeout: '15s' });
  const accepted = check(response, {
    'setup login returns 200': (result) => result.status === 200,
    'setup login returns an access token': (result) => Boolean(parseJson(result)?.token),
  });
  if (!accepted) fail(`Authentication setup failed with HTTP ${response.status}.`);
  return { token: parseJson(response).token, profile };
}

export default function catalogueInventoryReadJourney(data) {
  const authenticated = { Accept: 'application/json', Authorization: `Bearer ${data.token}` };
  group('Catalogue/Inventory vertical slice', () => {
    verifyJson('public-catalogue', '/api/catalogue/medicines/public?page=1&pageSize=12', { Accept: 'application/json' });
    verifyJson('catalogue-search', '/api/catalogue/medicines?page=1&pageSize=20', authenticated);
    verifyJson('inventory-items', '/api/inventory/items?page=1&pageSize=20', authenticated);
    verifyJson('low-stock', '/api/inventory/items/low-stock?page=1&pageSize=20', authenticated);
    verifyJson('near-expiry', '/api/inventory/batches/near-expiry?withinDays=30&page=1&pageSize=20', authenticated);
  });
  sleep(decimal(__ENV.THINK_TIME_SECONDS, 0.2));
}

function verifyJson(operation, path, headers) {
  const response = http.get(endpoint(catalogueInventoryUrl, path), { headers, tags: { operation }, timeout: '15s' });
  sliceRequests.add(1, { operation });
  sliceDuration.add(response.timings.duration, { operation });
  const passed = check(response, {
    [`${operation}: status is 200`]: (result) => result.status === 200,
    [`${operation}: paged JSON returned`]: (result) => Boolean(parseJson(result) && Array.isArray(parseJson(result).items)),
  }, { operation });
  sliceFailures.add(!passed, { operation });
}

function parseJson(response) { try { return response.json(); } catch { return null; } }
function requiredUrl(name) {
  const value = (__ENV[name] || '').trim();
  if (!/^https?:\/\//i.test(value)) throw new Error(`${name} must be an absolute http(s) URL.`);
  return value.replace(/\/+$/, '');
}
function optionalUrl(name) {
  const value = (__ENV[name] || '').trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) throw new Error(`${name} must be an absolute http(s) URL.`);
  return value.replace(/\/+$/, '');
}
function endpoint(base, path) { return `${base}${path}`; }
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
  const rows = measuredOperations.map((operation) => {
    const count = taggedValues(data, 'medzo_slice_requests', operation).count || 0;
    const timing = taggedValues(data, 'medzo_slice_duration', operation);
    const failures = taggedValues(data, 'medzo_slice_failures', operation).rate;
    return `| ${operation} | ${count} | ${milliseconds(timing['p(95)'])} | ${milliseconds(timing['p(99)'])} | ${percentage(failures)} |`;
  });
  return [
    '# Supplementary Load & Performance Check', '',
    '**Common scope:** Catalogue/Inventory vertical slice',
    '**Status:** Supplementary group quality check; not a fifth individual role.', '',
    `- Profile: **${executedProfile}**`,
    `- Iterations: **${data.metrics.iterations?.values?.count || 0}**`,
    `- HTTP requests: **${data.metrics.http_reqs?.values?.count || 0}**`,
    `- Check pass rate: **${percentage(checksMetric.rate)}**`,
    `- HTTP failure rate: **${percentage(failureMetric.rate)}**`,
    `- p95 response time: **${milliseconds(durationMetric['p(95)'])}** (limit ${p95Limit} ms)`,
    `- p99 response time: **${milliseconds(durationMetric['p(99)'])}** (limit ${p99Limit} ms)`, '',
    '| Operation | Requests | p95 | p99 | Failure rate |',
    '| --- | ---: | ---: | ---: | ---: |', ...rows, '',
    'A threshold failure returns a non-zero exit code and fails the CI quality gate.',
  ].join('\n');
}
function taggedValues(data, metric, operation) { return data.metrics[`${metric}{operation:${operation}}`]?.values || {}; }
function percentage(value) { return `${((value || 0) * 100).toFixed(2)}%`; }
function milliseconds(value) { return `${(value || 0).toFixed(2)} ms`; }
