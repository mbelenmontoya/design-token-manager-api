import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

export default async () => {
  const port = process.env.PORT || '4000';
  const base = `http://localhost:${port}`;

  if (process.env.CI_SERVER_MANAGED === '1') {
    // CI started the server already; just wait for it to respond
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`${base}/status/postgres`);
        // Any response means server is listening; health can be handled in tests
        if (res.status === 200 || res.status === 503) return;
      } catch (_) {}
      await sleep(1000);
    }
    throw new Error('Server did not become ready (external) within 60s');
  }

  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: port,
    DB_READS: process.env.DB_READS || 'supabase',
    DB_WRITES: process.env.DB_WRITES || 'supabase',
  };

  const server = spawn('node', ['src/index.js'], { env, stdio: 'inherit' });
  global.__SERVER_PID__ = server.pid;

  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${base}/status/postgres`);
      if (res.status === 200 || res.status === 503) return;
    } catch (_) {}
    await sleep(1000);
  }
  throw new Error('Server did not become ready (spawn) within 60s');
};
