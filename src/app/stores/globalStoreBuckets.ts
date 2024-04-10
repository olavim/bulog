import { StateCreator } from 'zustand';
import { GlobalStore } from './globalStore';
import { createBucketStore, BucketStoreApi } from './bucketStore';
import { Sandbox } from '@context/SandboxContext';
import { bucketConfigToData, createBucket } from '@utils/buckets';

export interface BucketSlice {
	buckets: Map<string, BucketStoreApi>;
	loadBuckets: (buckets: Record<string, BucketData>) => void;
	createBucket: (id: string, sandbox: Sandbox) => Promise<void>;
}

type BucketSliceCreator = StateCreator<GlobalStore, [['zustand/immer', never]], [], BucketSlice>;

export const createBucketSlice: BucketSliceCreator = (set) => ({
	buckets: new Map(),
	loadBuckets: (buckets) => {
		set((state) => {
			state.buckets = new Map(
				Object.entries(buckets).map(([id, data]) => [id, createBucketStore(data)])
			);
		});
	},
	createBucket: async (id, sandbox) => {
		const data = await bucketConfigToData(createBucket(), sandbox);

		set((state) => {
			state.buckets.set(id, createBucketStore(data));
		});
	}
});
