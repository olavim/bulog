import { StateCreator } from 'zustand';
import { GlobalStore } from './globalStore';
import createBucketStore from './bucketStore';
import { createDefaultColumns, defaultLogRenderer } from '@/utils/columns';

const createBucketData = () => {
	const columns = createDefaultColumns();
	const data: BucketData = {
		columns,
		logs: [] as LogData[],
		logRenderer: defaultLogRenderer(columns[0].id, columns[1].id)
	};

	return data;
};

export interface LogSlice {
	logs: LogData[];
	addLogs: (logs: LogData[]) => Promise<void>;
}

type LogSliceCreator = StateCreator<GlobalStore, [['zustand/immer', never]], [], LogSlice>;

const createLogSlice: LogSliceCreator = (set, get) => ({
	logs: [],
	addLogs: async (logs) => {
		// Check if the logs are already in the store
		if (
			get().logs.length > 0 &&
			logs[logs.length - 1].id === get().logs[get().logs.length - 1].id
		) {
			return;
		}

		const logsByBucket: { [id: string]: LogData[] } = {};
		for (const log of logs) {
			logsByBucket[log.bucket] = logsByBucket[log.bucket] ?? [];
			logsByBucket[log.bucket].push(log);
		}

		const currentFilters = get().filters;
		const logsByFilter: { [id: string]: LogData[] } = {};
		for (const filterId of currentFilters.keys()) {
			const predicates = await currentFilters.get(filterId)!.getState().data.filterFunction(logs);
			logsByFilter[filterId] = logs.filter((_, i) => predicates[i]);
		}

		set((state) => {
			state.logs.push(...logs);

			for (const bucketId of Object.keys(logsByBucket)) {
				if (!state.buckets.has(bucketId)) {
					state.buckets.set(bucketId, createBucketStore(createBucketData()));
				}

				state.buckets.get(bucketId)!.setState((s) => {
					s.data.logs.push(...logsByBucket[bucketId]);
					return s;
				});
			}

			for (const filterId of Object.keys(logsByFilter)) {
				state.filters.get(filterId)!.setState((s) => {
					s.data.logs.push(...logsByFilter[filterId]);
					return s;
				});
			}
		});
	}
});

export default createLogSlice;
