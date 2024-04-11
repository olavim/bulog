import http from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import apiRouter from './api/index.js';
import setupWebSocketServer from './api/sockets.js';
import { Comms } from './comms.js';
import { SystemSignals } from './system-signals.js';

const filename = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(filename), '../../app');

function serveStatic(app: express.Express) {
	app.use('/assets', (_req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		next();
	});

	app.use(express.static(appRoot));

	app.get('*', (_req, res) => {
		res.sendFile('index.html', { root: appRoot });
	});
}

async function serveVite(app: express.Express, systemSignals: SystemSignals) {
	const { createServer: createViteServer } = await import('vite');
	const viteServer = await createViteServer({
		server: { middlewareMode: true },
		appType: 'spa'
	});

	systemSignals.onClose(async () => {
		await viteServer.hot.close();
		await viteServer.close();
		return false;
	});

	app.use(viteServer.middlewares);
}

export async function getServer(env: BulogEnvironment, systemSignals: SystemSignals) {
	const app = express();
	const comms = new Comms({
		maxQueueSize: env.memorySize.value
	});

	app.use((req, _res, next) => {
		req.bulogEnvironment = env;
		req.bulogComms = comms;
		req.systemSignals = systemSignals;
		next();
	});

	app.use('/api', apiRouter);

	if (process.env.NODE_ENV === 'production') {
		serveStatic(app);
	} else {
		await serveVite(app, systemSignals);
	}

	const server = http.createServer(app);
	setupWebSocketServer(server, comms, systemSignals);
	return server;
}
