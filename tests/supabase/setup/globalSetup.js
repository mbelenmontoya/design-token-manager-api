import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

export default async () => {
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: process.env.PORT || '4000',
    DB_READS: process.env.DB_READS || 'supabase',
    DB_WRITES: process.env.DB_WRITES || 'supabase',
  };

  // Start the server
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
    if (i === 59) throw new Error('Server did not become ready (postgres) within 60s');
  }
};

