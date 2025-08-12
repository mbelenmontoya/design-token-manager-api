import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/index.js';

let server;
let agent;
let mongo;

describe('Health Check', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    server = http.createServer(app);
    agent = request.agent(server);
  });

  afterAll(async () => {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it('GET / should return health JSON', async () => {
    const res = await agent.get('/');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mongo.connected).toBe(true);
    expect(res.headers['api-version']).toBe('1.0');
  });
});
