import express from 'express';
import { healthRouter } from './health.js';
import { configRouter } from './config.js';
import { systemRouter } from './system.js';

export const apiRouter = express.Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/config', configRouter);
apiRouter.use('/system', systemRouter);
