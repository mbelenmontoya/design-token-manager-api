import 'dotenv/config';

export const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

export async function http(method, path, { headers = {}, body } = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, body: data };
}

