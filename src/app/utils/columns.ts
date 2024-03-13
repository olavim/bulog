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
		formatterString: defaultTimestampFormatterString,
		width: 220
	},
	{
		id: nanoid(16),
		name: 'message',
		formatterString: defaultMessageFormatterString,
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

export const createColumn = (data: Partial<ColumnData> | null) => {
	return {
		id: data?.id ?? nanoid(16),
		name: data?.name ?? 'New Column',
		width: data?.width ?? 200,
		formatterString: data?.formatterString ?? defaultMessageFormatterString
	} as ColumnData;
};

export const deleteColumn = (columns: ColumnData[], id: string) => {
	const idx = columns.findIndex((col) => col.id === id);
	const cols = columns.toSpliced(idx, 1);
	if (idx === 0) {
		cols[idx] = { ...cols[idx], width: columns[0].width + columns[1].width };
	} else {
		cols[idx - 1] = { ...cols[idx - 1], width: columns[idx - 1].width + columns[idx].width };
	}
	return cols;
};
