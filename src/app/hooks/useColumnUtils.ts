import { v4 as uuidv4 } from 'uuid';
import useSandbox, { createSimpleFunction } from "./useSandbox";
import { useCallback } from 'react';

export const createSimpleFormatter = (pattern?: string) => {
    const str = `
const _ = require('lodash');

return log => {
  return ${pattern ?? 'log'};
};`;
    return str.trim();
};

export const defaultTimestampFormatterString = createSimpleFormatter('new Date(log.timestamp).toLocaleString()');
export const defaultTimestampFormatterFunction = createSimpleFunction(defaultTimestampFormatterString);

export const defaultFormatterString = createSimpleFormatter('log.message');
export const defaultFormatterFunction = createSimpleFunction(defaultFormatterString);

export default function useColumnUtils() {
    const sandbox = useSandbox();

    const createColumn = useCallback(async (data: Partial<ColumnData> | null) => {
        return {
            id: data?.id ?? uuidv4(),
            name: data?.name ?? 'New Column',
            width: data?.width ?? 200,
            formatterString: data?.formatterString ?? defaultFormatterString,
            formatterFunction: data?.formatterFunction ?? await sandbox.createCallback(data?.formatterString ?? defaultFormatterString)
        } as ColumnData;
    }, [sandbox]);

    const deleteColumn = useCallback((columns: ColumnData[], id: string) => {
        const idx = columns.findIndex(col => col.id === id);
        const cols = columns.toSpliced(idx, 1);
        if (idx === 0) {
            cols[idx].width = columns[0].width + columns[1].width;
        } else {
            cols[idx - 1].width = columns[idx - 1].width + columns[idx].width;
        }
        return cols;
    }, []);

    return { createColumn, deleteColumn };
}
