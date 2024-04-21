import express from 'express';
import { TokenSet } from 'openid-client';
import { WebSocket } from 'ws';
import { withWS } from '../middlewares/ws.js';

function handleWSAuth(ws: WebSocket, req: express.Request) {
	if (req.isAuthenticated() && req.user instanceof TokenSet) {
		const tokenSet = req.user as TokenSet;

		const checkExpiration = () => {
			if (ws.readyState !== ws.OPEN) {
				return;
			}

			if (tokenSet.expired()) {
				ws.close(4000, 'Token expired');
			} else {
				const timeout = tokenSet.expires_in! > 60 ? 60000 : tokenSet.expires_in! * 1000;
				setTimeout(checkExpiration, timeout);
			}
		};

		checkExpiration();
	}
}

export const getSocketsRouter = () => {
	const socketsRouter = withWS(express.Router());

	socketsRouter.ws('/in', {
		handler: (ws, req) => {
			handleWSAuth(ws, req);

			ws.on('message', (data) => {
				try {
					const { bucket, message, extraFields } = JSON.parse(data.toString());
					req.bulogComms.broadcast(bucket, message, extraFields);
				} catch (err) {
					// Ignore
				}
			});
		}
	});

	socketsRouter.ws('/out', {
		handler: (ws, req) => {
			handleWSAuth(ws, req);

			ws.on('message', (data) => {
				try {
					const { bucket, message, extraFields } = JSON.parse(data.toString());
					req.bulogComms.broadcast(bucket, message, extraFields);
				} catch (err) {
					// Ignore
				}
			});
		}
	});

	return socketsRouter;
};
