interface ColumnConfig {
    name: string;
    formatter: string;
    width: number;
}

interface BucketConfig {
    columns: ColumnConfig[];
}

interface BucketData {
    columns: ColumnData[];
    logs?: LogData[];
}

interface FilterConfig {
    filter: string;
    columns: ColumnConfig[];
}

interface FilterData {
    filterString: string;
    filterFunction: (log: LogData[]) => Promise<boolean[]>;
    logs?: LogData[];
    columns?: ColumnData[];
}

interface ColumnData {
    id: string;
    name: string;
    width: number;
    formatterString: string;
    formatterFunction: (log: LogData[]) => Promise<JSONValue[]>;
}

type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>
    | null;

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
