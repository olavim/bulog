import { ColumnConfig, LogData } from '@/types';
import { nanoid } from 'nanoid';

export const createSimpleFormatter = (pattern?: string) => {
	const str = `
const _ = require('lodash');

return log => {
  return ${pattern ?? 'log'};
};`;
	return str.trim();
};

export const defaultTimestampFormatterString = createSimpleFormatter(
	'new Date(log.timestamp).toLocaleString()'
);
export const defaultMessageFormatterString = createSimpleFormatter('log.message');

export const createDefaultColumns = () => [
	{
		id: nanoid(16),
		name: 'timestamp',
		formatter: defaultTimestampFormatterString,
		width: 220
	},
	{
		id: nanoid(16),
		name: 'message',
		formatter: defaultMessageFormatterString,
		width: 200
	}
];

export const defaultLogRenderer =
	(timestampColumnId: string, messageColumnId: string) => async (logs: LogData[]) => {
		return logs.map((log) => ({
			[timestampColumnId]: new Date(log.timestamp).toLocaleString(),
			[messageColumnId]: log.message
		}));
	};

export const createColumn = (config?: Partial<ColumnConfig>) => {
	return {
		id: config?.id ?? nanoid(16),
		name: config?.name ?? 'New Column',
		width: config?.width ?? 200,
		formatter: config?.formatter ?? defaultMessageFormatterString
	} as ColumnConfig;
};

export const deleteColumn = (columns: ColumnConfig[], id: string) => {
	const idx = columns.findIndex((col) => col.id === id);
	const cols = columns.toSpliced(idx, 1);
	if (idx === 0) {
		cols[idx] = { ...cols[idx], width: columns[0].width + columns[1].width };
	} else {
		cols[idx - 1] = { ...cols[idx - 1], width: columns[idx - 1].width + columns[idx].width };
	}
	return cols;
};
