/**
 * Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err.type === 'VALIDATION_ERROR') {
    return res.status(400).json({ success: false, error: err.message, details: err.details });
  }
  if (err.type === 'FILE_ERROR') {
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.type === 'NOT_FOUND') {
    return res.status(404).json({ success: false, error: err.message });
  }

  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

const createError = (message, type = 'GENERAL', details = null) => {
  const err = new Error(message);
  err.type = type;
  if (details) err.details = details;
  return err;
};

module.exports = { errorHandler, createError };
