import fs from 'fs';
import path from 'path';
import envPaths from 'env-paths';
import z32 from 'z32';
import lodash from 'lodash';
import lockfile from 'proper-lockfile';

const paths = envPaths('bulog');

export async function reserveInstance(instanceId: string) {
	const encodedId = z32.encode(instanceId);
	const configPath = path.resolve(paths.data, `${encodedId}.instance`);

	if (!fs.existsSync(configPath)) {
		await fs.promises.writeFile(configPath, '');
	}

	return lockfile.lock(configPath);
}

export function releaseInstance(instanceId: string) {
	const encodedId = z32.encode(instanceId);
	const configPath = path.resolve(paths.data, `${encodedId}.instance`);
	return lockfile.unlockSync(configPath);
}

export async function getInstanceConfig(instanceId: string) {
	const encodedId = z32.encode(instanceId);
	const configPath = path.resolve(paths.data, `${encodedId}.instance`);
	return fs.promises.readFile(configPath, 'utf8').catch(() => null);
}

export function watchInstanceConfig(instanceId: string, cb: (data: string | null) => void) {
	const encodedId = z32.encode(instanceId);
	const configPath = path.resolve(paths.data, `${encodedId}.instance`);
	const debouncedWatchListener = lodash.debounce(() => getInstanceConfig(instanceId).then(cb), 500);
	fs.watch(configPath, debouncedWatchListener);
}

export async function saveInstanceConfig(instanceId: string, data: string) {
	const encodedId = z32.encode(instanceId);
	const configPath = path.resolve(paths.data, `${encodedId}.instance`);
	await fs.promises.mkdir(paths.data, { recursive: true });
	return fs.promises.writeFile(configPath, data, { encoding: 'utf8', flag: 'w' });
}
