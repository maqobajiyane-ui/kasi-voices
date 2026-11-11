import multer from 'multer';

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);
  let status = Number(error.status || 500);
  if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  }
  if (status < 400 || status > 599) status = 500;
  const message = status === 500 ? 'Unexpected server error.' :
    status === 413 ? 'Audio exceeds the 15 MiB upload limit.' :
    error.message || 'Request failed.';
  response.status(status).json({ error: message });
}
