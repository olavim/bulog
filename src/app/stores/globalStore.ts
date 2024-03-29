import { StoreApi, createStore, useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import createFilterSlice, { FilterSlice } from './globalStoreFilters';
import createBucketSlice, { BucketSlice } from './globalStoreBuckets';
import createLogSlice, { LogSlice } from './globalStoreLogs';

export type GlobalStore = LogSlice & BucketSlice & FilterSlice;

export const globalStore = createStore<GlobalStore>()(
	immer((...a) => ({
		...createLogSlice(...a),
		...createBucketSlice(...a),
		...createFilterSlice(...a)
	}))
);

export type ExtractState<S> = S extends { getState: () => infer T } ? T : never;
export type WithUse<S> = { use: <U>(selector: (state: ExtractState<S>) => U) => U };
export type WithSelectors<S> = S extends { getState: () => infer T }
	? S & { use: { [K in keyof T]: () => T[K] } } & WithUse<S>
	: never;

export const createSelectors = <S extends StoreApi<object>>(_store: S) => {
	const store = _store as WithSelectors<S>;
	// eslint-disable-next-line react-hooks/rules-of-hooks
	store.use = <U>(selector: (state: ExtractState<S>) => U) => useStore(store, selector);
	for (const key of Object.keys(store.getState())) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		(store.use as any)[key] = () => useStore(store, (state) => state[key as keyof typeof state]);
	}
	return store;
};

export default createSelectors(globalStore);
