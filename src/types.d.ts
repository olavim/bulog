interface ColumnConfig {
	id: string;
	name: string;
	formatter: string;
	width: number;
}

interface BucketConfig {
	columns: ColumnConfig[];
}

interface FilterConfig {
	name: string;
	filter: string;
	columns: ColumnConfig[];
}

interface ServerConfig {
	defaults: {
		hostname: string;
		port: number;
		memorySize: number;
	};
}

interface BulogConfig {
	buckets: Record<string, BucketConfig>;
	filters: Record<string, FilterConfig>;
	server: ServerConfig;
}

type BulogConfigExport = Pick<BulogConfig, 'buckets' | 'filters'>;

type LogRenderer = (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>>;

interface BucketData {
	columns: ColumnConfig[];
	logs: LogData[];
	logRenderer: LogRenderer;
}

interface FilterData {
	name: string;
	predicateString: string;
	predicate: (log: LogData[]) => Promise<boolean[]>;
	columns: ColumnConfig[];
	logs: LogData[];
	logRenderer: LogRenderer;
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
