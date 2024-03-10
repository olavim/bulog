import express from 'express';
import {
	getBucketsConfig,
	getFiltersConfig,
	saveBucketsConfig,
	saveFiltersConfig
} from '../../config.js';

const router = express.Router();
router.use(express.json());

router.get('/buckets', async (req, res) => {
	const buckets = req.bulogOptions.stateless
		? {}
		: await getBucketsConfig(req.bulogOptions.tempConfig);
	res.status(200).send({ buckets });
});

router.post('/buckets', async (req, res) => {
	const buckets = req.body;
	if (!req.bulogOptions.stateless) {
		await saveBucketsConfig(buckets, req.bulogOptions.tempConfig);
	}
	res.status(200).send({ buckets });
});

router.get('/filters', async (req, res) => {
	const filters = req.bulogOptions.stateless
		? {}
		: await getFiltersConfig(req.bulogOptions.tempConfig);
	res.status(200).send({ filters });
});

router.post('/filters', async (req, res) => {
	const filters = req.body;
	if (!req.bulogOptions.stateless) {
		await saveFiltersConfig(filters, req.bulogOptions.tempConfig);
	}
	res.status(200).send({ filters });
});

export default router;
