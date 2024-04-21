import { Mutate, StoreApi, createStore } from 'zustand';
import { globalStore, WithSelectors, createSelectors } from './globalStore';
import { Sandbox } from '@app/context/SandboxContext';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { ColumnConfig, FilterData, LogData } from '@/types';

export interface FilterStore {
	data: FilterData;
	renderKey: number;
	readingLogs: boolean;
	readProgress: number;
	setColumns: (columns: ColumnConfig[], sandbox: Sandbox) => Promise<void>;
	setPredicate: (predicateString: string, sandbox: Sandbox) => Promise<void>;
	reloadLogs: () => Promise<void>;
}

export type FilterStoreApi = WithSelectors<
	Mutate<
		StoreApi<FilterStore>,
		[['zustand/subscribeWithSelector', never], ['zustand/immer', never]]
	>
>;

export const createFilterStore = (data: FilterData): FilterStoreApi => {
	return createSelectors(
		createStore<FilterStore>()(
			subscribeWithSelector(
				immer(
					(set, get) =>
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

								await globalStore.getState().saveConfig();
							},
							setPredicate: async (predicateString, sandbox) => {
								const predicate = await sandbox.createCallback<LogData, boolean>(predicateString);

								set((state) => {
									state.data.predicateString = predicateString;
									state.data.predicate = predicate;
								});

								await globalStore.getState().saveConfig();
								await get().reloadLogs();
							},
							reloadLogs: async () => {
								set((state) => {
									state.readingLogs = globalStore.getState().logs.length > 10000;
									state.readProgress = 0;
								});

								const filteredLogs = [] as LogData[];
								const chunkSize = Math.ceil(globalStore.getState().logs.length / 10);
								let processed = 0;

								while (processed < globalStore.getState().logs.length) {
									const newLogs = globalStore
										.getState()
										.logs.slice(processed, processed + chunkSize);
									const predicateResults = await get().data.predicate(newLogs);
									const filtered = newLogs.filter((_, i) => predicateResults[i]);
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
