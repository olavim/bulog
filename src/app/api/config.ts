import { BulogConfigSchema } from '@/schemas';
import { BulogConfig } from '@/types';
import axios from 'axios';

export async function getConfig() {
	const res = await axios.get('/api/config');
	return BulogConfigSchema.parse(res.data);
}

export async function saveConfig(config: BulogConfig) {
	await axios.put('/api/config', config);
}
