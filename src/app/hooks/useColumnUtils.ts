import { v4 as uuidv4 } from 'uuid';
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
export const defaultFormatterString = createSimpleFormatter('log.message');

export const defaultLogRenderer = (timestampColumnId: string, messageColumnId: string) => async (logs: LogData[]) => {
    return logs.map(log => ({
        [timestampColumnId]: log.timestamp,
        [messageColumnId]: log.message
    }));
};

export default function useColumnUtils() {
    const createColumn = useCallback(async (data: Partial<ColumnData> | null) => {
        return {
            id: data?.id ?? uuidv4(),
            name: data?.name ?? 'New Column',
            width: data?.width ?? 200,
            formatterString: data?.formatterString ?? defaultFormatterString
        } as ColumnData;
    }, []);

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