export interface LogColumnData {
    name: string;
    pattern: string;
    format?: (value: JSONValue) => string;
}

export type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>
    | null;

export interface LogData extends Record<string, JSONValue> {
    id: string | number;
    timestamp: string;
    message: JSONValue;
}

export interface LogMessage {
    bucket: string;
    logs: LogData[];
}
