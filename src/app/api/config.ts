import { BulogConfigSchema } from '@/schemas';

export async function getBucketsConfig() {
	const res = await fetch('/api/config/buckets');
	return (await res.json()) as { buckets: Record<string, BucketConfig> };
}

export async function saveBucketsConfig(config: Record<string, BucketConfig>) {
	await fetch('/api/config/buckets', {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(config)
	});
}

export async function getFiltersConfig() {
	const res = await fetch('/api/config/filters');
	return (await res.json()) as { filters: Record<string, FilterConfig> };
}

export async function saveFiltersConfig(config: Record<string, FilterConfig>) {
	await fetch('/api/config/filters', {
		method: 'post',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(config)
	});
}

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
