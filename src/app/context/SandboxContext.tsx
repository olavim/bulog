import { createContext, useEffect, useRef, useState } from 'react';
import lodash from 'lodash';
import useGlobalEvent from 'beautiful-react-hooks/useGlobalEvent';
import { ColumnConfig, JSONValue, LogData } from '@/types';

export class Sandbox {
	private iframe: HTMLIFrameElement | null = null;
	private pendingCreates: Record<string, () => void> = {};
	private pendingFunctions: Record<string, (value: any[]) => void> = {};
	private pendingCreateGroups: Record<string, () => void> = {};
	private pendingFunctionGroups: Record<string, (value: Array<{ [id: string]: any }>) => void> = {};
	private readyLock: Promise<any> | null = null;
	private readyLockResolve: (() => void) | null = null;
	private unloadListeners: (() => void)[] = [];

	private previousId: number = 0;

	constructor() {
		this.postMessage = this.postMessage.bind(this);
		this.createCallback = this.createCallback.bind(this);
		this.onUnload = this.onUnload.bind(this);
		this.resetLock = this.resetLock.bind(this);
		this.init = this.init.bind(this);
		this.nextId = this.nextId.bind(this);

		this.resetLock();
	}

	private nextId() {
		this.previousId++;
		return String(this.previousId);
	}

	private resetLock() {
		this.readyLock = new Promise((resolve) => {
			this.readyLockResolve = () => resolve(null);
		});
	}

	public init(iframe: HTMLIFrameElement) {
		if (this.iframe) {
			this.iframe.onload = null;
			this.resetLock();
		}

		this.iframe = iframe;
		this.iframe.onload = () => {
			this.readyLockResolve?.();
		};
	}

	public postMessage(data: any) {
		if (data?.type === 'fn-created') {
			const fnId = data.id;
			this.pendingCreates[fnId]?.();
		}

		if (data?.type === 'fn-group-created') {
			const groupId = data.id;
			this.pendingCreateGroups[groupId]?.();
		}

		if (data?.type === 'fn-result') {
			const evalId = data.id;
			this.pendingFunctions[evalId]?.(data.result);
		}

		if (data?.type === 'fn-group-result') {
			const groupEvalId = data.id;
			this.pendingFunctionGroups[groupEvalId]?.(data.result);
		}

		if (data?.type === 'sandbox-unloaded') {
			this.resetLock();
			this.unloadListeners.forEach((cb) => cb());
		}
	}

	public async createCallback<T extends LogData, K extends JSONValue>(code: string) {
		await this.readyLock;

		const fnId = this.nextId();

		const createPromise = new Promise<void>((resolve) => {
			this.pendingCreates[fnId] = resolve;
		});

		this.iframe?.contentWindow?.postMessage({ id: fnId, code, type: 'create-fn' }, '*');
		await createPromise;

		delete this.pendingCreates[fnId];

		return lodash.memoize(
			async (logs: T[]) => {
				const evalId = this.nextId();
				const evalPromise = new Promise<K[]>((resolve) => {
					this.pendingFunctions[evalId] = resolve;
				});

				this.iframe?.contentWindow?.postMessage(
					{ id: evalId, fnId, arg: logs, type: 'eval-fn' },
					'*'
				);
				const result = await evalPromise;

				delete this.pendingFunctions[evalId];

				return result as K[];
			},
			(logs) => logs.map((log) => log.id).join(',')
		) as (logs: T[]) => Promise<K[]>;
	}

	public async createLogRenderer(columns: ColumnConfig[]) {
		const codes = columns.reduce(
			(obj, col) => ({ ...obj, [col.id]: col.formatter }),
			{} as { [id: string]: string }
		);
		return this.createCallbackGroup(codes);
	}

	public async createCallbackGroup<T extends LogData, K extends JSONValue>(codes: {
		[id: string]: string;
	}) {
		await this.readyLock;

		const groupId = this.nextId();

		const createPromise = new Promise<void>((resolve) => {
			this.pendingCreateGroups[groupId] = resolve;
		});

		this.iframe?.contentWindow?.postMessage({ id: groupId, codes, type: 'create-fn-group' }, '*');
		await createPromise;

		delete this.pendingCreateGroups[groupId];

		return lodash.memoize(
			async (logs: T[]) => {
				const groupEvalId = this.nextId();
				const evalPromise = new Promise<Array<{ [id: string]: K }>>((resolve) => {
					this.pendingFunctionGroups[groupEvalId] = resolve;
				});

				this.iframe?.contentWindow?.postMessage(
					{ id: groupEvalId, groupId, arg: logs, type: 'eval-fn-group' },
					'*'
				);
				const result = await evalPromise;

				delete this.pendingFunctionGroups[groupEvalId];

				return result as Array<{ [id: string]: K }>;
			},
			(logs) => logs.map((log) => log.id).join(',')
		);
	}

	public onUnload(cb: () => void) {
		this.unloadListeners.push(cb);
	}
}

export const SandboxContext = createContext<Sandbox>(null as any);

interface CodeSandboxProviderProps {
	children: React.ReactNode;
}

export function SandboxProvider({ children }: CodeSandboxProviderProps) {
	const [ref, setRef] = useState<HTMLIFrameElement | null>(null);
	const [iframeKey, setIframeKey] = useState(0);
	const onMessage = useGlobalEvent<MessageEvent>('message');
	const sandbox = useRef<Sandbox>(new Sandbox());

	useEffect(() => {
		sandbox.current.onUnload(() => setIframeKey((key) => key + 1));
	}, [sandbox]);

	onMessage((evt: MessageEvent) => {
		if (evt.origin === 'null' && evt.source === ref?.contentWindow) {
			sandbox.current.postMessage(evt.data);
		}
	});

	useEffect(() => {
		if (ref) {
			sandbox.current.init(ref);
		}
	}, [ref, sandbox]);

	useEffect(() => setIframeKey((key) => key + 1), []);

	return (
		<>
			<iframe
				key={iframeKey}
				ref={setRef}
				className="absolute h-0 w-0"
				id="code-sandbox"
				sandbox="allow-scripts"
				src="/sandbox/index.html"
			/>
			<SandboxContext.Provider value={sandbox.current}>{children}</SandboxContext.Provider>
		</>
	);
}
