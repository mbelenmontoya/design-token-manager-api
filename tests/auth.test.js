import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/index.js';
import User from '../src/models/User.js';

let server;
let agent;
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRES_IN = '1h';
  await mongoose.connect(uri);
  server = http.createServer(app);
  agent = request.agent(server);
  await User.create({ username: 'tester', password: 'pass' });
});

afterAll(async () => {
  if (server) server.close();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('Auth login', () => {
  it('logs in via versioned path', async () => {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ username: 'tester', password: 'pass' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('logs in via legacy path', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ username: 'tester', password: 'pass' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
