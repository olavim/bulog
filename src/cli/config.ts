import fs from 'fs';
import path from 'path';
import { parse, stringify } from '@iarna/toml';
import envPaths from 'env-paths';

const paths = envPaths('bulog');

const bucketsConfigPath = path.resolve(paths.config, 'buckets.toml');
const filtersConfigPath = path.resolve(paths.config, 'filters.toml');
const serverConfigPath = path.resolve(paths.config, 'server.toml');

const bucketsTempPath = path.resolve(paths.temp, 'buckets.toml');
const filtersTempPath = path.resolve(paths.temp, 'filters.toml');
const serverTempPath = path.resolve(paths.temp, 'server.toml');

const defaultServerConfig: ServerConfig = {
	defaults: {
		hostname: '0.0.0.0',
		port: 3100,
		memorySize: 1000
	}
};

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

async function getConfigPaths(opts: { tempConfig: boolean }) {
	const dir = opts.tempConfig ? paths.temp : paths.config;
	const buckets = opts.tempConfig ? bucketsTempPath : bucketsConfigPath;
	const filters = opts.tempConfig ? filtersTempPath : filtersConfigPath;
	const server = opts.tempConfig ? serverTempPath : serverConfigPath;

	await fs.promises.mkdir(dir, { recursive: true });

	if (!fs.existsSync(buckets)) {
		await fs.promises.writeFile(buckets, stringify({}));
	}

	if (!fs.existsSync(filters)) {
		await fs.promises.writeFile(filters, stringify({}));
	}

	if (!fs.existsSync(server)) {
		await fs.promises.writeFile(server, stringify(defaultServerConfig as any));
	}

	return { buckets, filters, server };
}

export async function resetTempConfigs() {
	if (fs.existsSync(bucketsTempPath)) {
		await fs.promises.unlink(bucketsTempPath);
	}

	if (fs.existsSync(filtersTempPath)) {
		await fs.promises.unlink(filtersTempPath);
	}

	if (fs.existsSync(serverTempPath)) {
		await fs.promises.unlink(serverTempPath);
	}
}

export async function validateConfigs() {
	await getConfigPaths({ tempConfig: false });
	try {
		parse(await fs.promises.readFile(bucketsConfigPath, 'utf-8'));
	} catch (e: any) {
		throw new ConfigValidationError(e.message, bucketsConfigPath);
	}

	try {
		parse(await fs.promises.readFile(filtersConfigPath, 'utf-8'));
	} catch (e: any) {
		throw new ConfigValidationError(e.message, filtersConfigPath);
	}
}

export async function getBucketsConfig(tempConfig: boolean) {
	const paths = await getConfigPaths({ tempConfig });
	const config = parse(await fs.promises.readFile(paths.buckets, 'utf-8'));
	return config as unknown as BulogConfig['buckets'];
}

export async function saveBucketsConfig(config: BulogConfig['buckets'], tempConfig: boolean) {
	const paths = await getConfigPaths({ tempConfig });
	await fs.promises.writeFile(paths.buckets, stringify(config as any));
}

export async function getFiltersConfig(tempConfig: boolean) {
	const paths = await getConfigPaths({ tempConfig });
	const config = parse(await fs.promises.readFile(paths.filters, 'utf-8'));
	return config as unknown as BulogConfig['filters'];
}

export async function saveFiltersConfig(config: BulogConfig['filters'], tempConfig: boolean) {
	const paths = await getConfigPaths({ tempConfig });
	await fs.promises.writeFile(paths.filters, stringify(config as any));
}

export async function getServerConfig(tempConfig: boolean) {
	const paths = await getConfigPaths({ tempConfig });
	const config = parse(await fs.promises.readFile(paths.server, 'utf-8'));
	return config as unknown as BulogConfig['server'];
}

export async function saveServerConfig(config: BulogConfig['server'], tempConfig: boolean) {
	const paths = await getConfigPaths({ tempConfig });
	await fs.promises.writeFile(paths.server, stringify(config as any));
}
