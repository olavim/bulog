import { Dispatch, Reducer, createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import lodash, { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { getBucketsConfig, saveBucketsConfig } from "@/api/config";
import { useSandbox } from "./codeSandbox";

type BucketData = {
    logs?: LogData[],
    columns?: LogColumnData[]
};

type BucketsContextType = {
    buckets: Map<string, BucketData>
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

const initialContext = { buckets: new Map() };

export const BucketsContext = createContext<BucketsContextType>(initialContext);
export const BucketsDispatchContext = createContext<Dispatch<BucketsReducerActionType> | null>(null);

const bucketsReducer: Reducer<BucketsContextType, BucketsReducerActionType> = (ctx, action) => {
    const ctxCopy = { buckets: new Map(ctx.buckets) };
    const bucket = ctxCopy.buckets.get(action.bucket)!;

    switch (action.type) {
        case 'addLogs':
            ctxCopy.buckets.set(action.bucket, {
                logs: [...(bucket?.logs ?? []), ...action.logs],
                columns: bucket?.columns ?? [
                    { id: uuidv4(), name: 'timestamp', evalStr: defaultTimestampFormatter, evalFn: defaultTimestampEvalFn, width: 220 },
                    { id: uuidv4(), name: 'message', evalStr: defaultMessageFormatter, evalFn: defaultMessageEvalFn, width: 200 }
                ]
            });
            return ctxCopy;
        case 'setColumns':
            ctxCopy.buckets.set(action.bucket, { ...bucket, columns: action.columns });
            return ctxCopy;
        default:
            return ctxCopy;
    }
};

export function useBucketsReducer() {
    return useReducer(bucketsReducer, initialContext);
}

const saveBucketsConfigDebounced = debounce(saveBucketsConfig, 500);

export function useBuckets() {
    const ctx = useContext(BucketsContext);
    const dispatch = useContext(BucketsDispatchContext);
    const { createFn } = useSandbox();

    const saveConfig = useCallback(async () => {
        const buckets = Array.from(ctx.buckets.keys());
        const bucketConfigs = buckets.reduce((acc, bucket) => {
            const config = ctx.buckets.get(bucket)!;
            acc[bucket] = {
                columns: (config.columns ?? []).map(col => ({
                    name: col.name,
                    width: col.width,
                    formatter: col.evalStr.trim() + '\n'
                }))
            };
            return acc;
        }, {} as { [bucket: string]: BucketConfig });

        await saveBucketsConfigDebounced(bucketConfigs);
    }, [ctx]);

    const loadConfig = useCallback(async () => {
        const config = await getBucketsConfig();
        const keys = Object.keys(config?.buckets);

        for (const key of keys) {
            const bucketConfig = config.buckets[key];
            if (!bucketConfig.columns) {
                continue;
            }

            const columns: LogColumnData[] = await Promise.all(
                bucketConfig.columns.map(async col => {
                    const id = uuidv4();
                    return {
                        id,
                        name: col.name,
                        width: col.width,
                        evalStr: col.formatter,
                        evalFn: await createFn(id, col.formatter)
                    };
                })
            );

            dispatch!({ type: 'setColumns', bucket: key, columns });
        }
    }, [createFn, dispatch]);

    return { buckets: ctx.buckets, saveConfig, loadConfig };
}

export function useLogs(bucket: string) {
    const ctx = useContext(BucketsContext);
    const ctxLogs = ctx.buckets.get(bucket)?.logs;
    return useMemo(() => ctxLogs ?? [], [ctxLogs]);
}

export function useColumns(bucket: string) {
    const ctx = useContext(BucketsContext);
    const dispatch = useContext(BucketsDispatchContext);
    const { saveConfig } = useBuckets();

    const ctxColumns = ctx.buckets.get(bucket)?.columns;

    const columns = useMemo(() => ctxColumns ?? [], [ctxColumns]);

    const setColumns = useCallback((columns: LogColumnData[]) => {
        dispatch!({ type: 'setColumns', bucket, columns });
    }, [dispatch, bucket]);

    useEffect(() => {
        saveConfig();
    }, [columns, saveConfig]);

    return { columns, setColumns };
}