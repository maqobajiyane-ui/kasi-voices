import { Router } from 'express';

export function createHealthRoutes() {
  const router = Router();
  router.get('/health', (req, res) => {
    res.set('Cache-Control', 'no-store').json({ status: 'ok', service: 'kasivoices' });
  });
  return router;
}
