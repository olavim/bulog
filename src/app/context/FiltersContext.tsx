import { defaultFormatterFunction, defaultFormatterString, defaultTimestampFormatterFunction, defaultTimestampFormatterString } from "@/hooks/useColumnUtils";
import { createSimpleFunction } from "@/hooks/useSandbox";
import { Dispatch, Reducer, createContext, useReducer } from "react";
import { v4 as uuidv4 } from 'uuid';

export type FilterConfigInput = {
    name?: string,
    columns?: ColumnData[],
    filterString: string,
    filterFunction: (log: LogData[]) => Promise<boolean[]>
};

type FiltersContextType = {
    filters: Map<string, FilterData>
};

type FiltersReducerActionType =
    { type: 'createFilter'; logs: LogData[] }
    | { type: 'deleteFilter'; filter: string }
    | { type: 'setConfig', filter: string, config: FilterConfigInput }
    | { type: 'addLogs', filter: string; logs: LogData[] }
    | { type: 'setLogs', filter: string; logs: LogData[] }
    | { type: 'setColumns', filter: string; columns: ColumnData[] }
    | { type: 'setColumnWidths', filter: string; columnWidths: number[] };

const initialContext = { filters: new Map() };

export const FiltersContext = createContext<[FiltersContextType, Dispatch<FiltersReducerActionType>]>([initialContext, () => { }]);

export const defaultFilterString = `
const _ = require('lodash');

return log => {
  return true;
};`.trim();

const defaultFilterFunction = createSimpleFunction<LogData, boolean>(defaultFilterString);

const filtersReducer: Reducer<FiltersContextType, FiltersReducerActionType> = (ctx, action) => {
    const ctxCopy = { filters: new Map(ctx.filters) };

    switch (action.type) {
        case 'createFilter': {
            let name = 'New Filter';
            let i = 2;
            while (ctxCopy.filters.has(name)) {
                name = `New Filter (${i})`;
                i++;
            }

            ctxCopy.filters.set(name, {
                filterString: defaultFilterString,
                filterFunction: defaultFilterFunction,
                logs: action.logs,
                columns: [
                    { id: uuidv4(), name: 'timestamp', formatterString: defaultTimestampFormatterString, formatterFunction: defaultTimestampFormatterFunction, width: 220 },
                    { id: uuidv4(), name: 'message', formatterString: defaultFormatterString, formatterFunction: defaultFormatterFunction, width: 200 }
                ]
            });
            return ctxCopy;
        }
        case 'deleteFilter': {
            ctxCopy.filters.delete(action.filter);
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
            return ctxCopy;
        }
        case 'setConfig': {
            const filter = ctxCopy.filters.get(action.filter)!;
            const name = action.config.name ?? action.filter;
            if (name !== action.filter) {
                ctxCopy.filters.delete(action.filter);
            }
            ctxCopy.filters.set(name, {
                logs: filter?.logs ?? [],
                columns: action.config.columns ?? filter.columns,
                filterString: action.config.filterString,
                filterFunction: action.config.filterFunction
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
