import { StateCreator } from 'zustand';
import { GlobalStore } from './globalStore';
import { Sandbox } from '@context/SandboxContext';

export interface LogSlice {
	logs: LogData[];
	addLogs: (logs: LogData[], sandbox: Sandbox) => Promise<void>;
}

type LogSliceCreator = StateCreator<GlobalStore, [['zustand/immer', never]], [], LogSlice>;

export const createLogSlice: LogSliceCreator = (set, get) => ({
	logs: [],
	addLogs: async (logs, sandbox) => {
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

		for (const bucketId of Object.keys(logsByBucket)) {
			if (!get().buckets.has(bucketId)) {
				await get().createBucket(bucketId, sandbox);
			}
		}

		const currentFilters = get().filters;
		const logsByFilter: { [id: string]: LogData[] } = {};
		for (const filterId of currentFilters.keys()) {
			const predicates = await currentFilters.get(filterId)!.getState().data.predicate(logs);
			logsByFilter[filterId] = logs.filter((_, i) => predicates[i]);
		}

		set((state) => {
			state.logs.push(...logs);

			for (const bucketId of Object.keys(logsByBucket)) {
				state.buckets.get(bucketId)!.setState((s) => {
					s.data.logs.push(...logsByBucket[bucketId]);
				});
			}

			for (const filterId of Object.keys(logsByFilter)) {
				state.filters.get(filterId)!.setState((s) => {
					s.data.logs.push(...logsByFilter[filterId]);
				});
			}
		});
	}
});
