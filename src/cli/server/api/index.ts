import express from 'express';
import healthRouter from './health.js';
import configRouter from './config.js';
import systemRouter from './system.js';

const router = express.Router();

router.use('/health', healthRouter);
router.use('/config', configRouter);
router.use('/system', systemRouter);

export default router;
