export function sendError(res, status, code, message, details) {
  return res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

export const ERR = {
  UNAUTHORIZED: (res, msg = 'Unauthorized') => sendError(res, 401, 'UNAUTHORIZED', msg),
  FORBIDDEN: (res, msg = 'Insufficient permissions') => sendError(res, 403, 'FORBIDDEN', msg),
  CONTEXT_REQUIRED: (res, msg) => sendError(res, 403, 'CONTEXT_REQUIRED', msg || 'Context required'),
  NOT_FOUND: (res, msg = 'Not found') => sendError(res, 404, 'NOT_FOUND', msg),
  VALIDATION: (res, msg = 'Validation error', details) => sendError(res, 422, 'VALIDATION_ERROR', msg, details),
};

