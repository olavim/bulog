import express from 'express';
import {
	getBackendConfig,
	getBackendConfigPaths,
	resetTempConfigs,
	saveBackendConfig
} from '@cli/utils/backend-config.js';
import fileUpload from 'express-fileupload';
import { BulogConfigSchema } from '@/schemas';
import _ from 'lodash';
import { asyncErrorHandler } from '@server/utils/async-error-handler.js';
import { BadRequestError } from '@cli/server/errors.js';
import { fileExistsAsync } from '@cli/utils/file-exists-async.js';
import path from 'path';
import fs from 'fs';

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

configRouter.post(
	'/',
	fileUpload({ abortOnLimit: true, limits: { fileSize: 10 * 1024 } }),
	asyncErrorHandler(async (req, res) => {
		const httpsCertFile = req.files?.['https-cert'] as fileUpload.UploadedFile | undefined;
		const httpsKeyFile = req.files?.['https-key'] as fileUpload.UploadedFile | undefined;

		const { root: configRoot } = await getBackendConfigPaths(req.bulogEnvironment);

		if (httpsCertFile) {
			await httpsCertFile.mv(path.resolve(configRoot, 'https.crt'));
		}

		if (httpsKeyFile) {
			await httpsKeyFile.mv(path.resolve(configRoot, 'https.key'));
		}

		res.status(200).json({ saved: true });
	})
);

configRouter.put(
	'/',
	asyncErrorHandler(async (req, res) => {
		const newConfig = BulogConfigSchema.parse(req.body);

		const { root: configRoot } = await getBackendConfigPaths(req.bulogEnvironment);

		const [httpsCertExists, httpsKeyExists] = await Promise.all([
			fileExistsAsync(path.resolve(configRoot, 'https.crt')),
			fileExistsAsync(path.resolve(configRoot, 'https.key'))
		]);

		if (newConfig.server.https.enabled && !httpsCertExists) {
			throw new BadRequestError('Cannot enable HTTPS without a certificate file');
		}

		if (newConfig.server.https.enabled && !httpsKeyExists) {
			throw new BadRequestError('Cannot enable HTTPS without a private key file');
		}

		if (!newConfig.server.https.cert && httpsCertExists) {
			await fs.promises.unlink(path.resolve(configRoot, 'https.crt'));
		}

		if (!newConfig.server.https.key && httpsKeyExists) {
			await fs.promises.unlink(path.resolve(configRoot, 'https.key'));
		}

		await saveBackendConfig(req.bulogEnvironment, newConfig);
		req.bulogComms.filterLogs((log) => newConfig.buckets[log.bucket]);
		res.status(200).json({ saved: true });
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
