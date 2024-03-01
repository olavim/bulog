import { Dispatch, Reducer, createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { JSONValue, LogColumnData, LogData, LogMessage } from "@/types";

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

const initialBucket = {
    logs: [],
    columns: [
        { name: 'timestamp', pattern: 'timestamp', format: (val: JSONValue) => new Date(val as string).toLocaleString() },
        { name: 'message', pattern: 'message' }
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