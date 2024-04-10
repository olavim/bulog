import fs from 'fs';
import path from 'path';
import envPaths from 'env-paths';
import z32 from 'z32';
import lodash from 'lodash';

const paths = envPaths('bulog');

export async function getInstanceConfig(instanceId: string) {
	const encodedId = z32.encode(instanceId);
	const configPath = path.resolve(paths.data, `instance.${encodedId}`);
	return fs.promises.readFile(configPath, 'utf8').catch(() => null);
}

export function watchInstanceConfig(instanceId: string, cb: (data: string | null) => void) {
	const encodedId = z32.encode(instanceId);
	const configPath = path.resolve(paths.data, `instance.${encodedId}`);
	const debouncedWatchListener = lodash.debounce(() => getInstanceConfig(instanceId).then(cb), 500);
	fs.watch(configPath, debouncedWatchListener);
}

export async function saveInstanceConfig(instanceId: string, data: string) {
	const encodedId = z32.encode(instanceId);
	const configPath = path.resolve(paths.data, `instance.${encodedId}`);
	await fs.promises.mkdir(paths.data, { recursive: true });
	return fs.promises.writeFile(configPath, data, { encoding: 'utf8', flag: 'w' });
}
