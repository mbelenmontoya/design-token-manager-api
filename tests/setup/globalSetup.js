import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import { MongoMemoryServer } from 'mongodb-memory-server';

export default async () => {
  if (!process.env.CI && !process.env.CODEX) {
    console.log('Stage-1 tests are CI-only. Skipping.');
    process.exit(0);
  }

  // If running Supabase mode, skip Mongo setup entirely
  if ((process.env.DB_READS === 'supabase') || (process.env.DB_WRITES === 'supabase')) {
    const env = {
      ...process.env,
      NODE_ENV: 'ci',
      PORT: process.env.PORT || '4000',
      JWT_SECRET: process.env.JWT_SECRET || 'ci-smoke-secret',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
      DB_READS: 'supabase',
      DB_WRITES: 'supabase',
    };
    const server = spawn('node', ['src/index.js'], { env, stdio: 'inherit' });
    global.__SERVER_PID__ = server.pid;
    const base = `http://localhost:${env.PORT}`;
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`${base}/status/postgres`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok || data.result || data.status === 'healthy') {
            break;
          }
        }
      } catch (_) {}
      await sleep(1000);
      if (i === 59) throw new Error('Server did not become healthy within 60 seconds (supabase)');
    }
    // No seedUser in supabase mode
    return;
  }

  if (!process.env.MONGO_URI) {
    const mongod = await MongoMemoryServer.create({
      binary: { version: '7.0.5' },
    });
    global.__MONGOD__ = mongod;
    global.__MONGO_URI__ = mongod.getUri();
    process.env.MONGO_URI = mongod.getUri();
  } else {
    global.__MONGO_URI__ = process.env.MONGO_URI;
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
      if (res.ok) {
        // With new DAL health format, we need to check if system is actually healthy
        const healthData = await res.json();
        console.log(`Health check ${i + 1}/60: Health status:`, JSON.stringify(healthData));
        
        if (healthData.ok === true && healthData.mongo?.connected === true) {
          // System reports as healthy, but let's also test if database operations work
          // Try a simple ping to verify the server can actually handle requests
          try {
            const pingRes = await fetch(`${base}/`);
            if (pingRes.ok) {
              console.log(`✅ Server fully ready after ${i + 1} seconds`);
              break; // System is fully healthy and responding
            }
          } catch (pingErr) {
            console.log(`Health check ${i + 1}/60: Ping test failed:`, pingErr.message);
          }
        } else {
          // System not healthy yet, continue waiting
          console.log(`Health check ${i + 1}/60: System not healthy yet - ok: ${healthData.ok}, mongo.connected: ${healthData.mongo?.connected}`);
        }
      }
    } catch (err) {
      if (i > 30) {
        console.log(`Health check ${i}/60: Connection error:`, err.message);
      }
    }
    await sleep(1000);
    if (i === 59) throw new Error('Server did not become healthy within 60 seconds');
  }

  await new Promise((resolve, reject) => {
    const seed = spawn('node', ['src/scripts/seedUser.js'], { env, stdio: 'inherit' });
    seed.on('exit', code => code === 0 ? resolve() : reject(new Error('seedUser failed')));
  });
};
