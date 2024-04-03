import express from 'express';
import healthRouter from './health.js';
import configRouter from './config.js';
import cacheRouter from './cache.js';

const router = express.Router();

router.use('/health', healthRouter);
router.use('/config', configRouter);
router.use('/cache', cacheRouter);

export default router;
