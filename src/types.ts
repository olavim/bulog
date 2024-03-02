export interface LogColumnData {
    id: string;
    name: string;
    pattern: string;
    evalStr: string;
    evalFn: (log: JSONValue) => Promise<JSONValue>;
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

export interface RenderedLog {
    log: LogData;
    render: JSONValue[];
}