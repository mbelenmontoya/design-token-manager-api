import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

import app from '../src/index.js';
import User from '../src/models/User.js';
import Tenant from '../src/models/Tenant.js';
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

describe('Invitations and memberships', () => {
  let tenant, adminToken, userToken, inviteLink, membershipId;

  beforeAll(async () => {
    tenant = await Tenant.create({ name: 't1' });
    const admin = await User.create({ username: 'admin@example.com', password: 'pass' });
    await Membership.create({ user: admin._id, tenant: tenant._id, role: 'admin' });
    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    const user = await User.create({ username: 'user@example.com', password: 'pass' });
    userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  });

  it('invites and accepts', async () => {
    const resInvite = await agent
      .post(`/api/tenants/${tenant._id.toString()}/invitations`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'user@example.com', role: 'viewer' });
    expect(resInvite.status).toBe(201);
    inviteLink = resInvite.body.invitation.link;
    const token = inviteLink.split('/')[3];
    const resAccept = await agent
      .post(`/api/invitations/${token}/accept`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(resAccept.status).toBe(201);
    expect(resAccept.body.membership.role).toBe('viewer');
    membershipId = resAccept.body.membership._id;
    const resAcceptAgain = await agent
      .post(`/api/invitations/${token}/accept`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(resAcceptAgain.status).toBe(400);
  });

  it('updates and revokes membership', async () => {
    const resPatch = await agent
      .patch(`/api/memberships/${membershipId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'editor' });
    expect(resPatch.status).toBe(200);
    expect(resPatch.body.role).toBe('editor');
    const resDelete = await agent
      .delete(`/api/memberships/${membershipId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resDelete.status).toBe(200);
    expect(resDelete.body.message).toMatch(/Access revoked/);
  });
});
