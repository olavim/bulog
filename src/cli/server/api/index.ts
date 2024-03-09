import express from 'express';
import healthRouter from './health.js';
import configRouter from './config.js';

const router = express.Router();

router.use('/health', healthRouter);
router.use('/config', configRouter);

export default router;
