import http from 'http';
import https from 'https';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import session from 'express-session';
import { getApiRouter } from './api/index.js';
import { Comms } from './comms.js';
import { SystemSignals } from './system-signals.js';
import { expressWS } from './middlewares/ws.js';
import { HTTPError, UnauthenticatedError, UnauthorizedError } from './errors.js';
import { StaticFrontendConfig } from '@/types';
import { BulogEnvironment } from '@cli/commands/start.js';
import { auth as serverAuth } from './middlewares/auth.js';
import passport from 'passport';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const isDev = process.env.NODE_ENV === 'development';

function serveStatic(app: express.Express, staticConfig: StaticFrontendConfig) {
	app.use('/assets', (_req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		next();
	});

	const appRoot = path.resolve(dirname, '../../app');

	app.use(express.static(appRoot));

	app.get('*', (_req, res) => {
		const template = fs.readFileSync(path.resolve(appRoot, 'index.html'), 'utf-8');
		const html = template.replace('<!--config-outlet-->', JSON.stringify(staticConfig));
		res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
	});
}

async function serveVite(
	app: express.Express,
	hmrServer: http.Server,
	staticConfig: StaticFrontendConfig,
	systemSignals: SystemSignals
) {
	const { createServer: createViteServer } = await import('vite');
	const viteServer = await createViteServer({
		server: {
			middlewareMode: true,
			hmr: {
				server: hmrServer
			}
		},
		appType: 'custom'
	});

	systemSignals.onClose(async () => {
		await viteServer.hot.close();
		await viteServer.close();
		return false;
	});

	const appRoot = path.resolve(dirname, '../../../src/app');

	app.use(viteServer.middlewares);

	app.get('*', async (req, res, next) => {
		if (req.url.startsWith('/api')) {
			return next();
		}

		const url = req.originalUrl;
		const root = url === '/sandbox/index.html' ? path.resolve(appRoot, 'sandbox') : appRoot;

		try {
			let template = fs.readFileSync(path.resolve(root, 'index.html'), 'utf-8');
			template = await viteServer.transformIndexHtml(url, template);
			const html = template.replace('<!--config-outlet-->', JSON.stringify(staticConfig));
			res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
		} catch (err: any) {
			viteServer.ssrFixStacktrace(err);
			next(err);
		}
	});
}

export async function getServer(env: BulogEnvironment, systemSignals: SystemSignals) {
	const _app = express();
	const server = https.createServer(
		{
			key: fs.readFileSync(path.resolve(dirname, '../../../proto/bulog.key'), 'utf8'),
			cert: fs.readFileSync(path.resolve(dirname, '../../../proto/bulog.crt'), 'utf8')
		},
		_app
	);
	// const server = http.createServer(app);

	const app = expressWS(_app, server);

	app.use(
		session({
			name: 'bulogSession',
			secret: crypto.randomBytes(64).toString('hex'),
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				secure: true
			}
		})
	);
	app.use(passport.initialize());
	app.use(passport.session());

	const comms = new Comms({
		maxQueueSize: env.memorySize
	});

	const staticConfig: StaticFrontendConfig = { authAllowed: true };

	app.use((req, res, next) => {
		req.bulogEnvironment = env;
		req.bulogComms = comms;
		req.systemSignals = systemSignals;
		res.header('Access-Control-Allow-Origin', '*');
		next();
	});

	const auth = await serverAuth(env.config.auth);

	if (isDev) {
		app.use((req, res, next) => {
			if (req.url.startsWith('/@') || req.url.startsWith('/sandbox')) {
				next();
			} else {
				auth(req, res, next);
			}
		});
	} else {
		app.use(auth);
	}

	app.use('/api', getApiRouter());

	if (isDev) {
		await serveVite(app, server, staticConfig, systemSignals);
	} else {
		serveStatic(app, staticConfig);
	}

	app.use(((err, req, res, next) => {
		if (
			(err instanceof UnauthorizedError || err instanceof UnauthenticatedError) &&
			!req.url.startsWith('/api')
		) {
			// return res.oidc.logout();
			console.error(err);
			res.status(401).end(err.message);
		}

		if (err instanceof HTTPError) {
			res
				.status(err.status)
				.json({ status: err.status, message: err.message, code: err.errorCode });
		} else if (err) {
			console.error(err);
			res.status(500).end(err.message);
		} else {
			next();
		}
	}) as express.ErrorRequestHandler);

	systemSignals.onClose(async () => {
		const servers = app.getWebSocketServers();
		const promises = Promise.all(
			servers.map((wss) => new Promise<void>((res) => wss.close(() => res())))
		);
		for (const wss of servers) {
			for (const ws of wss.clients) {
				ws.terminate();
			}
		}
		await promises;
		return false;
	});

	return server;
}
