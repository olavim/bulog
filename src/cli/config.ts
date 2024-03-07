import fs from 'fs';
import path from 'path';
import { parse, stringify } from '@iarna/toml';
import envPaths from 'env-paths';

const paths = envPaths('bulog');
const bucketsConfigPath = path.resolve(paths.config, 'buckets.toml');
const filtersConfigPath = path.resolve(paths.config, 'filters.toml');

class ConfigValidationError extends Error {
    public configPath: string;

    constructor(message: string, configPath: string) {
        super(`Config file ${configPath} is invalid:\n\n${message.trim().split('\n').map(line => `\t${line}`).join('\n')}\n\nPlease fix or delete the file and try again.`);
        this.name = "ConfigValidationError";
        this.configPath = configPath;
    }
}

async function ensureConfigs() {
    await fs.promises.mkdir(paths.config, { recursive: true });

    if (!fs.existsSync(bucketsConfigPath)) {
        await fs.promises.writeFile(bucketsConfigPath, stringify({}));
    }

    if (!fs.existsSync(filtersConfigPath)) {
        await fs.promises.writeFile(filtersConfigPath, stringify({}));
    }
}

export async function validateConfigs() {
    await ensureConfigs();
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

export async function getBucketsConfig() {
    await ensureConfigs();
    const config = parse(await fs.promises.readFile(bucketsConfigPath, 'utf-8'));
    return config as unknown as { [bucket: string]: BucketConfig[] };
}

export async function saveBucketsConfig(config: { [bucket: string]: BucketConfig[] }) {
    await ensureConfigs();
    await fs.promises.writeFile(bucketsConfigPath, stringify(config as any));
}

export async function getFiltersConfig() {
    await ensureConfigs();
    const config = parse(await fs.promises.readFile(filtersConfigPath, 'utf-8'));
    return config as unknown as { [filter: string]: FilterConfig[] };
}

export async function saveFiltersConfig(config: { [filter: string]: FilterConfig[] }) {
    await ensureConfigs();
    await fs.promises.writeFile(filtersConfigPath, stringify(config as any));
}
