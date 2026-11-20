
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, 'VALIDATION_ERROR', message, details);
export const notFound = (what) => new AppError(404, 'NOT_FOUND', `${what} not found`);
export const conflict = (code, message) => new AppError(409, code, message);

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' });
  }
  console.error(err);
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Something went wrong on our side' });
}