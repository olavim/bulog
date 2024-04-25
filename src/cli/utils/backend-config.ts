import fs from 'fs';
import path from 'path';
import { parse, stringify } from '@iarna/toml';
import envPaths from 'env-paths';
import z32 from 'z32';
import _ from 'lodash';
import { BulogConfigSchema } from '@/schemas';
import { fromZodError } from 'zod-validation-error';
import { z } from 'zod';
import { BulogConfig } from '@/types';
import { BulogEnvironment } from '@cli/commands/start.js';
import { fileExistsAsync } from '@cli/utils/file-exists-async.js';

const paths = envPaths('bulog');

const getBucketsConfigPath = (instance: string) =>
	path.resolve(paths.config, instance, 'buckets.toml');
const getFiltersConfigPath = (instance: string) =>
	path.resolve(paths.config, instance, 'filters.toml');
const getServerConfigPath = (instance: string) =>
	path.resolve(paths.config, instance, 'server.toml');

const bucketsTempPath = path.resolve(paths.temp, 'buckets.toml');
const filtersTempPath = path.resolve(paths.temp, 'filters.toml');
const serverTempPath = path.resolve(paths.temp, 'server.toml');

class ConfigValidationError extends Error {
	public configPath: string;

	constructor(message: string, configPath: string) {
		super(
			`Config file ${configPath} is invalid:\n\n${message
				.trim()
				.split('\n')
				.map((line) => `\t${line}`)
				.join('\n')}\n\nPlease fix or delete the file and try again.`
		);
		this.name = 'ConfigValidationError';
		this.configPath = configPath;
	}
}

async function ensureExists(path: string, schema: z.ZodTypeAny) {
	if (!(await fileExistsAsync(path))) {
		await fs.promises.writeFile(path, stringify(schema.parse({})));
	}
}

export async function getBackendConfigPaths(
	instance: string,
	tempConfig: boolean
): Promise<{ root: string; buckets: string; filters: string; server: string }>;
export async function getBackendConfigPaths(
	env: BulogEnvironment
): Promise<{ root: string; buckets: string; filters: string; server: string }>;
export async function getBackendConfigPaths(
	instanceOrEnv: BulogEnvironment | string,
	tempConfig?: boolean
): Promise<{ root: string; buckets: string; filters: string; server: string }> {
	const instance = typeof instanceOrEnv === 'string' ? instanceOrEnv : instanceOrEnv.flags.instance;
	const temp = typeof instanceOrEnv === 'string' ? tempConfig! : instanceOrEnv.flags['temp-config'];

	const root = temp ? paths.temp : path.resolve(paths.config, instance);
	const buckets = temp ? bucketsTempPath : getBucketsConfigPath(instance);
	const filters = temp ? filtersTempPath : getFiltersConfigPath(instance);
	const server = temp ? serverTempPath : getServerConfigPath(instance);

	await fs.promises.mkdir(root, { recursive: true });
	await Promise.all([
		ensureExists(buckets, BulogConfigSchema.shape.buckets),
		ensureExists(filters, BulogConfigSchema.shape.filters),
		ensureExists(server, BulogConfigSchema.shape.server)
	]);

	return { root, buckets, filters, server };
}

async function migrateBackendConfig(instance: string) {
	if (instance === 'default') {
		await fs.promises.mkdir(path.resolve(paths.config, 'default'), { recursive: true });

		if (fs.existsSync(path.resolve(paths.config, 'buckets.toml'))) {
			await fs.promises.rename(
				path.resolve(paths.config, 'buckets.toml'),
				path.resolve(paths.config, 'default/buckets.toml')
			);
		}

		if (fs.existsSync(path.resolve(paths.config, 'filters.toml'))) {
			await fs.promises.rename(
				path.resolve(paths.config, 'filters.toml'),
				path.resolve(paths.config, 'default/filters.toml')
			);
		}

		if (fs.existsSync(path.resolve(paths.config, 'server.toml'))) {
			await fs.promises.rename(
				path.resolve(paths.config, 'server.toml'),
				path.resolve(paths.config, 'default/server.toml')
			);
		}
	} else {
		const instanceZ32 = z32.encode(instance);
		if (fs.existsSync(path.resolve(paths.config, instanceZ32))) {
			await fs.promises.rename(
				path.resolve(paths.config, instanceZ32),
				path.resolve(paths.config, instance)
			);
		}
	}
}

