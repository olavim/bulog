import { Dispatch, Reducer, createContext, useCallback, useContext, useMemo, useReducer } from "react";
import lodash from 'lodash';
import { v4 as uuidv4 } from 'uuid';

type BucketsContextType = {
    buckets: Map<string, {
        logs: LogData[],
        columns: LogColumnData[],
        columnWidths: number[]
    }>
};

type BucketsReducerActionType =
    { type: 'addLogs', bucket: string; logs: LogData[] }
    | { type: 'setColumns', bucket: string; columns: LogColumnData[] }
    | { type: 'setColumnWidths', bucket: string; columnWidths: number[] };

export const createSimpleFormatter = (pattern?: string) => {
    const str = `
const _ = require('lodash');

return log => {
  return ${pattern ?? 'log'};
};`;
    return str.trim();
};

const functionModules = [{ name: 'lodash', module: lodash }];

export const createEvalFn = (code: string): (log: JSONValue) => Promise<JSONValue> => {
    code = functionModules.reduce(
        (str, module) => str.replace(new RegExp(`require\\(.${module.name}.\\)`), `__${module.name}`),
        code
    );

    try {
        const fn = new Function(...functionModules.map(m => `__${m.name}`), code);
        return async (log: JSONValue) => fn(...(functionModules.map(m => m.module)))(log);
    } catch (err: any) {
        return async () => { throw err; };
    }
};

const defaultTimestampFormatter = createSimpleFormatter('new Date(log.timestamp).toLocaleString()');
const defaultTimestampEvalFn = createEvalFn(defaultTimestampFormatter);

const defaultMessageFormatter = createSimpleFormatter('log.message');
const defaultMessageEvalFn = createEvalFn(defaultMessageFormatter);

const initialBucket = {
    logs: [],
    columns: [
        { id: uuidv4(), name: 'timestamp', pattern: 'timestamp', evalStr: defaultTimestampFormatter, evalFn: defaultTimestampEvalFn },
        { id: uuidv4(), name: 'message', pattern: 'message', evalStr: defaultMessageFormatter, evalFn: defaultMessageEvalFn }
    ],
    columnWidths: [220, 200]
};

const initialContext = { buckets: new Map() };

export const BucketsContext = createContext<BucketsContextType>(initialContext);
export const BucketsDispatchContext = createContext<Dispatch<BucketsReducerActionType> | null>(null);

const bucketsReducer: Reducer<BucketsContextType, BucketsReducerActionType> = (ctx, action) => {
    const ctxCopy = { buckets: new Map(ctx.buckets) };
    const bucket = ctxCopy.buckets.get(action.bucket) ?? initialBucket;

    switch (action.type) {
        case 'addLogs':
            ctxCopy.buckets.set(action.bucket, { ...bucket, logs: [...bucket.logs, ...action.logs] });
            return ctxCopy;
        case 'setColumns':
            ctxCopy.buckets.set(action.bucket, { ...bucket, columns: action.columns });
            return ctxCopy;
        case 'setColumnWidths':
            ctxCopy.buckets.set(action.bucket, { ...bucket, columnWidths: action.columnWidths });
            return ctxCopy;
        default:
            return ctxCopy;
    }
};

export function useBucketsReducer() {
    return useReducer(bucketsReducer, initialContext);
}

export function useBuckets() {
    const ctx = useContext(BucketsContext);
    return ctx.buckets;
}

export function useLogs(bucket: string) {
    const ctx = useContext(BucketsContext);
    const ctxLogs = ctx.buckets.get(bucket)?.logs;
    return useMemo(() => ctxLogs ?? [], [ctxLogs]);
}

export function useColumns(bucket: string) {
    const ctx = useContext(BucketsContext);
    const dispatch = useContext(BucketsDispatchContext);

    const ctxColumns = ctx.buckets.get(bucket)?.columns;
    const ctxColumnWidths = ctx.buckets.get(bucket)?.columnWidths;

    const columns = useMemo(() => ctxColumns ?? [], [ctxColumns]);
    const columnWidths = useMemo(() => ctxColumnWidths ?? [], [ctxColumnWidths]);

    const setColumns = useCallback((columns: LogColumnData[]) => {
        dispatch!({ type: 'setColumns', bucket, columns });
    }, [dispatch, bucket]);

    const setColumnWidths = useCallback((columnWidths: number[]) => {
        dispatch!({ type: 'setColumnWidths', bucket, columnWidths });
    }, [dispatch, bucket]);

    return { columns, columnWidths, setColumns, setColumnWidths };
}