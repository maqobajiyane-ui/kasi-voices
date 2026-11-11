import { resolve } from 'node:path';

export function readConfiguration(env = process.env) {
  const secret = env.PUBLISH_ACCESS_KEY || '';
  if (secret.length < 32 || secret.includes('replace-this')) {
    throw new Error('PUBLISH_ACCESS_KEY must be a unique random secret at least 32 characters long.');
  }
  if (!/^mongodb(\+srv)?:\/\//.test(env.MONGODB_URI || '')) {
    throw new Error('MONGODB_URI must point to a MongoDB server.');
  }
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  const databaseName = env.MONGODB_DB || 'kasi_voices';
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(databaseName)) throw new Error('Invalid database name.');
  return {
    secret,
    port,
    host: env.HOST || '127.0.0.1',
    mongoUri: env.MONGODB_URI,
    databaseName,
    mediaDir: resolve(env.MEDIA_STORAGE_PATH || './storage'),
    production: env.NODE_ENV === 'production',
  };
}
