import { StateCreator } from 'zustand';
import { GlobalStore } from './globalStore';
import { Sandbox } from '@/context/SandboxContext';
import { getFiltersConfig, saveFiltersConfig } from '@/api/config';
import { filterConfigToData, filterDataToConfig } from '@/utils/config';
import { createDefaultColumns, defaultLogRenderer } from '@/utils/columns';
import createFilterStore, { FilterStoreApi } from './filterStore';

const defaultFilterString = `
const _ = require('lodash');

return log => {
  return true;
};`.trim();

export interface FilterSlice {
	filters: Map<string, FilterStoreApi>;
	filterConfigLoaded: boolean;
	renameFilter: (filterId: string, name: string) => Promise<void>;
	deleteFilter: (filterId: string) => Promise<void>;
	createFilter: () => Promise<void>;
	loadFilters: (sandbox: Sandbox) => Promise<void>;
	saveFilters: () => Promise<void>;
}

type FilterSliceCreator = StateCreator<GlobalStore, [['zustand/immer', never]], [], FilterSlice>;

const createFilterSlice: FilterSliceCreator = (set, get) => ({
	filters: new Map(),
	filterConfigLoaded: false,
	renameFilter: async (filterId, name) => {
		set((state) => {
			const filter = state.filters.get(filterId)!;
			state.filters.delete(filterId);
			state.filters.set(name, filter);
		});

		await get().saveFilters();
	},
	deleteFilter: async (filterId) => {
		set((state) => {
			state.filters.delete(filterId);
		});

		await get().saveFilters();
	},
	createFilter: async () => {
		set((state) => {
			let name = 'New Filter';
			let i = 2;
			while (state.filters.has(name)) {
				name = `New Filter (${i})`;
				i++;
			}

			const columns = createDefaultColumns();
			const data: FilterData = {
				filterString: defaultFilterString,
				filterFunction: async (logs) => logs.map(() => true),
				columns,
				logs: get().logs,
				logRenderer: defaultLogRenderer(columns[0].id, columns[1].id)
			};

			state.filters.set(name, createFilterStore(data));
		});

		await get().saveFilters();
	},
	loadFilters: async (sandbox) => {
		const config = await getFiltersConfig();

		const dataById = {} as { [id: string]: FilterData };
		for (const key of Object.keys(config?.filters)) {
			dataById[key] = await filterConfigToData(config.filters[key], sandbox);
		}

		set((state) => {
			state.filters = new Map(
				Object.entries(dataById).map(([id, data]) => [id, createFilterStore(data)])
			);
			state.filterConfigLoaded = true;
		});
	},
	saveFilters: async () => {
		const filters = get().filters;
		const filterConfigs = {} as { [id: string]: FilterConfig };
		for (const [id, filterStore] of filters) {
			filterConfigs[id] = filterDataToConfig(filterStore.getState().data);
		}

		await saveFiltersConfig(filterConfigs);
	}
});

export default createFilterSlice;
