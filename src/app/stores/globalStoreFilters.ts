import { StateCreator } from 'zustand';
import { GlobalStore } from './globalStore';
import { createFilterStore, FilterStoreApi } from './filterStore';
import { nanoid } from 'nanoid';
import { Sandbox } from '@app/context/SandboxContext';
import { createFilter, filterConfigToData } from '@app/utils/filters';
import { FilterData } from '@/types';

export interface FilterSlice {
	filters: Map<string, FilterStoreApi>;
	renameFilter: (filterId: string, name: string) => Promise<void>;
	deleteFilter: (filterId: string) => Promise<void>;
	createFilter: (sandbox: Sandbox) => Promise<string>;
	loadFilters: (filters: Record<string, FilterData>) => Promise<void>;
}

type FilterSliceCreator = StateCreator<GlobalStore, [['zustand/immer', never]], [], FilterSlice>;

export const createFilterSlice: FilterSliceCreator = (set, get) => ({
	filters: new Map(),
	renameFilter: async (filterId, name) => {
		get()
			.filters.get(filterId)!
			.setState((state) => {
				state.data.name = name;
			});

		await get().saveConfig();
	},
	deleteFilter: async (filterId) => {
		set((state) => {
			state.filters.delete(filterId);
		});

		await get().saveConfig();
	},
	createFilter: async (sandbox) => {
		const id = nanoid(16);
		const data = await filterConfigToData(createFilter(), sandbox);
		data.logs = get().logs;

		set((state) => {
			state.filters.set(id, createFilterStore(data));
		});

		await get().saveConfig();
		return id;
	},
	loadFilters: async (filters) => {
		set((state) => {
			state.filters = new Map(
				Object.entries(filters).map(([id, data]) => [id, createFilterStore(data)])
			);
		});

		await Promise.all(
			Array.from(get().filters.values()).map(async (filter) => filter.getState().reloadLogs())
		);
	}
});
