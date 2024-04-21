import express from 'express';
import { getBackendConfig } from '@cli/utils/backend-config.js';

export const systemRouter = express.Router();

systemRouter.post('/cache/reset', (req, res) => {
	req.bulogComms.resetCache();
	res.status(200).json({ reset: true });
});

systemRouter.get('/environment', async (req, res) => {
	res.status(200).json(req.bulogEnvironment);
});

systemRouter.post('/reboot', async (req, res) => {
	const config = await getBackendConfig(req.bulogEnvironment);

	const nextHost =
		req.bulogEnvironment.flags.host === undefined
			? config.server.defaults.hostname
			: req.bulogEnvironment.flags.host;
	const nextPort =
		req.bulogEnvironment.flags.port === undefined
			? config.server.defaults.port
			: req.bulogEnvironment.flags.port;

	const nextRedirectableHost = nextHost === '0.0.0.0' ? '127.0.0.1' : nextHost;

	res.status(200).json({ redirect: `${req.protocol}://${nextRedirectableHost}:${nextPort}` });
	req.systemSignals.reboot();
});
