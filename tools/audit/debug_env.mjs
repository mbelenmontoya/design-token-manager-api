import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

function mask(val) {
  if (!val) return '';
  const len = val.length;
  if (len <= 8) return '*'.repeat(len);
  return `${val.slice(0,4)}...${val.slice(-4)}`;
}

const required = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];
console.log('Resolved environment variables:');
for (const key of required) {
  console.log(`${key}=${mask(process.env[key])}`);
}

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is missing');
  process.exit(2);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const conn = mongoose.connection;
  console.log(`MongoDB connected: ${conn.host}/${conn.name}`);
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  const msg = String(err?.reason?.message || err.message || err);
  let friendly;
  if (/ENOTFOUND|getaddrinfo|srv record/gi.test(msg)) {
    friendly = 'Check cluster name / internet / SRV record.';
  } else if (/Authentication failed|auth failed/gi.test(msg)) {
    friendly = 'Verify username/password (and URL-encode special chars).';
  } else if (/not allowed|allowlist|whitelist/gi.test(msg)) {
    friendly = 'Add your IP in Atlas Network Access.';
  } else if (/timed out|Timeout/gi.test(msg)) {
    friendly = 'Atlas firewall or wrong hostname/port.';
  } else {
    friendly = msg;
  }
  console.error(`MongoDB connection failed: ${friendly}`);
  process.exit(2);
}
