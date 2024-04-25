import { BulogConfigSchema } from '@/schemas';
import { BulogConfig } from '@/types';
import axios from 'axios';

export async function getConfig() {
	const res = await axios.get('/api/config');
	return BulogConfigSchema.parse(res.data);
}

export async function saveConfig(config: BulogConfig, uploadData: Record<string, File> = {}) {
	if (uploadData) {
		const formData = new FormData();

		for (const [key, file] of Object.entries(uploadData)) {
			formData.append(key, file);
		}

		await axios.post('/api/config', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});
	}

	await axios.put('/api/config', config);
}
