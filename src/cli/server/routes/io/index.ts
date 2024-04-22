import { WebSocketCloseCodes } from '@/codes';
import { withWS } from '@cli/server/middlewares/ws.js';
import express from 'express';
import { WebSocket } from 'ws';

function handleWSAuth(ws: WebSocket, req: express.Request) {
	if (req.isAuthenticated()) {
		const checkExpiration = () => {
			if (ws.readyState !== ws.OPEN || !req.authInfo?.expired) {
				return;
			}

			if (req.authInfo.expired()) {
				ws.close(WebSocketCloseCodes.TOKEN_EXPIRED, 'Token expired');
			} else {
				// Check at least every minute if token has expired
				const timeout = Math.min(req.authInfo.expiresIn() * 1000, 60000);
				setTimeout(checkExpiration, timeout);
			}
		};

		checkExpiration();
	} else if (req.bulogEnvironment.config.auth.method !== 'none') {
		ws.close(WebSocketCloseCodes.UNAUTHENTICATED, 'Unauthenticated');
	}
}

export const getIORouter = () => {
	const ioRouter = withWS(express.Router());

	ioRouter.ws('/logs/write', (ws, req) => {
		handleWSAuth(ws, req);

		ws.on('message', (data) => {
			try {
				const { bucket, message, extraFields } = JSON.parse(data.toString());
				req.bulogComms.broadcast(bucket, message, extraFields);
			} catch (err) {
				// Ignore
			}
		});
	});

	ioRouter.ws('/logs/read', (ws, req) => {
		handleWSAuth(ws, req);

		const id = req.bulogComms.addMessageListener((logs) => {
			ws.send(JSON.stringify(logs));
		});

		ws.on('close', () => {
			req.bulogComms.removeMessageListener(id);
		});
	});

	return ioRouter;
};
