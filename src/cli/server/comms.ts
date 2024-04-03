import Denque from 'denque';
import { nanoid } from 'nanoid';

interface DebounceData {
	logs: LogData[];
	timeoutId?: NodeJS.Timeout;
	firstLogTime?: number;
}

export interface CommsOptions {
	maxQueueSize: number;
}

export default class Comms {
	private broadcastedMessages: { [bucket: string]: number };
	private messageQueue: Denque<LogData>;
	private debounceData: DebounceData;
	private maxQueueSize: number;
	private debounceWaitMs: number;
	private messageListeners: Map<string, (messages: LogData[]) => void>;

	constructor(options: CommsOptions) {
		this.messageListeners = new Map();
		this.broadcastedMessages = {};
		this.messageQueue = new Denque();
		this.debounceData = { logs: [] };
		this.maxQueueSize = options.maxQueueSize;
		this.debounceWaitMs = 100;
	}

	private broadcastDebouncedLogs() {
		for (const [, listener] of this.messageListeners.entries()) {
			listener(this.debounceData.logs);
		}
		this.debounceData = { logs: [] };
	}

	addMessageListener(cb: (messages: LogData[]) => void) {
		const id = nanoid();
		this.messageListeners.set(id, cb);
		cb(this.messageQueue.toArray());
		return id;
	}

	removeMessageListener(id: string) {
		if (!this.messageListeners.delete(id)) {
			console.error(`No message listener with ID "${id}"`);
		}
	}

	broadcast(bucket: string, message: JSONValue, extraFields?: Record<string, JSONValue>) {
		this.broadcastedMessages[bucket] = (this.broadcastedMessages[bucket] ?? 0) + 1;

		const firstLogTime = this.debounceData?.firstLogTime ?? Date.now();
		const elapsedTime = Date.now() - firstLogTime;
		const remainingTime = this.debounceWaitMs - elapsedTime;

		if (this.debounceData.timeoutId !== undefined) {
			clearTimeout(this.debounceData.timeoutId);
		}

		const log: LogData = {
			id: `${bucket}/${this.broadcastedMessages[bucket]}`,
			bucket,
			timestamp: new Date().toISOString(),
			message,
			...(extraFields ?? {})
		};

		const messageCount = this.messageQueue.push(log);

		if (messageCount > this.maxQueueSize) {
			this.messageQueue.shift();
		}

		this.debounceData = {
			logs: [...this.debounceData.logs, log],
			firstLogTime,
			timeoutId: setTimeout(() => this.broadcastDebouncedLogs(), remainingTime)
		};
	}

	resetCache() {
		this.messageListeners = new Map();
		this.messageQueue.clear();
		this.debounceData = { logs: [] };
		this.broadcastedMessages = {};
	}
}
