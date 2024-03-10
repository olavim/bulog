import { useCallback, useContext } from 'react';
import { debounce } from 'lodash';
import { getFiltersConfig, saveFiltersConfig } from '@/api/config';
import useLogs from './useLogs';
import useSandbox from './useSandbox';
import { FiltersContext } from '../context/FiltersContext';
import { filterConfigToData } from '@/utils/config';

const saveFiltersConfigDebounced = debounce(saveFiltersConfig, 500);

export default function useFilters() {
	const [ctx, dispatch] = useContext(FiltersContext);
	const sandbox = useSandbox();
	const { logs } = useLogs();

	const saveConfig = useCallback(async () => {
		if (!ctx.configLoaded) {
			return;
		}

		dispatch({ type: 'setShouldSave', shouldSave: false });

		const filters = Array.from(ctx.filters.keys());
		const filterConfigs = filters.reduce(
			(acc, filter) => {
				const config = ctx.filters.get(filter)!;
				acc[filter] = {
					filter: config.filterString,
					columns: (config.columns ?? []).map((col) => ({
						name: col.name,
						width: col.width,
						formatter: col.formatterString.trim() + '\n'
					}))
				};
				return acc;
			},
			{} as { [filter: string]: FilterConfig }
		);

		await saveFiltersConfigDebounced(filterConfigs);
	}, [ctx.configLoaded, ctx.filters, dispatch]);

	const loadConfig = useCallback(async () => {
		const config = await getFiltersConfig();
		const keys = Object.keys(config?.filters);

		const filters = new Map<string, FilterData>(
			await Promise.all(
				keys.map(
					async (key) =>
						[key, await filterConfigToData(config.filters[key], sandbox)] as [string, FilterData]
				)
			)
		);

		dispatch({ type: 'loadConfig', filters });

		for (const key of keys) {
			dispatch({
				type: 'setLogRenderer',
				filter: key,
				logRenderer: await sandbox.createLogRenderer(filters.get(key)?.columns ?? [])
			});
		}
	}, [sandbox, dispatch]);

	const createFilter = useCallback(async () => {
		dispatch!({ type: 'createFilter', logs: [...logs] });
	}, [dispatch, logs]);

	const addLogs = useCallback(
		(filter: string, logs: LogData[]) => {
			dispatch!({ type: 'addLogs', filter, logs });
		},
		[dispatch]
	);

	return {
		filters: ctx.filters,
		saveConfig,
		loadConfig,
		createFilter,
		addLogs,
		shouldSave: ctx.shouldSave,
		configLoaded: ctx.configLoaded
	};
}
