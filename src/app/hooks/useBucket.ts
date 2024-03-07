import { BucketsContext } from "@/context/BucketsContext";
import useColumnUtils from "@/hooks/useColumnUtils";
import { useCallback, useContext, useMemo } from "react";

export default function useBucket(bucket: string) {
    const [ctx, dispatch] = useContext(BucketsContext);
    const { createColumn, deleteColumn } = useColumnUtils();

    const ctxLogs = ctx.buckets.get(bucket)?.logs;
    const logs = useMemo(() => ctxLogs ?? [], [ctxLogs]);

    const ctxColumns = ctx.buckets.get(bucket)?.columns;
    const columns = useMemo(() => ctxColumns ?? [], [ctxColumns]);

    const setColumns = useCallback((columns: ColumnData[]) => {
        dispatch!({ type: 'setColumns', bucket, columns });
    }, [dispatch, bucket]);

    const setColumn = useCallback(async (id: string, partialData: Partial<ColumnData> | null) => {
        const idx = columns.findIndex(c => c.id === id);

        if (idx === -1 && partialData === null) {
            return;
        }

        if (idx === -1) {
            const col = await createColumn({ id, ...partialData });
            dispatch!({ type: 'setColumns', bucket, columns: [...columns, col] });
        } else if (partialData === null) {
            dispatch!({ type: 'setColumns', bucket, columns: deleteColumn(columns, id) });
        } else {
            const col = await createColumn({ id, ...partialData });
            dispatch!({ type: 'setColumns', bucket, columns: columns.toSpliced(idx, 1, col) });
        }
    }, [columns, dispatch, bucket, createColumn, deleteColumn]);

    return { logs, columns, setColumns, setColumn };
}
