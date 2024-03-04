interface LogColumnData {
    id: string;
    name: string;
    pattern: string;
    evalStr: string;
    evalFn: (log: LogData) => Promise<JSONValue>;
}

type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>
    | null;

interface LogData extends Record<string, JSONValue> {
    id: string | number;
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
