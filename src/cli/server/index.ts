import http from 'http';
import https from 'https';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import mustache from 'mustache-express';
import { apiRouter } from './routes/api/index.js';
import { getIORouter } from './routes/io/index.js';
import { Comms } from './comms.js';
import { SystemSignals } from './system-signals.js';
import { expressWS } from './middlewares/ws.js';
import {
	BulogError,
	InternalServerError,
	UnauthenticatedError,
	UnauthorizedError
} from './errors.js';
import { StaticFrontendConfig } from '@/types';
import { BulogEnvironment } from '@cli/commands/start.js';
import { auth } from './middlewares/auth.js';
import { requireAnyAuth } from './middlewares/require-auth.js';
import { cookieSession } from './middlewares/cookie-session.js';
import { asyncErrorHandler } from './utils/async-error-handler.js';
import { requireWebClientClaims } from './middlewares/require-claims.js';
import { getBackendConfigPaths } from '@cli/utils/backend-config.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const isDev = process.env.NODE_ENV === 'development';
const appRoot = isDev ? path.resolve(dirname, '../../../src/app') : path.resolve(dirname, '../app');
const cookieSecret = crypto.randomBytes(64).toString('hex');

function serveStatic(staticConfig: StaticFrontendConfig) {
	const router = express.Router();

	router.use('/assets', express.static(path.resolve(appRoot, 'assets')), (_req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		next();
	});

	router.get(
		'/sandbox/index.html',
		requireAnyAuth({ redirect: true }),
		requireWebClientClaims,
		(_req, res) => {
			const html = fs.readFileSync(path.resolve(appRoot, 'sandbox/index.html'), 'utf-8');
			res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
		}
	);

	router.get('/', requireAnyAuth({ redirect: true }), requireWebClientClaims, (_req, res) => {
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
			hmr:
				process.env.DISABLE_VITE_HMR !== 'true'
					? {
							path: '/__vite_hmr',
							server: hmrServer
						}
					: false
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

	const viteServe = (templatePath: string): express.RequestHandler =>
		asyncErrorHandler(async (req, res, next) => {
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
		});

	router.get(
		'/sandbox/index.html',
		requireAnyAuth({ redirect: true }),
		requireWebClientClaims,
		viteServe(path.resolve(appRoot, 'sandbox/index.html'))
	);
	router.get(
		'/',
		requireAnyAuth({ redirect: true }),
		requireWebClientClaims,
		viteServe(path.resolve(appRoot, 'index.html'))
	);

	return router;
}

async function getHttpServer(app: express.Express, env: BulogEnvironment) {
	const { root: configRoot } = await getBackendConfigPaths(env);
	if (env.config.https.enabled) {
		const [cert, key] = await Promise.all([
			fs.promises.readFile(path.resolve(configRoot, 'https.crt'), 'utf8'),
			fs.promises.readFile(path.resolve(configRoot, 'https.key'), 'utf8')
		]);
		return https.createServer({ cert, key }, app);
	}

	return http.createServer(app);
}

export async function getServer(env: BulogEnvironment, systemSignals: SystemSignals) {
	const _app = express();
	const server = await getHttpServer(_app, env);
	const app = expressWS(_app, server);

	app.engine('mst', mustache());
	app.set('view engine', 'mst');
	app.set('views', path.resolve(dirname, 'views'));
	app.set('view cache', !isDev);
	app.set('trust proxy', true);

	app.use((req, res, next) => {
		req.bulogEnvironment = env;
		req.bulogComms = comms;
		req.systemSignals = systemSignals;
		res.header('Access-Control-Allow-Origin', '*');
		next();
	});

	app.use(cookieParser());
	app.use(
		cookieSession({
			name: 'bulogSession',
			secret: cookieSecret,
			httpOnly: true,
			secure: true,
			partitioned: false,
			sameSite: 'lax'
		})
	);
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(await auth(env.config.auth));

	const comms = new Comms({
		maxQueueSize: env.memorySize
	});

	const staticConfig: StaticFrontendConfig = { authAllowed: true };

	app.get('/favicon.ico', (_req, res) => {
		res.sendFile(path.resolve(appRoot, 'assets/react.svg'));
	});

	app.use('/api', requireAnyAuth({ redirect: false }), requireWebClientClaims, apiRouter);
	app.use('/io', requireAnyAuth({ redirect: false }), getIORouter());

	if (isDev) {
		app.use('/', await serveVite(server, staticConfig, systemSignals));
	} else {
		app.use('/', serveStatic(staticConfig));
	}

	app.use(((err, req, res, next) => {
		if (res.headersSent) {
			return next(err);
		}

		const bulogErr = err instanceof BulogError ? err : new InternalServerError(err.message);

		if (bulogErr instanceof InternalServerError) {
			console.error(err);
		}

		const done = () => {
			if ((req as any).ws) {
				(req as any).ws.close(bulogErr.wsCloseCode, bulogErr.httpStatusMessage);
				return;
			}

			if (req.accepts('html')) {
				return res.status(bulogErr.httpStatus).render('error', {
					httpStatus: bulogErr.httpStatus,
					httpStatusMessage: bulogErr.httpStatusMessage,
					httpStatusMessageLong: bulogErr.httpStatusMessageLong,
					errorCode: bulogErr.errorCode,
					errorMessage: bulogErr.detailMessage,
					devMessage: isDev ? bulogErr.devMessage : undefined,
					showLogout: bulogErr instanceof UnauthorizedError,
					showLogin: bulogErr instanceof UnauthenticatedError
				});
			}

			res
				.status(bulogErr.httpStatus)
				.json({ status: bulogErr.httpStatus, message: bulogErr.message, code: bulogErr.errorCode });
		};

		done();
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
