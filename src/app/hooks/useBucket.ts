import { BucketsContext } from "@/context/BucketsContext";
import useColumnUtils from "@/hooks/useColumnUtils";
import { useCallback, useContext, useMemo } from "react";
import useSandbox from "./useSandbox";

export default function useBucket(bucket: string) {
    const [ctx, dispatch] = useContext(BucketsContext);
    const sandbox = useSandbox();
    const { createColumn, deleteColumn } = useColumnUtils();

    const ctxLogs = ctx.buckets.get(bucket)?.logs;
    const logs = useMemo(() => ctxLogs ?? [], [ctxLogs]);

    const ctxColumns = ctx.buckets.get(bucket)?.columns;
    const columns = useMemo(() => ctxColumns ?? [], [ctxColumns]);

    const ctxLogRenderer = ctx.buckets.get(bucket)?.logRenderer;
    const logRenderer = useMemo(() => ctxLogRenderer ?? (async (logs: LogData[]) => logs.map(() => ({}))), [ctxLogRenderer]);

    const setColumns = useCallback(async (newColumns: ColumnData[]) => {
        dispatch({ type: 'setColumns', bucket, columns: newColumns });
        dispatch({ type: 'setLogRenderer', bucket, logRenderer: await sandbox.createLogRenderer(newColumns) });
    }, [dispatch, bucket, sandbox]);

    const setColumn = useCallback(async (id: string, partialData: Partial<ColumnData> | null) => {
        const idx = columns.findIndex(c => c.id === id);

        if (idx === -1 && partialData === null) {
            return;
        }

        if (idx === -1) {
            const col = await createColumn({ id, ...partialData });
            const newColumns = [...columns, col];
            dispatch({ type: 'setColumns', bucket, columns: newColumns });
            dispatch({ type: 'setLogRenderer', bucket, logRenderer: await sandbox.createLogRenderer(newColumns) });
        } else if (partialData === null) {
            const newColumns = deleteColumn(columns, id);
            dispatch({ type: 'setColumns', bucket, columns: newColumns });
            dispatch({ type: 'setLogRenderer', bucket, logRenderer: await sandbox.createLogRenderer(newColumns) });
        } else {
            const col = await createColumn({ id, ...partialData });
            const newColumns = columns.toSpliced(idx, 1, col);
            dispatch({ type: 'setColumns', bucket, columns: newColumns });
            dispatch({ type: 'setLogRenderer', bucket, logRenderer: await sandbox.createLogRenderer(newColumns) });
        }
    }, [columns, createColumn, dispatch, bucket, sandbox, deleteColumn]);

    return { logs, columns, setColumns, setColumn, logRenderer };
}
