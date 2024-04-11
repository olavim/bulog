import express from 'express';
import { getServerConfig } from '@cli/utils/config.js';

const router = express.Router();

router.post('/cache/reset', (req, res) => {
	req.bulogComms.resetCache();
	res.status(200).json({ reset: true });
});

router.get('/environment', async (req, res) => {
	res.status(200).json(req.bulogEnvironment);
});

router.post('/reboot', async (req, res) => {
	const config = await getServerConfig(
		req.bulogEnvironment.instance.value,
		req.bulogEnvironment.tempConfig.value
	);

	const nextHost = req.bulogEnvironment.host.config
		? config.defaults.hostname
		: req.bulogEnvironment.host.value;
	const nextPort = req.bulogEnvironment.port.config
		? config.defaults.port
		: req.bulogEnvironment.port.value;

	const nextRedirectableHost = nextHost === '0.0.0.0' ? '127.0.0.1' : nextHost;

	res.status(200).json({ redirect: `${req.protocol}://${nextRedirectableHost}:${nextPort}` });
	req.systemSignals.reboot();
});

export default router;
