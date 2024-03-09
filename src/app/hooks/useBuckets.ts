import { getBucketsConfig, saveBucketsConfig } from '@/api/config';
import { BucketsContext } from '@/context/BucketsContext';
import { useCallback, useContext } from 'react';
import { debounce } from 'lodash';
import useSandbox from './useSandbox';
import { bucketConfigToData } from '@/utils/config';

const saveBucketsConfigDebounced = debounce(saveBucketsConfig, 500);

export default function useBuckets() {
	const [ctx, dispatch] = useContext(BucketsContext);
	const sandbox = useSandbox();

	const saveConfig = useCallback(async () => {
		if (!ctx.configLoaded) {
			return;
		}

		dispatch({ type: 'setShouldSave', shouldSave: false });

		const buckets = Array.from(ctx.buckets.keys());
		const bucketConfigs = buckets.reduce(
			(acc, bucket) => {
				const config = ctx.buckets.get(bucket)!;
				acc[bucket] = {
					columns: (config.columns ?? []).map((col) => ({
						name: col.name,
						width: col.width,
						formatter: col.formatterString.trim() + '\n'
					}))
				};
				return acc;
			},
			{} as { [bucket: string]: BucketConfig }
		);

		await saveBucketsConfigDebounced(bucketConfigs);
	}, [ctx.configLoaded, ctx.buckets, dispatch]);

	const loadConfig = useCallback(async () => {
		const config = await getBucketsConfig();

		const keys = Object.keys(config?.buckets);

		const buckets = new Map<string, BucketData>(
			await Promise.all(
				keys.map(
					async (key) =>
						[key, await bucketConfigToData(config.buckets[key], sandbox)] as [string, BucketData]
				)
			)
		);

		dispatch({ type: 'loadConfig', buckets });

		for (const key of keys) {
			dispatch({
				type: 'setLogRenderer',
				bucket: key,
				logRenderer: await sandbox.createLogRenderer(buckets.get(key)?.columns ?? [])
			});
		}
	}, [sandbox, dispatch]);

	const addLogs = useCallback(
		(bucket: string, logs: LogData[]) => {
			dispatch!({ type: 'addLogs', bucket, logs });
		},
		[dispatch]
	);

	return {
		buckets: ctx.buckets,
		saveConfig,
		loadConfig,
		addLogs,
		shouldSave: ctx.shouldSave,
		configLoaded: ctx.configLoaded
	};
}
