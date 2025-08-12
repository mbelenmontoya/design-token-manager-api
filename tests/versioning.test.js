import request from 'supertest';
import http from 'http';
import app from '../src/index.js';

let server;
let agent;

describe('API Versioning', () => {
  beforeAll(() => {
    server = http.createServer(app);
    agent = request.agent(server);
  });

  afterAll(() => {
    if (server) server.close();
  });

  it('defaults to the latest version when header is missing', async () => {
    const res = await agent.get('/');
    expect(res.status).toBe(200);
    expect(res.headers['api-version']).toBe('1.0');
    expect(res.headers.deprecation).toBeUndefined();
  });

  it('adds deprecation headers for deprecated versions', async () => {
    const res = await agent.get('/').set('API-Version', '0.9');
    expect(res.status).toBe(200);
    expect(res.headers['api-version']).toBe('0.9');
    expect(res.headers.deprecation).toBeDefined();
    expect(res.headers.sunset).toBeDefined();
    expect(res.headers.link).toBeDefined();
  });

  it('rejects unknown API versions', async () => {
    const res = await agent.get('/').set('API-Version', '2.0');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid api version/i);
    expect(res.headers['api-version']).toBeUndefined();
  });

  it('GET /status/versioning returns policy information', async () => {
    const res = await agent.get('/status/versioning');
    expect(res.status).toBe(200);
    expect(res.body.currentVersion).toBeDefined();
    expect(Array.isArray(res.body.supportedVersions)).toBe(true);
    expect(res.body.policy).toBeDefined();
  });
});
