import { useCallback, useContext, useMemo } from "react";
import useColumnUtils from "./useColumnUtils";
import { FilterConfigInput, FiltersContext } from "../context/FiltersContext";
import useSandbox from "./useSandbox";

export default function useFilter(filter: string) {
    const [ctx, dispatch] = useContext(FiltersContext);
    const { createColumn, deleteColumn } = useColumnUtils();
    const sandbox = useSandbox();

    const ctxLogs = ctx.filters.get(filter)?.logs;
    const ctxColumns = ctx.filters.get(filter)?.columns;
    const ctxLogRenderer = ctx.filters.get(filter)?.logRenderer;

    const logs = useMemo(() => ctxLogs ?? [], [ctxLogs]);
    const columns = useMemo(() => ctxColumns ?? [], [ctxColumns]);
    const logRenderer = useMemo(() => ctxLogRenderer ?? (async (logs: LogData[]) => logs.map(() => ({}))), [ctxLogRenderer]);

    const setLogs = useCallback((logs: LogData[]) => {
        dispatch({ type: 'setLogs', filter, logs });
    }, [dispatch, filter]);

    const setColumns = useCallback(async (newColumns: ColumnData[]) => {
        dispatch({ type: 'setColumns', filter, columns: newColumns });
        dispatch({ type: 'setLogRenderer', filter, logRenderer: await sandbox.createLogRenderer(newColumns) });
    }, [dispatch, filter, sandbox]);

    const setColumn = useCallback(async (id: string, partialData: Partial<ColumnData> | null) => {
        const idx = columns.findIndex(c => c.id === id);

        if (idx === -1 && partialData === null) {
            return;
        }

        if (idx === -1) {
            const col = await createColumn({ id, ...partialData });
            const newColumns = [...columns, col];
            dispatch({ type: 'setColumns', filter, columns: newColumns });
            dispatch({ type: 'setLogRenderer', filter, logRenderer: await sandbox.createLogRenderer(newColumns) });
        } else if (partialData === null) {
            const newColumns = deleteColumn(columns, id);
            dispatch({ type: 'setColumns', filter, columns: newColumns });
            dispatch({ type: 'setLogRenderer', filter, logRenderer: await sandbox.createLogRenderer(newColumns) });
        } else {
            const col = await createColumn({ id, ...partialData });
            const newColumns = columns.toSpliced(idx, 1, col);
            dispatch({ type: 'setColumns', filter, columns: newColumns });
            dispatch({ type: 'setLogRenderer', filter, logRenderer: await sandbox.createLogRenderer(newColumns) });
        }
    }, [columns, createColumn, dispatch, filter, sandbox, deleteColumn]);

    const setConfig = useCallback(async (config: FilterConfigInput) => {
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
        filterFunction: ctx.filters.get(filter)?.filterFunction,
        logRenderer
    };
}
