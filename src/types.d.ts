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

type LogRenderer = (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>>;

interface BucketData {
	columns: ColumnData[];
	logs: LogData[];
	logRenderer: LogRenderer;
}

interface FilterData {
	filterString: string;
	filterFunction: (log: LogData[]) => Promise<boolean[]>;
	columns: ColumnData[];
	logs: LogData[];
	logRenderer: LogRenderer;
}

interface ColumnData {
	id: string;
	name: string;
	width: number;
	formatterString: string;
}

type JSONValue = string | number | boolean | Record<string, any> | any[] | null;

// Immer doesn't like this. Try again if it gets fixed.
// type JSONValue = string | number | boolean | Record<string, JSONValue> | JSONValue[] | null;

interface LogData extends Record<string, JSONValue> {
	id: string;
	bucket: string;
	timestamp: string;
	message: JSONValue;
}

interface LogMessage {
	bucket: string;
	log: LogData;
}

interface RenderedLog {
	log: LogData;
	render: JSONValue[];
}
