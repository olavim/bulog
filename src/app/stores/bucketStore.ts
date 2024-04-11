import { Mutate, StoreApi, createStore } from 'zustand';
import { globalStore, WithSelectors, createSelectors } from './globalStore';
import { Sandbox } from '@app/context/SandboxContext';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

export interface BucketStore {
	data: BucketData;
	setColumns: (columns: ColumnConfig[], sandbox: Sandbox) => Promise<void>;
	setPredicate: (predicateString: string, sandbox: Sandbox) => Promise<void>;
}

export type BucketStoreApi = WithSelectors<
	Mutate<
		StoreApi<BucketStore>,
		[['zustand/subscribeWithSelector', never], ['zustand/immer', never]]
	>
>;

export const createBucketStore = (initialData: BucketData): BucketStoreApi => {
	return createSelectors(
		createStore<BucketStore>()(
			subscribeWithSelector(
				immer(
					(set) =>
						({
							data: initialData,
							setColumns: async (columns, sandbox) => {
								set((state) => {
									state.data.columns = columns;
								});

								const logRenderer = await sandbox.createLogRenderer(columns);

								set((state) => {
									state.data.logRenderer = logRenderer;
								});

								await globalStore.getState().saveConfig();
							}
						}) as BucketStore
				)
			)
		)
	);
};
