export async function getBucketsConfig() {
    const res = await fetch('/api/config/buckets');
    return await res.json() as { buckets: { [bucket: string]: BucketConfig } };
}

export async function saveBucketsConfig(config: { [bucket: string]: BucketConfig }) {
    await fetch('/api/config/buckets', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
}