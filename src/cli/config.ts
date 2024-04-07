import fs from 'fs';
import path from 'path';
import { parse, stringify } from '@iarna/toml';
import envPaths from 'env-paths';

const paths = envPaths('bulog');

const bucketsConfigPath = path.resolve(paths.config, 'buckets.toml');
const filtersConfigPath = path.resolve(paths.config, 'filters.toml');

const bucketsTempPath = path.resolve(paths.temp, 'buckets.toml');
const filtersTempPath = path.resolve(paths.temp, 'filters.toml');

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

	await fs.promises.mkdir(dir, { recursive: true });

	if (!fs.existsSync(buckets)) {
		await fs.promises.writeFile(buckets, stringify({}));
	}

	if (!fs.existsSync(filters)) {
		await fs.promises.writeFile(filters, stringify({}));
	}

	return { buckets, filters };
}

export async function resetTempConfigs() {
	if (fs.existsSync(bucketsTempPath)) {
		await fs.promises.unlink(bucketsTempPath);
	}

	if (fs.existsSync(filtersTempPath)) {
		await fs.promises.unlink(filtersTempPath);
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
