import { useCallback, useContext, useMemo } from "react";
import useColumnUtils from "./useColumnUtils";
import { FilterConfigInput, FiltersContext } from "../context/FiltersContext";

export default function useFilter(filter: string) {
    const [ctx, dispatch] = useContext(FiltersContext);
    const { createColumn, deleteColumn } = useColumnUtils();

    const ctxLogs = ctx.filters.get(filter)?.logs;
    const ctxColumns = ctx.filters.get(filter)?.columns;

    const logs = useMemo(() => ctxLogs ?? [], [ctxLogs]);
    const columns = useMemo(() => ctxColumns ?? [], [ctxColumns]);

    const setLogs = useCallback((logs: LogData[]) => {
        dispatch({ type: 'setLogs', filter, logs });
    }, [dispatch, filter]);

    const setColumns = useCallback((columns: ColumnData[]) => {
        dispatch({ type: 'setColumns', filter, columns });
    }, [dispatch, filter]);

    const setColumn = useCallback(async (id: string, partialData: Partial<ColumnData> | null) => {
        const idx = columns.findIndex(c => c.id === id);

        if (idx === -1 && partialData === null) {
            return;
        }

        if (idx === -1) {
            const col = await createColumn({ id, ...partialData });
            dispatch({ type: 'setColumns', filter, columns: [...columns, col] });
        } else if (partialData === null) {
            dispatch({ type: 'setColumns', filter, columns: deleteColumn(columns, id) });
        } else {
            const col = await createColumn({ id, ...partialData });
            dispatch({ type: 'setColumns', filter, columns: columns.toSpliced(idx, 1, col) });
        }
    }, [columns, createColumn, dispatch, filter, deleteColumn]);

    const setConfig = useCallback((config: FilterConfigInput) => {
        dispatch({ type: 'setConfig', filter, config });
    }, [dispatch, filter]);

    const deleteFilter = useCallback(() => {
        dispatch({ type: 'deleteFilter', filter });
    }, [dispatch, filter]);

    return {
        logs,
        setLogs,
        columns,
        setColumns,
        setColumn,
        setConfig,
        deleteFilter,
        filterString: ctx.filters.get(filter)?.filterString,
        filterFunction: ctx.filters.get(filter)?.filterFunction
    };
}
