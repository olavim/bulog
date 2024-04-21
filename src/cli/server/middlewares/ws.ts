import { Express, IRouter, NextFunction, Request, RequestHandler } from 'express';
import { Server, ServerResponse } from 'http';
import { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { routeExists } from '../utils/route-exists.js';

interface RequestWithSocket extends Request {
	upgradeMetadata?: {
		socket: Duplex;
		head: Buffer;
		url: string;
		method: string;
		upgradeHandled: boolean;
		error: { message: string; code: number } | null;
	};
	wsHandled?: boolean;
}

type WSConnectionHandler = (ws: WebSocket, req: RequestWithSocket, next: NextFunction) => void;

interface WSHandlerOpts {
	beforeUpgrade?: (socket: Duplex, req: RequestWithSocket, next: NextFunction) => void;
	handler: WSConnectionHandler;
}

export interface WithWS {
	getWebSocketServers: () => WebSocketServer[];
	ws: (path: string, opts: WSHandlerOpts) => WebSocketServer;
}

function internalPath(path: string, ext: string) {
	const [basePath, query] = path.split('?');
	const normalizedPath = basePath.replace(/\/$/, '');
	const normalizedQuery = query ? `?${query}` : '';
	return `${normalizedPath}/.${ext}${normalizedQuery}`;
}

function upgradePath(path: string) {
	return internalPath(path, 'upgrade');
}

function authPath(path: string) {
	return internalPath(path, 'auth');
}

function upgrade(wss: WebSocketServer, opts: WSHandlerOpts): RequestHandler {
	return (req: RequestWithSocket, _res, next) => {
		const upgradeMetadata = req.upgradeMetadata;

		if (!upgradeMetadata) {
			return next();
		}

		req.url = upgradeMetadata.url;
		req.method = upgradeMetadata.method;

		const upgrade = () => {
			wss.handleUpgrade(req, upgradeMetadata.socket, upgradeMetadata.head, (ws) => {
				if (upgradeMetadata.error) {
					ws.close(4000, upgradeMetadata.error.message);
				} else {
					wss.emit('connection', ws, req);
					upgradeMetadata.upgradeHandled = true;
					next();
				}
			});
		};

		if (opts.beforeUpgrade) {
			try {
				opts.beforeUpgrade(upgradeMetadata.socket, req, () => upgrade());
			} catch (err) {
				console.log(err);
				next();
			}
		} else {
			upgrade();
		}
	};
}

function getSubRouters(handle: any): any[] {
	if (handle.stack) {
		return handle.stack.filter((layer: any) => layer.name === 'router');
	}

	return [];
}

export function withWS<T extends IRouter>(target: T): T & WithWS {
	const targetWS = target as T & WithWS;
	const wsServers: WebSocketServer[] = [];

	if ((targetWS as any).ws) {
		return targetWS;
	}

	targetWS.ws = (path, opts) => {
		const wss = new WebSocketServer({ noServer: true });
		wsServers.push(wss);

		wss.on('connection', (ws, req) => {
			const reqWithWS = req as RequestWithSocket;
			opts.handler(ws, reqWithWS, () => {
				ws.close();
			});
		});

		targetWS.get(upgradePath(path), upgrade(wss, opts));
		targetWS.get(authPath(path), (_req, res) => {
			res.status(200).json({ status: 'ok' });
		});

		return wss;
	};

	targetWS.getWebSocketServers = () => {
		const servers = [...wsServers];
		const routers = getSubRouters((targetWS as any)._router ?? targetWS);

		while (routers.length > 0) {
			const router = routers.pop();
			if (router.handle.getWebSocketServers) {
				// Get WS servers from sub-router recursively
				servers.push(...router.handle.getWebSocketServers());
			} else if (router.handle.stack) {
				// Current router didn't have WS servers, but its sub-routers might
				routers.push(...getSubRouters(router.handle));
			}
		}

		return servers;
	};

	return targetWS;
}

export function expressWS(app: Express, server: Server): Express & WithWS {
	const wsApp = app as Express & WithWS;

	server.on('upgrade', (request, socket, head) => {
		if (!request.url || !request.method) {
			socket.destroy();
			return;
		}

		const upgradeUrl = upgradePath(request.url);

		// Don't upgrade if a handler hasn't been registered
		if (!routeExists(app, upgradeUrl)) {
			return;
		}

		const req = request as RequestWithSocket;
		const res = new ServerResponse(req);

		res.writeHead = (statusCode): any => {
			if (statusCode >= 400) {
				socket.write(`HTTP/1.1 ${statusCode}\n\n`);
				socket.destroy();
			}
		};

		const originalUrl = request.url;
		const originalMethod = request.method;

		req.url = upgradeUrl;
		req.method = 'GET';
		req.upgradeMetadata = {
			socket,
			head,
			url: originalUrl,
			method: originalMethod,
			upgradeHandled: false,
			error: null
		};

		(wsApp as any).handle(req, res, () => {
			if (!req.upgradeMetadata?.upgradeHandled) {
				socket.destroy();
			}
		});
	});

	return withWS(wsApp);
}
