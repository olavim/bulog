import { useCallback, useContext, useState } from "react";
import { debounce } from 'lodash';
import { getFiltersConfig, saveFiltersConfig } from "@/api/config";
import useLogs from "./useLogs";
import useSandbox from "./useSandbox";
import { FiltersContext } from "../context/FiltersContext";
import { filterConfigToData } from "@/utils/config";

const saveFiltersConfigDebounced = debounce(saveFiltersConfig, 500);

export default function useFilters() {
    const [ctx, dispatch] = useContext(FiltersContext);
    const sandbox = useSandbox();
    const [configLoaded, setConfigLoaded] = useState(false);
    const { logs } = useLogs();

    const saveConfig = useCallback(async () => {
        if (!configLoaded) {
            return;
        }

        const filters = Array.from(ctx.filters.keys());
        const filterConfigs = filters.reduce((acc, filter) => {
            const config = ctx.filters.get(filter)!;
            acc[filter] = {
                filter: config.filterString,
                columns: (config.columns ?? []).map(col => ({
                    name: col.name,
                    width: col.width,
                    formatter: col.formatterString.trim() + '\n'
                }))
            };
            return acc;
        }, {} as { [filter: string]: FilterConfig });

        await saveFiltersConfigDebounced(filterConfigs);
    }, [configLoaded, ctx.filters]);

    const loadConfig = useCallback(async () => {
        const config = await getFiltersConfig();

        const keys = Object.keys(config?.filters);

        for (const key of keys) {
            const filterConfig = config.filters[key];

            const data = await filterConfigToData(filterConfig, sandbox);
            dispatch!({ type: 'setConfig', filter: key, config: { ...data, name: key } });
        }

        setConfigLoaded(true);
    }, [sandbox, dispatch]);

    const createFilter = useCallback(async () => {
        dispatch!({ type: 'createFilter', logs: [...logs] });
    }, [dispatch, logs]);

    const addLogs = useCallback((filter: string, logs: LogData[]) => {
        dispatch!({ type: 'addLogs', filter, logs });
    }, [dispatch]);

    return { filters: ctx.filters, saveConfig, loadConfig, configLoaded, createFilter, addLogs };
}