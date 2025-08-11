import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

process.env.API_KEY_RATE_LIMIT = '5';
import app from '../src/index.js';
import User from '../src/models/User.js';
import Tenant from '../src/models/Tenant.js';
import Project from '../src/models/Project.js';
import Membership from '../src/models/Membership.js';

let server;
let agent;
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.JWT_SECRET = 'testsecret';
  await mongoose.connect(uri);
  server = http.createServer(app);
  agent = request.agent(server);
});

afterAll(async () => {
  if (server) server.close();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('API key authentication', () => {
  let tenant, project, adminToken, apiKey, apiKeyId;

  beforeAll(async () => {
    tenant = await Tenant.create({ name: 't1' });
    project = await Project.create({ name: 'p1', tenant: tenant._id });
    const admin = await User.create({ username: 'a', password: 'pass' });
    await Membership.create({ user: admin._id, tenant: tenant._id, role: 'admin' });
    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    const res = await agent
      .post('/api/api-keys')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-tenant-id', tenant._id.toString())
      .set('x-project-id', project._id.toString())
      .send({ scopes: ['read:tokens', 'write:tokens'] });
    apiKey = res.body.apiKey;
    apiKeyId = res.body.id;
  });

  it('allows creating and reading tokens via API key', async () => {
    const createRes = await agent
      .post('/api/tokens')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ name: 'color.primary', value: '#fff' });
    expect(createRes.status).toBe(201);

    const getRes = await agent
      .get('/api/tokens')
      .set('Authorization', `Bearer ${apiKey}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.tokens.length).toBe(1);
  });

  it('rotates key and invalidates old key', async () => {
    const rotateRes = await agent
      .post(`/api/api-keys/${apiKeyId}/rotate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-tenant-id', tenant._id.toString())
      .set('x-project-id', project._id.toString());
    const newKey = rotateRes.body.apiKey;

    const oldRes = await agent
      .get('/api/tokens')
      .set('Authorization', `Bearer ${apiKey}`);
    expect(oldRes.status).toBe(401);

    const newRes = await agent
      .get('/api/tokens')
      .set('Authorization', `Bearer ${newKey}`);
    expect(newRes.status).toBe(200);
    apiKey = newKey;
  });

  it('enforces rate limiting', async () => {
    for (let i = 0; i < 5; i++) {
      await agent.get('/api/tokens').set('Authorization', `Bearer ${apiKey}`);
    }
    const res = await agent.get('/api/tokens').set('Authorization', `Bearer ${apiKey}`);
    expect(res.status).toBe(429);
  });

  it('revokes key', async () => {
    const revokeRes = await agent
      .delete(`/api/api-keys/${apiKeyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-tenant-id', tenant._id.toString())
      .set('x-project-id', project._id.toString());
    expect(revokeRes.status).toBe(200);

    const res = await agent
      .get('/api/tokens')
      .set('Authorization', `Bearer ${apiKey}`);
    expect(res.status).toBe(401);
  });
});
