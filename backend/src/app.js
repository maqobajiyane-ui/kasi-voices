import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { createHealthRoutes } from './routes/health.routes.js';
import { createStoriesRoutes } from './routes/stories.routes.js';
import { createMediaRoutes } from './routes/media.routes.js';
import { createAudioUpload } from './middleware/upload-limits.js';
import { errorHandler } from './middleware/error-handler.js';
import { createStoryService } from './services/story.service.js';

function constantTimeTokenCheck(received, secret) {
  if (typeof received !== 'string' || !received.startsWith('Bearer ')) return false;
  const token = Buffer.from(received.slice(7), 'utf8');
  const expected = Buffer.from(secret, 'utf8');
  return token.length === expected.length && timingSafeEqual(token, expected);
}

export async function createApp({ collection, mediaDir, secret, serveFrontend = false }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://tile.openstreetmap.org'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'", 'blob:'],
        workerSrc: ["'self'"],
      },
    },
  }));
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 100,
    standardHeaders: 'draft-8', legacyHeaders: false,
  }));
  const authenticate = (req, res, next) => {
    if (!constantTimeTokenCheck(req.get('authorization'), secret)) {
      return res.status(401).json({ error: 'A valid curator access key is required.' });
    }
    next();
  };
  const service = createStoryService({ collection, mediaDir, secret });
  const upload = await createAudioUpload(mediaDir);

  app.use('/api', createHealthRoutes());
  app.use('/api/v1/stories', createStoriesRoutes({ service, authenticate, upload }));
  app.use('/api/v1/stories', createMediaRoutes({ service, authenticate, mediaDir }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

  if (serveFrontend) {
    const dist = resolve(fileURLToPath(new URL('../../../frontend/dist/', import.meta.url)));
    app.use(express.static(dist, { extensions: ['html'], index: 'index.html' }));
  }
  app.use(errorHandler);
  return app;
}
