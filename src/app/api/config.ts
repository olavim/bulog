import { BulogConfigSchema } from '@/schemas';

export async function getConfig() {
	const res = await fetch('/api/config');
	return BulogConfigSchema.parse(await res.json());
}

export async function saveConfig(config: BulogConfig) {
	await fetch('/api/config', {
		method: 'put',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(config)
	});
}
