import { Router } from 'express';
import { storyController } from '../controllers/stories.controller.js';

export function createStoriesRoutes({ service, authenticate, upload }) {
  const router = Router();
  const controller = storyController(service);
  router.get('/', authenticate, controller.list);
  router.post('/', authenticate, upload, controller.publish);
  // Withdrawal uses a per-story deletion capability, not a global curator key.
  router.delete('/:id', controller.withdraw);
  return router;
}
