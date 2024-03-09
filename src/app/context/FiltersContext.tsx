import { defaultFormatterString, defaultLogRenderer, defaultTimestampFormatterString } from '@/hooks/useColumnUtils';
import { createSimpleFunction } from '@/hooks/useSandbox';
import { Dispatch, Reducer, createContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type FilterConfigInput = {
    name?: string,
    filterString: string,
    filterFunction: (logs: LogData[]) => Promise<boolean[]>
};

type FiltersContextType = {
    filters: Map<string, FilterData>,
    shouldSave: boolean,
    configLoaded: boolean
};

type FiltersReducerActionType =
    { type: 'createFilter'; logs: LogData[] }
    | { type: 'setShouldSave', shouldSave: boolean; }
    | { type: 'deleteFilter'; filter: string }
    | { type: 'setConfig', filter: string, name: string; filterString: string; filterFunction: (logs: LogData[]) => Promise<boolean[]>; }
    | { type: 'loadConfig', filter: string, config: FilterData }
    | { type: 'addLogs', filter: string; logs: LogData[] }
    | { type: 'setLogs', filter: string; logs: LogData[] }
    | { type: 'setColumns', filter: string; columns: ColumnData[]; }
    | { type: 'setLogRenderer', filter: string; logRenderer: (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>> };

const initialContext = { filters: new Map(), shouldSave: false, configLoaded: false };

export const FiltersContext = createContext<[FiltersContextType, Dispatch<FiltersReducerActionType>]>([initialContext, () => { }]);

export const defaultFilterString = `
const _ = require('lodash');

return log => {
  return true;
};`.trim();

const defaultFilterFunction = createSimpleFunction<LogData, boolean>(defaultFilterString);

const filtersReducer: Reducer<FiltersContextType, FiltersReducerActionType> = (ctx, action) => {
    const ctxCopy = { ...ctx, filters: new Map(ctx.filters) };

    switch (action.type) {
        case 'createFilter': {
            let name = 'New Filter';
            let i = 2;
            while (ctxCopy.filters.has(name)) {
                name = `New Filter (${i})`;
                i++;
            }

            const defaultTimestampColumnId = uuidv4();
            const defaultMessageColumnId = uuidv4();

            ctxCopy.filters.set(name, {
                filterString: defaultFilterString,
                filterFunction: defaultFilterFunction,
                logs: action.logs,
                columns: [
                    { id: defaultTimestampColumnId, name: 'timestamp', formatterString: defaultTimestampFormatterString, width: 220 },
                    { id: defaultMessageColumnId, name: 'message', formatterString: defaultFormatterString, width: 200 }
                ],
                logRenderer: defaultLogRenderer(defaultTimestampColumnId, defaultMessageColumnId)
            });
            ctxCopy.shouldSave = true;
            return ctxCopy;
        }
        case 'deleteFilter': {
            ctxCopy.filters.delete(action.filter);
            ctxCopy.shouldSave = true;
            return ctxCopy;
        }
        case 'setShouldSave': {
            ctxCopy.shouldSave = action.shouldSave;
            return ctxCopy;
        }
        case 'addLogs': {
            const filter = ctxCopy.filters.get(action.filter)!;
            ctxCopy.filters.set(action.filter, { ...filter, logs: [...(filter?.logs ?? []), ...action.logs] });
            return ctxCopy;
        }
        case 'setLogs': {
            const filter = ctxCopy.filters.get(action.filter)!;
            ctxCopy.filters.set(action.filter, { ...filter, logs: [...action.logs] });
            return ctxCopy;
        }
        case 'setColumns': {
            const filter = ctxCopy.filters.get(action.filter)!;
            ctxCopy.filters.set(action.filter, { ...filter, columns: action.columns });
            ctxCopy.shouldSave = true;
            return ctxCopy;
        }
        case 'setLogRenderer': {
            const filter = ctxCopy.filters.get(action.filter)!;
            ctxCopy.filters.set(action.filter, { ...filter, logRenderer: action.logRenderer });
            return ctxCopy;
        }
        case 'loadConfig': {
            const filter = ctxCopy.filters.get(action.filter)!;
            ctxCopy.filters.set(action.filter, { ...action.config, logs: filter?.logs ?? [] });
            ctxCopy.configLoaded = true;
            return ctxCopy;
        }
        case 'setConfig': {
            const filter = ctxCopy.filters.get(action.filter)!;
            const name = action.name ?? action.filter;
            if (name !== action.filter) {
                ctxCopy.filters.delete(action.filter);
            }
            ctxCopy.filters.set(name, {
                ...filter,
                filterString: action.filterString,
                filterFunction: action.filterFunction
            });
            return ctxCopy;
        }
        default:
            return ctxCopy;
    }
};

interface FiltersProviderProps {
    children: React.ReactNode;
}

export function FiltersProvider({ children }: FiltersProviderProps) {
    const [context, dispatch] = useReducer(filtersReducer, initialContext);

    return (
        <FiltersContext.Provider value={[context, dispatch]}>
            {children}
        </FiltersContext.Provider>
    );
}
