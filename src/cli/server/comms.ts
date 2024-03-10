import { WebSocket, WebSocketServer } from 'ws';
import Denque from 'denque';

interface DebounceData {
	[bucket: string]: {
		logs: LogData[];
		timeoutId: NodeJS.Timeout;
		firstLogTime: number;
	};
}

export default class Comms {
	private wss: WebSocketServer;
	private broadcastedMessages: { [bucket: string]: number };
	private messageQueues: { [bucket: string]: Denque<LogData> };
	private debounceData: DebounceData;
	private maxQueueSize: number;
	private debounceWaitMs: number;
	private options: ServerOptions;

	constructor(wss: WebSocketServer, options: ServerOptions) {
		this.options = { ...options };
		this.wss = wss;
		this.broadcastedMessages = {};
		this.messageQueues = {};
		this.debounceData = {};
		this.maxQueueSize = this.options.stateless ? 0 : 1000;
		this.debounceWaitMs = 100;
	}

	private broadcastDebouncedLogs(bucket: string) {
		return () => {
			const logs = this.debounceData[bucket].logs;
			delete this.debounceData[bucket];

			for (const c of this.wss.clients) {
				c.send(JSON.stringify({ bucket, logs }));
			}
		};
	}

	broadcast(bucket: string, message: JSONValue, extraFields?: Record<string, JSONValue>) {
		this.broadcastedMessages[bucket] = (this.broadcastedMessages[bucket] ?? 0) + 1;

		const firstLogTime = this.debounceData[bucket]?.firstLogTime ?? Date.now();
		const elapsedTime = Date.now() - firstLogTime;
		const remainingTime = this.debounceWaitMs - elapsedTime;

		if (this.debounceData[bucket]) {
			clearTimeout(this.debounceData[bucket].timeoutId);
		}

		const log: LogData = {
			id: `${bucket}/${this.broadcastedMessages[bucket]}`,
			bucket,
			timestamp: new Date().toISOString(),
			message,
			...(extraFields ?? {})
		};

		if (!this.messageQueues[bucket]) {
			this.messageQueues[bucket] = new Denque();
		}

		const messageCount = this.messageQueues[bucket].push(log);

		if (messageCount > this.maxQueueSize) {
			this.messageQueues[bucket].shift();
		}

		this.debounceData[bucket] = {
			logs: [...(this.debounceData[bucket]?.logs ?? []), log],
			firstLogTime,
			timeoutId: setTimeout(this.broadcastDebouncedLogs(bucket), remainingTime)
		};
	}

	sendQueuedLogs(client: WebSocket) {
		for (const bucket of Object.keys(this.messageQueues)) {
			const logs = this.messageQueues[bucket].toArray();
			client.send(JSON.stringify({ bucket, logs }));
		}
	}
}
