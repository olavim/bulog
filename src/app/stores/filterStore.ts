import { Mutate, StoreApi, createStore } from 'zustand';
import globalStore, { WithSelectors, createSelectors } from './globalStore';
import { Sandbox } from '@/context/SandboxContext';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

export interface FilterStore {
	data: FilterData;
	renderKey: number;
	readingLogs: boolean;
	readProgress: number;
	setColumns: (columns: ColumnData[], sandbox: Sandbox) => Promise<void>;
	setPredicate: (predicateString: string, sandbox: Sandbox) => Promise<void>;
}

export type FilterStoreApi = WithSelectors<
	Mutate<
		StoreApi<FilterStore>,
		[['zustand/subscribeWithSelector', never], ['zustand/immer', never]]
	>
>;

const createFilterStore = (data: FilterData): FilterStoreApi => {
	return createSelectors(
		createStore<FilterStore>()(
			subscribeWithSelector(
				immer(
					(set) =>
						({
							data,
							renderKey: 0,
							readingLogs: false,
							readProgress: 0,
							setColumns: async (columns, sandbox) => {
								set((state) => {
									state.data.columns = columns;
								});

								const logRenderer = await sandbox.createLogRenderer(columns);

								set((state) => {
									state.data.logRenderer = logRenderer;
								});

								await globalStore.getState().saveFilters();
							},
							setPredicate: async (predicateString, sandbox) => {
								set((state) => {
									state.data.filterString = predicateString;
									state.readingLogs = globalStore.getState().logs.length > 10000;
									state.readProgress = 0;
								});

								const predicate = await sandbox.createCallback<LogData, boolean>(predicateString);

								set((state) => {
									state.data.filterFunction = predicate;
								});

								await globalStore.getState().saveFilters();

								const filteredLogs = [] as LogData[];
								const chunkSize = Math.ceil(globalStore.getState().logs.length / 10);
								let processed = 0;

								while (processed < globalStore.getState().logs.length) {
									const newLogs = globalStore
										.getState()
										.logs.slice(processed, processed + chunkSize);
									const predicates = await predicate(newLogs);
									const filtered = newLogs.filter((_, i) => predicates[i]);
									filteredLogs.push(...filtered);
									processed += chunkSize;

									set((state) => {
										state.readProgress = processed / globalStore.getState().logs.length;
									});
								}

								set((state) => {
									state.data.logs = filteredLogs;
									state.renderKey++;
									state.readingLogs = false;
									state.readProgress = 0;
								});
							}
						}) as FilterStore
				)
			)
		)
	);
};

export default createFilterStore;
