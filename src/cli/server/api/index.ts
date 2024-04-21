import express from 'express';
import { healthRouter } from './health.js';
import { configRouter } from './config.js';
import { systemRouter } from './system.js';
import { getSocketsRouter } from './sockets.js';

export const getApiRouter = () => {
	const apiRouter = express.Router();

	apiRouter.use('/health', healthRouter);
	apiRouter.use('/config', configRouter);
	apiRouter.use('/system', systemRouter);
	apiRouter.use('/sockets', getSocketsRouter());

	return apiRouter;
};
