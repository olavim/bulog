import express from 'express';
import { getBackendConfig } from '@cli/utils/backend-config.js';
import { asyncErrorHandler } from '@server/utils/async-error-handler.js';

export const systemRouter = express.Router();

systemRouter.post('/cache/reset', (req, res) => {
	req.bulogComms.resetCache();
	res.status(200).json({ reset: true });
});

systemRouter.get(
	'/environment',
	asyncErrorHandler(async (req, res) => {
		res.status(200).json(req.bulogEnvironment);
	})
);

systemRouter.post(
	'/reboot',
	asyncErrorHandler(async (req, res) => {
		const config = await getBackendConfig(req.bulogEnvironment);

		const nextHost =
			req.bulogEnvironment.flags.host === undefined
				? config.server.defaults.hostname
				: req.bulogEnvironment.flags.host;
		const nextPort =
			req.bulogEnvironment.flags.port === undefined
				? config.server.defaults.port
				: req.bulogEnvironment.flags.port;
		const nextProtocol = config.server.https.enabled ? 'https' : 'http';

		res.status(200).json({ host: nextHost, port: nextPort, protocol: nextProtocol });
		req.systemSignals.reboot();
	})
);
