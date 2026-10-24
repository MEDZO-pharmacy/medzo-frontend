import http from 'node:http';

const host = process.env.MOCK_HOST || '127.0.0.1';
const port = Number.parseInt(process.env.MOCK_PORT || '8787', 10);
const delay = Number.parseInt(process.env.MOCK_DELAY_MS || '10', 10);

const paged = {
  items: [{ id: '00000000-0000-0000-0000-000000000001', name: 'Paracetamol' }],
  page: 1,
  pageSize: 20,
  totalCount: 1,
};

const server = http.createServer(async (request, response) => {
  await wait(delay);
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/health') {
    return json(response, 200, { status: 'healthy' });
  }

  if (request.method === 'GET' && url.pathname === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return response.end('<!doctype html><html><body><h1>MEDZO</h1></body></html>');
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readJson(request);
    if (!body.identifier || !body.password) {
      return json(response, 400, { message: 'Credentials are required.' });
    }
    return json(response, 200, { token: 'ci-performance-token', expiresAt: '2099-01-01T00:00:00Z' });
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/session') {
    return bearerAccepted(request) ? empty(response, 204) : json(response, 401, { message: 'Unauthorized' });
  }

  if (request.method === 'GET' && url.pathname === '/api/catalogue/medicines/public') {
    return json(response, 200, paged);
  }

  const protectedPagedRoutes = new Set([
    '/api/catalogue/medicines',
    '/api/inventory/items',
    '/api/inventory/items/low-stock',
    '/api/inventory/batches/near-expiry',
  ]);
  if (request.method === 'GET' && protectedPagedRoutes.has(url.pathname)) {
    return bearerAccepted(request) ? json(response, 200, paged) : json(response, 401, { message: 'Unauthorized' });
  }

  return json(response, 404, { message: `No mock route for ${request.method} ${url.pathname}` });
});

server.listen(port, host, () => {
  process.stdout.write(`MEDZO performance mock listening on http://${host}:${port}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

function bearerAccepted(request) {
  return String(request.headers.authorization || '').startsWith('Bearer ');
}

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function empty(response, status) {
  response.writeHead(status);
  response.end();
}

function readJson(request) {
  return new Promise((resolve) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
