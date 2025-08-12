import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index.js';
import TokenRelease from '../src/models/TokenRelease.js';

let server;
let agent;
let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
  server = http.createServer(app);
  agent = request.agent(server);
});

afterAll(async () => {
  if (server) server.close();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('Token release endpoints', () => {
  let release;
  beforeAll(async () => {
    release = await TokenRelease.create({
      version: '1.2.3',
      theme: 'base',
      format: 'json',
      tokens: { color: { primary: '#fff' } },
      compatibility: ['1.x']
    });
  });

  it('returns immutable token artifact', async () => {
    const res = await agent.get('/v/1.2.3/tokens?theme=base&format=json');
    expect(res.status).toBe(200);
    expect(res.body.color.primary).toBe('#fff');
    expect(res.headers['cache-control']).toMatch(/immutable/);
    expect(res.headers.etag).toBe(release.checksum);
  });

  it('returns release manifest', async () => {
    const res = await agent.get('/v/1.2.3/manifest.json?theme=base&format=json');
    expect(res.status).toBe(200);
    expect(res.body.checksum).toBe(release.checksum);
    expect(res.body.compatibility).toContain('1.x');
  });
});
