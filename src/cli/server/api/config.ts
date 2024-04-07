import express from 'express';
import {
	getBucketsConfig,
	getFiltersConfig,
	saveBucketsConfig,
	saveFiltersConfig,
	resetTempConfigs
} from '../../config.js';
import { BulogConfigSchema } from '../../../schemas.js';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(express.json());

router.get('/', async (req, res) => {
	const buckets = await getBucketsConfig(req.bulogOptions.tempConfig);
	const filters = await getFiltersConfig(req.bulogOptions.tempConfig);
	for (const key of Object.keys(buckets)) {
		buckets[key].columns = buckets[key].columns.map((c) => ({ ...c, id: c.id ?? nanoid(16) }));
	}
	for (const key of Object.keys(filters)) {
		filters[key].columns = filters[key].columns.map((c) => ({ ...c, id: c.id ?? nanoid(16) }));
		if (!filters[key].name) {
			filters[key].name = key;
			filters[nanoid(16)] = filters[key];
			delete filters[key];
		}
	}
	res.status(200).json({ buckets, filters } as BulogConfig);
});

router.put('/', async (req, res) => {
	const { buckets, filters } = BulogConfigSchema.parse(req.body);
	await saveBucketsConfig(buckets, req.bulogOptions.tempConfig);
	await saveFiltersConfig(filters, req.bulogOptions.tempConfig);
	req.bulogComms.filterLogs((log) => buckets[log.bucket]);
	res.status(200).json({ imported: true });
});

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
