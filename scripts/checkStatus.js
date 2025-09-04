// Check status endpoints locally
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

async function request(path) {
  const res = await fetch(BASE_URL + path);
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; } catch { return { status: res.status, body: text }; }
}

async function main() {
  const pg = await request('/status/postgres');
  console.log('GET /status/postgres ->', pg.status, pg.body?.ok ?? pg.body);
  const db = await request('/status/database');
  console.log('GET /status/database ->', db.status, db.body?.configuration ?? db.body);
  if (pg.status !== 200) process.exit(1);
}

main().catch((e) => { console.error('Status check error', e); process.exit(1); });

