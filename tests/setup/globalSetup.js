import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import { MongoMemoryServer } from 'mongodb-memory-server';

export default async () => {
  if (!process.env.CI && !process.env.CODEX) {
    console.log('Stage-1 tests are CI-only. Skipping.');
    process.exit(0);
  }

  if (!process.env.MONGO_URI) {
    const mongod = await MongoMemoryServer.create();
    global.__MONGOD__ = mongod;
    process.env.MONGO_URI = mongod.getUri();
  }

  const env = {
    ...process.env,
    NODE_ENV: 'ci',
    PORT: process.env.PORT || '4000',
    JWT_SECRET: process.env.JWT_SECRET || 'ci-smoke-secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  };

  const server = spawn('node', ['src/index.js'], { env, stdio: 'inherit' });
  global.__SERVER_PID__ = server.pid;

  const base = `http://localhost:${env.PORT}`;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) break;
    } catch {}
    await sleep(1000);
    if (i === 59) throw new Error('Server did not become healthy');
  }

  await new Promise((resolve, reject) => {
    const seed = spawn('node', ['src/scripts/seedUser.js'], { env, stdio: 'inherit' });
    seed.on('exit', code => code === 0 ? resolve() : reject(new Error('seedUser failed')));
  });
};
