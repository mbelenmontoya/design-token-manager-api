import request from 'supertest';
import http from 'http';
import app from '../src/index.js';

let server;
let agent;

beforeAll(() => {
  server = http.createServer(app);
  agent = request.agent(server);
});

afterAll(() => {
  if (server) server.close();
});

describe('OpenAPI v1 documentation', () => {
  it('serves Swagger UI at /api-docs/v1', async () => {
    const res = await agent.get('/api-docs/v1/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Swagger UI/);
  });
});

