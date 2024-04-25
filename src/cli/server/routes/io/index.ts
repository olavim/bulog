import { TokenExpiredError } from '@cli/server/errors.js';
import {
	requireLogClientClaims,
	requireWebClientClaims
} from '@cli/server/middlewares/require-claims.js';
import { withWS } from '@cli/server/middlewares/ws.js';
import express from 'express';
import { WebSocket } from 'ws';

function handleTokenExpiration(ws: WebSocket, req: express.Request) {
	if (req.bulogEnvironment.config.auth.method === 'none') {
		return;
	}

	const checkExpiration = () => {
		if (ws.readyState !== ws.OPEN || !req.authInfo?.expired) {
			return;
		}

		if (req.authInfo.expired()) {
			throw new TokenExpiredError();
		} else {
			// Check at least every minute if token has expired
			const timeout = Math.min(req.authInfo.expiresIn() * 1000, 60000);
			setTimeout(checkExpiration, timeout);
		}
	};

	checkExpiration();
}

export const getIORouter = () => {
	const ioRouter = withWS(express.Router());

	ioRouter.ws('/logs/write', requireLogClientClaims, (ws, req) => {
		handleTokenExpiration(ws, req);
		console.log('write connection');

		ws.on('message', (data) => {
			console.log('message');
			try {
				const { bucket, message, extraFields } = JSON.parse(data.toString());
				req.bulogComms.broadcast(bucket, message, extraFields);
			} catch (err) {
				// Ignore
			}
		});
	});

	ioRouter.ws('/logs/read', requireWebClientClaims, (ws, req) => {
		handleTokenExpiration(ws, req);
		console.log('connection');

		const id = req.bulogComms.addMessageListener((logs) => {
			ws.send(JSON.stringify(logs));
		});

		ws.on('close', () => {
			req.bulogComms.removeMessageListener(id);
		});
	});

	return ioRouter;
};
