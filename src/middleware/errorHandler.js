// src/middleware/errorHandler.js
export default function errorHandler(err, req, res, next) {
  // Minimal, consistent error responses
  if (process.env.NODE_ENV !== 'test') {
    // Avoid dumping large request objects
    console.error('Error:', err?.message || err);
  }
  const status = err?.status || 500;
  const message = err?.message || 'Internal Server Error';
  res.status(status).json({ message });
}
