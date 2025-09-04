import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

export default async () => {
  if (!process.env.CI && !process.env.CODEX) {
    console.log('Stage-1 tests are CI-only. Skipping.');
    process.exit(0);
  }

  // Supabase-only runtime; skip any Mongo setup
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

  // Legacy Mongo setup removed. Supabase-only tests should use tests/supabase/*.
  process.exit(0);
};