export async function resetTempConfigs() {
	const files = await fs.promises.readdir(paths.temp);
	for (const file of files) {
		await fs.promises.unlink(path.join(paths.temp, file));
	}
}

export async function validateBackendConfigs(instance: string) {
	await migrateBackendConfig(instance);
	const paths = await getBackendConfigPaths(instance, false);

	const buckets = parse(await fs.promises.readFile(paths.buckets, 'utf-8'));
	const filters = parse(await fs.promises.readFile(paths.filters, 'utf-8'));
	const server = parse(await fs.promises.readFile(paths.server, 'utf-8')) as any;

	try {
		BulogConfigSchema.shape.buckets.parse(buckets);
	} catch (e: any) {
		throw new ConfigValidationError(fromZodError(e).toString(), paths.buckets);
	}

	try {
		BulogConfigSchema.shape.filters.parse(filters);
	} catch (e: any) {
		throw new ConfigValidationError(fromZodError(e).toString(), paths.filters);
	}

	const [httpsCertExists, httpsKeyExists] = await Promise.all([
		fileExistsAsync(path.resolve(paths.root, 'https.crt')),
		fileExistsAsync(path.resolve(paths.root, 'https.key'))
	]);
	_.set(server, 'https.cert', httpsCertExists);
	_.set(server, 'https.key', httpsKeyExists);

	try {
		BulogConfigSchema.shape.server.parse(server);
	} catch (e: any) {
		throw new ConfigValidationError(fromZodError(e).toString(), paths.server);
	}
}

export async function getBackendConfig(instance: string, tempConfig: boolean): Promise<BulogConfig>;
export async function getBackendConfig(env: BulogEnvironment): Promise<BulogConfig>;
export async function getBackendConfig(
	instanceOrEnv: BulogEnvironment | string,
	tempConfig?: boolean
) {
	const instance = typeof instanceOrEnv === 'string' ? instanceOrEnv : instanceOrEnv.flags.instance;
	const temp = typeof instanceOrEnv === 'string' ? tempConfig! : instanceOrEnv.flags['temp-config'];

	const paths = await getBackendConfigPaths(instance, temp);
	const [buckets, filters, server] = await Promise.all([
		fs.promises.readFile(paths.buckets, 'utf-8').then((data) => parse(data)),
		fs.promises.readFile(paths.filters, 'utf-8').then((data) => parse(data)),
		fs.promises.readFile(paths.server, 'utf-8').then((data) => parse(data))
	]);

	const [httpsCertExists, httpsKeyExists] = await Promise.all([
		fileExistsAsync(path.resolve(paths.root, 'https.crt')),
		fileExistsAsync(path.resolve(paths.root, 'https.key'))
	]);

	_.set(server, 'https.cert', httpsCertExists);
	_.set(server, 'https.key', httpsKeyExists);

	return BulogConfigSchema.parse({ buckets, filters, server });
}

export async function saveBackendConfig(env: BulogEnvironment, config: BulogConfig) {
	const paths = await getBackendConfigPaths(env);
	const serverConfig = { ...config.server };
	delete (serverConfig.https as Partial<typeof serverConfig.https>).cert;
	delete (serverConfig.https as Partial<typeof serverConfig.https>).key;
	await Promise.all([
		fs.promises.writeFile(paths.buckets, stringify(config.buckets as any)),
		fs.promises.writeFile(paths.filters, stringify(config.filters as any)),
		fs.promises.writeFile(paths.server, stringify(config.server as any))
	]);
}
