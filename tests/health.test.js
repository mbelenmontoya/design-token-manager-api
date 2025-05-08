import request from 'supertest';
import http from 'http';
import app from '../src/index.js';

let server;
let agent;

describe('Health Check', () => {
  beforeAll(() => {
    // Create HTTP server and SuperTest agent
    server = http.createServer(app);
    agent = request.agent(server);
  });

  afterAll(() => {
    if (server) server.close();
  });

  it('GET / should return running message', async () => {
    const res = await agent.get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Design Token Manager API is running/);
  });
});
