import { JSONValue, LogData } from "@/types";
import { WebSocketServer } from "ws";

interface DebounceData {
    [bucket: string]: {
        logs: LogData[],
        timeoutId: NodeJS.Timeout,
        firstLogTime: number
    }
}

const broadcastedMessages: { [bucket: string]: number } = {};
const debounceData: DebounceData = {};
const debounceWaitMs = 100;

function broadcastDebouncedLogs(bucket: string) {
    return () => {
        const logs = debounceData[bucket].logs;
        delete debounceData[bucket];

        const outSocket = (global as any)?.["wsOut"] as WebSocketServer;
        if (!outSocket) {
            return;
        }

        for (const c of outSocket.clients) {
            c.send(JSON.stringify({ bucket, logs }));
        }
    };
}

export function broadcast(bucket: string, message: JSONValue, extraFields?: Record<string, JSONValue>) {
    broadcastedMessages[bucket] = (broadcastedMessages[bucket] ?? 0) + 1;

    const firstLogTime = debounceData[bucket]?.firstLogTime ?? Date.now();
    const elapsedTime = Date.now() - firstLogTime;
    const remainingTime = debounceWaitMs - elapsedTime;

    if (debounceData[bucket]) {
        clearTimeout(debounceData[bucket].timeoutId);
    }

    const log: LogData = {
        id: `${bucket}/${broadcastedMessages[bucket]}`,
        timestamp: new Date().toISOString(),
        message,
        ...(extraFields ?? {})
    };

    debounceData[bucket] = {
        logs: [...(debounceData[bucket]?.logs ?? []), log],
        firstLogTime,
        timeoutId: setTimeout(broadcastDebouncedLogs(bucket), remainingTime)
    };
}
