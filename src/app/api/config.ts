import { BulogConfigSchema } from '@/schemas';
import { BulogConfig } from '@/types';
import axios from 'axios';

const configInstance = axios.create({ baseURL: '/api/config' });
configInstance.interceptors.response.use(undefined, (err) => {
	if (axios.isAxiosError(err) && [401, 403].includes(err.response?.status ?? 0)) {
		window.location.href = '/login';
		return null;
	}

	throw err;
});

export async function getConfig() {
	const res = await configInstance.get('/');
	return BulogConfigSchema.parse(res.data);
}

export async function saveConfig(config: BulogConfig) {
	await configInstance.put('/', config);
}
