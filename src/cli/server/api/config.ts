import express from 'express';
import {
	getBucketsConfig,
	getFiltersConfig,
	saveBucketsConfig,
	saveFiltersConfig,
	resetTempConfigs,
	getServerConfig,
	saveServerConfig
} from '@cli/utils/config.js';
import { BulogConfigSchema } from '@/schemas';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(express.json());

router.get('/', async (req, res) => {
	const keys = ((req.query.k as string) ?? 'buckets,filters,server').split(',');
	const config: Partial<BulogConfig> = {};

	if (keys.includes('buckets')) {
		config.buckets = await getBucketsConfig(
			req.bulogEnvironment.instance.value,
			req.bulogEnvironment.tempConfig.value
		);

		for (const key of Object.keys(config.buckets)) {
			config.buckets[key].columns = config.buckets[key].columns.map((c) => ({
				...c,
				id: c.id ?? nanoid(16)
			}));
		}
	}

	if (keys.includes('filters')) {
		config.filters = await getFiltersConfig(
			req.bulogEnvironment.instance.value,
			req.bulogEnvironment.tempConfig.value
		);

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
		config.server = await getServerConfig(
			req.bulogEnvironment.instance.value,
			req.bulogEnvironment.tempConfig.value
		);
	}

	res.status(200).json(config);
});

router.put('/', async (req, res) => {
	const { buckets, filters, server } = BulogConfigSchema.parse(req.body);
	await saveBucketsConfig(
		req.bulogEnvironment.instance.value,
		buckets,
		req.bulogEnvironment.tempConfig.value
	);
	await saveFiltersConfig(
		req.bulogEnvironment.instance.value,
		filters,
		req.bulogEnvironment.tempConfig.value
	);
	await saveServerConfig(
		req.bulogEnvironment.instance.value,
		server,
		req.bulogEnvironment.tempConfig.value
	);
	req.bulogComms.filterLogs((log) => buckets[log.bucket]);
	res.status(200).json({ imported: true });
});

router.post('/reset', async (req, res) => {
	if (!req.bulogEnvironment.tempConfig.value) {
		return res.status(403).json({ error: 'API is disabled' });
	}

	await resetTempConfigs();
	res.status(200).json({ reset: true });
});

export default router;
