import express from 'express';
import {
	getBucketsConfig,
	getFiltersConfig,
	saveBucketsConfig,
	saveFiltersConfig,
	resetTempConfigs,
	getServerConfig,
	saveServerConfig
} from '@/config';
import { BulogConfigSchema } from '@/schemas';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(express.json());

router.get('/', async (req, res) => {
	const keys = ((req.query.k as string) ?? 'buckets,filters,server').split(',');
	const config: Partial<BulogConfig> = {};

	if (keys.includes('buckets')) {
		config.buckets = await getBucketsConfig(req.bulogOptions.tempConfig);

		for (const key of Object.keys(config.buckets)) {
			config.buckets[key].columns = config.buckets[key].columns.map((c) => ({
				...c,
				id: c.id ?? nanoid(16)
			}));
		}
	}

	if (keys.includes('filters')) {
		config.filters = await getFiltersConfig(req.bulogOptions.tempConfig);

		for (const key of Object.keys(config.filters)) {
			config.filters[key].columns = config.filters[key].columns.map((c) => ({
				...c,
				id: c.id ?? nanoid(16)
			}));
			if (!config.filters[key].name) {
				config.filters[key].name = key;
				config.filters[nanoid(16)] = config.filters[key];
				delete config.filters[key];
			}
		}
	}

	if (keys.includes('server')) {
		config.server = await getServerConfig(req.bulogOptions.tempConfig);
	}

	res.status(200).json(config);
});

router.put('/', async (req, res) => {
	const { buckets, filters, server } = BulogConfigSchema.parse(req.body);
	await saveBucketsConfig(buckets, req.bulogOptions.tempConfig);
	await saveFiltersConfig(filters, req.bulogOptions.tempConfig);
	await saveServerConfig(server, req.bulogOptions.tempConfig);
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
