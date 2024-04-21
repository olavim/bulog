import fs from 'fs';
import path from 'path';
import { parse } from '@iarna/toml';
import envPaths from 'env-paths';
import { LogClientConfigSchema, LogClientInstanceConfigSchema } from '@/schemas';
import { fromZodError } from 'zod-validation-error';
import { z } from 'zod';
import { LogClientConfig } from '@/types';

const paths = envPaths('bulog');

const describedKeys = <T extends z.ZodTypeAny>(
	schema: T
): Array<{ keys: string[]; description?: string }> => {
	const descriptions: Array<{ keys: string[]; description?: string }> = [];

	if (schema?.description) {
		descriptions.push({ keys: [], description: schema.description });
	}

	if (schema === null || schema === undefined) {
		return descriptions;
	}

	if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
		return [...descriptions, ...describedKeys(schema.unwrap())];
	}

	if (schema instanceof z.ZodArray) {
		return [...descriptions, ...describedKeys(schema.element)];
	}

	if (schema instanceof z.ZodRecord) {
		return [
			...descriptions,
			...describedKeys(schema.valueSchema).map((desc) => ({
				keys: ['someKey', ...desc.keys],
				description: desc.description
			}))
		];
	}

	if (schema instanceof z.ZodObject) {
		for (const key of Object.keys(schema.shape)) {
			descriptions.push(
				...describedKeys(schema.shape[key]).map((desc) => ({
					keys: [key, ...desc.keys],
					description: desc.description
				}))
			);
		}

		return descriptions;
	}

	return descriptions;
};

const defaultClientConfigFile =
	'[default]\n' +
	describedKeys(LogClientInstanceConfigSchema)
		.map(({ keys, description }) =>
			description ? `# ${description}\n#${keys.join('.')} =` : `#${keys.join('.')} =`
		)
		.join('\n\n');

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

async function getLogClientConfigPath() {
	const configPath = path.resolve(paths.config, 'log-client.toml');
	await fs.promises.mkdir(paths.config, { recursive: true });

	if (!fs.existsSync(configPath)) {
		await fs.promises.writeFile(configPath, defaultClientConfigFile);
	}

	return configPath;
}

export async function validateLogClientConfig() {
	const configPath = await getLogClientConfigPath();

	try {
		const config = parse(await fs.promises.readFile(configPath, 'utf-8'));
		LogClientConfigSchema.parse(config);
	} catch (e: any) {
		throw new ConfigValidationError(fromZodError(e).toString(), configPath);
	}
}

export async function getLogClientConfig(
	instance: string
): Promise<LogClientConfig[keyof LogClientConfig]> {
	const configPath = await getLogClientConfigPath();
	const config = parse(await fs.promises.readFile(configPath, 'utf-8')) as LogClientConfig;
	return config[instance] ?? {};
}
