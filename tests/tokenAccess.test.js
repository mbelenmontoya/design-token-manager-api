import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

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

describe('Access control for tokens', () => {
  let tenant, project, editorToken, viewerToken, otherTenant, otherProject;

  beforeAll(async () => {
    tenant = await Tenant.create({ name: 't1' });
    project = await Project.create({ name: 'p1', tenant: tenant._id });
    const editor = await User.create({ username: 'e', password: 'pass' });
    const viewer = await User.create({ username: 'v', password: 'pass' });
    await Membership.create({ user: editor._id, tenant: tenant._id, role: 'editor' });
    await Membership.create({ user: viewer._id, tenant: tenant._id, role: 'viewer' });
    editorToken = jwt.sign({ id: editor._id }, process.env.JWT_SECRET);
    viewerToken = jwt.sign({ id: viewer._id }, process.env.JWT_SECRET);
    otherTenant = await Tenant.create({ name: 't2' });
    otherProject = await Project.create({ name: 'p2', tenant: otherTenant._id });
  });

  it('allows editor to create token', async () => {
    const res = await agent
      .post('/api/tokens')
      .set('Authorization', `Bearer ${editorToken}`)
      .set('x-tenant-id', tenant._id.toString())
      .set('x-project-id', project._id.toString())
      .send({ name: 'color.primary', value: '#fff' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('color.primary');
  });

  it('forbids viewer from creating token', async () => {
    const res = await agent
      .post('/api/tokens')
      .set('Authorization', `Bearer ${viewerToken}`)
      .set('x-tenant-id', tenant._id.toString())
      .set('x-project-id', project._id.toString())
      .send({ name: 'color.secondary', value: '#000' });
    expect(res.status).toBe(403);
  });

  it('rejects requests for non-member tenant', async () => {
    const res = await agent
      .get('/api/tokens')
      .set('Authorization', `Bearer ${editorToken}`)
      .set('x-tenant-id', otherTenant._id.toString())
      .set('x-project-id', otherProject._id.toString());
    expect(res.status).toBe(403);
  });
});
