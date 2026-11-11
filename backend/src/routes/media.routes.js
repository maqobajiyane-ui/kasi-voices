import { Router } from 'express';
import { mediaController } from '../controllers/media.controller.js';

export function createMediaRoutes({ service, authenticate, mediaDir }) {
  const router = Router();
  const controller = mediaController(service, mediaDir);
  router.get('/:id/audio', authenticate, controller.download);
  return router;
}
