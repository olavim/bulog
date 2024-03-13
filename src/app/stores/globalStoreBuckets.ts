import { StateCreator } from 'zustand';
import { GlobalStore } from './globalStore';
import { Sandbox } from '@/context/SandboxContext';
import { getBucketsConfig, saveBucketsConfig } from '@/api/config';
import { bucketConfigToData, bucketDataToConfig } from '@/utils/config';
import createBucketStore, { BucketStoreApi } from './bucketStore';

export interface BucketSlice {
	buckets: Map<string, BucketStoreApi>;
	bucketConfigLoaded: boolean;
	loadBuckets: (sandbox: Sandbox) => Promise<void>;
	saveBuckets: () => Promise<void>;
}

type BucketSliceCreator = StateCreator<GlobalStore, [['zustand/immer', never]], [], BucketSlice>;

const createBucketSlice: BucketSliceCreator = (set, get) => ({
	buckets: new Map(),
	bucketConfigLoaded: false,
	loadBuckets: async (sandbox) => {
		const config = await getBucketsConfig();
		const keys = Object.keys(config?.buckets);

		const dataById = {} as { [id: string]: BucketData };
		for (const key of keys) {
			dataById[key] = await bucketConfigToData(config.buckets[key], sandbox);
		}

		set((state) => {
			state.buckets = new Map(
				Object.entries(dataById).map(([id, data]) => [id, createBucketStore(data)])
			);
			state.bucketConfigLoaded = true;
		});
	},
	saveBuckets: async () => {
		const buckets = get().buckets;
		const bucketConfigs = {} as { [id: string]: BucketConfig };
		for (const [id, bucket] of buckets) {
			bucketConfigs[id] = bucketDataToConfig(bucket.getState().data);
		}

		await saveBucketsConfig(bucketConfigs);
	}
});

export default createBucketSlice;
