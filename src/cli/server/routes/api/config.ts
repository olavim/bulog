import express from 'express';
import {
	getBackendConfig,
	resetTempConfigs,
	saveBackendConfig
} from '@cli/utils/backend-config.js';
import { BulogConfigSchema } from '@/schemas';
import _ from 'lodash';
import { asyncErrorHandler } from '@server/utils/async-error-handler.js';

export const configRouter = express.Router();

configRouter.use(express.json());

configRouter.get(
	'/',
	asyncErrorHandler(async (req, res) => {
		const keys = ((req.query.k as string) ?? 'buckets,filters,server').split(',');
		const config = _.pick(await getBackendConfig(req.bulogEnvironment), keys);
		res.status(200).json(config);
	})
);

configRouter.put(
	'/',
	asyncErrorHandler(async (req, res) => {
		const config = BulogConfigSchema.parse(req.body);
		await saveBackendConfig(req.bulogEnvironment, config);
		req.bulogComms.filterLogs((log) => config.buckets[log.bucket]);
		res.status(200).json({ imported: true });
	})
);

configRouter.post(
	'/reset',
	asyncErrorHandler(async (req, res) => {
		if (!req.bulogEnvironment.flags['temp-config']) {
			return res.status(403).json({ error: 'API is disabled' });
		}

		await resetTempConfigs();
		res.status(200).json({ reset: true });
	})
);
