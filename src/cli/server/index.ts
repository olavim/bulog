import http from 'http';
import https from 'https';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import session from 'express-session';
import { apiRouter } from './routes/api/index.js';
import { getIORouter } from './routes/io/index.js';
import { Comms } from './comms.js';
import { SystemSignals } from './system-signals.js';
import { expressWS } from './middlewares/ws.js';
import { BulogError } from './errors.js';
import { StaticFrontendConfig } from '@/types';
import { BulogEnvironment } from '@cli/commands/start.js';
import { auth } from './middlewares/auth.js';
import passport from 'passport';
import { requireAnyAuth } from './middlewares/requireAuth.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const isDev = process.env.NODE_ENV === 'development';
const root = isDev ? path.resolve(dirname, '../../../') : path.resolve(dirname, '../../');
const appRoot = isDev ? path.resolve(dirname, '../../../src/app') : path.resolve(dirname, '../app');

function serveStatic(staticConfig: StaticFrontendConfig) {
	const router = express.Router();

	router.use('/assets', express.static(path.resolve(appRoot, 'assets')), (_req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		next();
	});

	router.get('/sandbox/index.html', requireAnyAuth({ redirect: true }), (_req, res) => {
		const html = fs.readFileSync(path.resolve(appRoot, 'sandbox/index.html'), 'utf-8');
		res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
	});

	router.get('/', requireAnyAuth({ redirect: true }), (_req, res) => {
		const template = fs.readFileSync(path.resolve(appRoot, 'index.html'), 'utf-8');
		const configScript = `<script>window.staticConfig = ${JSON.stringify(staticConfig)}</script>`;
		const html = template.replace('</head>', `${configScript}</head>`);
		res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
	});

	return router;
}

async function serveVite(
	hmrServer: http.Server,
	staticConfig: StaticFrontendConfig,
	systemSignals: SystemSignals
) {
	const { createServer: createViteServer } = await import('vite');
	const viteServer = await createViteServer({
		base: '/src',
		server: {
			middlewareMode: true,
			hmr: {
				path: '/__vite_hmr',
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

	const router = express.Router();

	router.use(viteServer.middlewares);

	const viteServe =
		(templatePath: string): express.RequestHandler =>
		async (req, res, next) => {
			try {
				let template = fs.readFileSync(templatePath, 'utf-8');
				template = await viteServer.transformIndexHtml(req.originalUrl, template);
				const configScript = `<script>window.staticConfig = ${JSON.stringify(staticConfig)}</script>`;
				const html = template.replace('</head>', `${configScript}</head>`);
				res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
			} catch (err: any) {
				viteServer.ssrFixStacktrace(err);
				next(err);
			}
		};

	router.get(
		'/sandbox/index.html',
		requireAnyAuth({ redirect: true }),
		viteServe(path.resolve(appRoot, 'sandbox/index.html'))
	);
	router.get(
		'/',
		requireAnyAuth({ redirect: true }),
		viteServe(path.resolve(appRoot, 'index.html'))
	);

	return router;
}

export async function getServer(env: BulogEnvironment, systemSignals: SystemSignals) {
	const _app = express();
	const server = https.createServer(
		{
			key: fs.readFileSync(path.resolve(root, 'proto/bulog.key'), 'utf8'),
			cert: fs.readFileSync(path.resolve(root, 'proto/bulog.crt'), 'utf8')
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
				secure: true,
				partitioned: false,
				sameSite: 'lax'
			}
		})
	);
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(await auth(env.config.auth));

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

	app.get('/favicon.ico', (_req, res) => {
		res.sendFile(path.resolve(appRoot, 'assets/react.svg'));
	});

	app.use('/api', requireAnyAuth({ redirect: false }), apiRouter);
	app.use('/io', getIORouter());

	if (isDev) {
		app.use('/', await serveVite(server, staticConfig, systemSignals));
	} else {
		app.use('/', serveStatic(staticConfig));
	}

	app.use(((err, _req, res, next) => {
		if (err instanceof BulogError) {
			return res
				.status(err.httpStatus)
				.json({ status: err.httpStatus, message: err.message, code: err.errorCode });
		}

		if (err) {
			console.error(err);
			return res
				.status(500)
				.json({ status: 500, message: 'Internal server error', code: 'ERR_INTERNAL' });
		}

		next();
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
