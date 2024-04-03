import express from 'express';
import {
	getBucketsConfig,
	getFiltersConfig,
	saveBucketsConfig,
	saveFiltersConfig,
	resetTempConfigs
} from '../../config.js';

const router = express.Router();
router.use(express.json());

router.post('/reset', async (req, res) => {
	if (!req.bulogOptions.tempConfig) {
		return res.status(403).json({ error: 'API is disabled' });
	}

	await resetTempConfigs();
	res.status(200).json({ reset: true });
});

router.get('/buckets', async (req, res) => {
	const buckets = await getBucketsConfig(req.bulogOptions.tempConfig);
	res.status(200).json({ buckets });
});

router.post('/buckets', async (req, res) => {
	await saveBucketsConfig(req.body, req.bulogOptions.tempConfig);
	res.status(200).json({ buckets: req.body });
});

router.get('/filters', async (req, res) => {
	const filters = await getFiltersConfig(req.bulogOptions.tempConfig);
	res.status(200).json({ filters });
});

router.post('/filters', async (req, res) => {
	await saveFiltersConfig(req.body, req.bulogOptions.tempConfig);
	res.status(200).json({ filters: req.body });
});

export default router;
