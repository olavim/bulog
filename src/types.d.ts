interface ColumnConfig {
	name: string;
	formatter: string;
	width: number;
}

interface BucketConfig {
	columns: ColumnConfig[];
}

interface FilterConfig {
	filter: string;
	columns: ColumnConfig[];
}

interface BucketData {
	columns: ColumnData[];
	logs?: LogData[];
	logRenderer: (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>>;
}

interface FilterData {
	filterString: string;
	filterFunction: (log: LogData[]) => Promise<boolean[]>;
	columns?: ColumnData[];
	logs?: LogData[];
	logRenderer: (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>>;
}

interface ColumnData {
	id: string;
	name: string;
	width: number;
	formatterString: string;
}

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue> | null;

interface LogData extends Record<string, JSONValue> {
	id: string;
	bucket: string;
	timestamp: string;
	message: JSONValue;
}

interface LogMessage {
	bucket: string;
	logs: LogData[];
}

interface RenderedLog {
	log: LogData;
	render: JSONValue[];
}
