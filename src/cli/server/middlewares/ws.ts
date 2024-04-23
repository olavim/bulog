import { Express, IRouter, NextFunction, Request, RequestHandler } from 'express';
import { Server, ServerResponse } from 'http';
import { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { routeExists } from '../utils/route-exists.js';
import { getRouteHandler } from '../utils/get-route-handler.js';
import { BulogError, InternalServerError } from '../errors.js';

interface RequestWithWS extends Request {
	upgradeMetadata?: {
		app: Express & WithWS;
		socket: Duplex;
		head: Buffer;
		url: string;
		method: string;
	};
	ws: WebSocket;
}

type WSConnectionHandler = (ws: WebSocket, req: RequestWithWS, next: NextFunction) => void;

export interface WithWS {
	getWebSocketServers: () => WebSocketServer[];
	ws: (path: string, ...middlewares: [...RequestHandler[], WSConnectionHandler]) => WebSocketServer;
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

function upgrade(wss: WebSocketServer): RequestHandler {
	return (req, res, next) => {
		const reqWithWS = req as RequestWithWS;
		const upgradeMetadata = reqWithWS.upgradeMetadata;

		if (!upgradeMetadata) {
			return next();
		}

		delete reqWithWS.upgradeMetadata;
		reqWithWS.url = upgradeMetadata.url;
		reqWithWS.method = upgradeMetadata.method;

		wss.handleUpgrade(reqWithWS, upgradeMetadata.socket, upgradeMetadata.head, (ws) => {
			reqWithWS.url = upgradePath(upgradeMetadata.url);
			reqWithWS.method = 'GET';
			reqWithWS.ws = ws;

			(upgradeMetadata.app as any).handle(req, res, (err: any) => {
				if (err) {
					if (err instanceof BulogError) {
						ws.close(err.wsCloseCode, err.message);
					} else {
						console.error(err);
						ws.close();
					}
				} else {
					wss.emit('connection', ws, req);
				}
			});
		});
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

	targetWS.ws = (path, ...middlewares) => {
		if (middlewares.length === 0) {
			throw new InternalServerError('No connection handler provided');
		}

		const handler = middlewares.pop() as WSConnectionHandler;

		const wss = new WebSocketServer({ noServer: true });
		wsServers.push(wss);

		wss.on('connection', (ws, req) => {
			const reqWithWS = req as RequestWithWS;
			handler(ws, reqWithWS, () => {
				ws.close();
			});
		});

		targetWS.get(upgradePath(path), ...(middlewares as RequestHandler[]), upgrade(wss) as any);

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
	if ((app as any).ws) {
		return app as Express & WithWS;
	}

	const wsApp = withWS(app);

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

		const req = request as RequestWithWS;
		const res = new ServerResponse(req);

		res.writeHead = (statusCode): any => {
			socket.write(`HTTP/1.1 ${statusCode}\n\n`);
			socket.destroy();
		};

		const originalUrl = request.url;
		const originalMethod = request.method;

		req.url = upgradeUrl;
		req.method = 'GET';
		req.upgradeMetadata = {
			app: wsApp,
			socket,
			head,
			url: originalUrl,
			method: originalMethod
		};

		const handler = getRouteHandler(wsApp, upgradeUrl);
		if (handler) {
			handler(req, res, () => {
				socket.write('HTTP/1.1 404\n\n');
				socket.destroy();
			});
		} else {
			socket.write('HTTP/1.1 404\n\n');
			socket.destroy();
		}
	});

	return wsApp;
}
