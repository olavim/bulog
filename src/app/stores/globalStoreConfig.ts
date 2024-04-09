import { StateCreator } from 'zustand';
import { GlobalStore } from './globalStore';
import { Sandbox } from '@/context/SandboxContext';
import { getConfig, saveConfig } from '@/api/config';
import { filterConfigToData, filterDataToConfig } from '@/utils/filters';
import { bucketConfigToData, bucketDataToConfig } from '@/utils/buckets';

export interface ConfigSlice {
	config: BulogConfig;
	configLoaded: boolean;
	loadConfig: (sandbox: Sandbox) => Promise<void>;
	saveConfig: (config?: BulogConfig) => Promise<void>;
}

type ConfigSliceCreator = StateCreator<GlobalStore, [['zustand/immer', never]], [], ConfigSlice>;

const createConfigSlice: ConfigSliceCreator = (set, get) => ({
	config: {
		filters: {},
		buckets: {},
		server: {
			defaults: {
				hostname: '0.0.0.0',
				port: 3100,
				memorySize: 1000
			}
		}
	},
	configLoaded: false,
	loadConfig: async (sandbox) => {
		set((state) => {
			state.configLoaded = false;
		});

		const config = await getConfig();

		const filterDataById: Record<string, FilterData> = {};
		for (const key of Object.keys(config.filters)) {
			filterDataById[key] = {
				...(await filterConfigToData(config.filters[key], sandbox)),
				logs: get().filters.get(key)?.getState().data.logs ?? []
			};
		}

		const bucketDataById: Record<string, BucketData> = {};
		for (const key of Object.keys(config.buckets)) {
			bucketDataById[key] = {
				...(await bucketConfigToData(config.buckets[key], sandbox)),
				logs: get().buckets.get(key)?.getState().data.logs ?? []
			};
		}

		set((state) => {
			state.logs = state.logs.filter((log) => config.buckets[log.bucket]);
		});

		await Promise.all([get().loadFilters(filterDataById), get().loadBuckets(bucketDataById)]);

		set((state) => {
			state.config = config;
			state.configLoaded = true;
		});
	},
	saveConfig: async (config) => {
		if (!config) {
			const filters = get().filters;
			const filterConfigs = {} as { [id: string]: FilterConfig };
			for (const [id, filterStore] of filters) {
				filterConfigs[id] = filterDataToConfig(filterStore.getState().data);
			}

			const buckets = get().buckets;
			const bucketConfigs = {} as { [id: string]: BucketConfig };
			for (const [id, bucket] of buckets) {
				bucketConfigs[id] = bucketDataToConfig(bucket.getState().data);
			}

			config = { filters: filterConfigs, buckets: bucketConfigs, server: get().config.server };
		}

		await saveConfig(config);
	}
});

export default createConfigSlice;
