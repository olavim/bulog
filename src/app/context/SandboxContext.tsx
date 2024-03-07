import { createContext, useEffect, useRef, useState } from "react";
import sandboxSrc from "@/assets/sandbox.html?url";
import { v4 as uuidv4 } from 'uuid';
import { memoize } from "lodash";
import useGlobalEvent from "beautiful-react-hooks/useGlobalEvent";

export class Sandbox {
    private iframe: HTMLIFrameElement | null = null;
    private pendingCreates: Record<string, () => void> = {};
    private pendingFunctions: Record<string, (value: any[]) => void> = {};
    private readyLock: Promise<any> | null = null;
    private readyLockResolve: (() => void) | null = null;
    private unloadListeners: (() => void)[] = [];

    constructor() {
        this.postMessage = this.postMessage.bind(this);
        this.createCallback = this.createCallback.bind(this);
        this.onUnload = this.onUnload.bind(this);
        this.resetLock = this.resetLock.bind(this);

        this.resetLock();
    }

    private resetLock() {
        this.readyLock = new Promise(resolve => {
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

        if (data?.type === 'fn-result') {
            const evalId = data.id;
            this.pendingFunctions[evalId]?.(data.result);
        }

        if (data?.type === 'sandbox-unloaded') {
            this.resetLock();
            this.unloadListeners.forEach(cb => cb());
        }
    }

    public async createCallback<T extends LogData, K extends JSONValue>(code: string) {
        await this.readyLock;

        const fnId = uuidv4();

        const createPromise = new Promise<void>(resolve => {
            this.pendingCreates[fnId] = resolve;//
        });

        this.iframe?.contentWindow?.postMessage({ id: fnId, code, type: 'create-fn' }, '*');
        await createPromise;

        delete this.pendingCreates[fnId];

        return memoize(async (logs: T[]) => {
            const evalId = uuidv4();
            const evalPromise = new Promise<K[]>(resolve => {
                this.pendingFunctions[evalId] = resolve;
            });

            this.iframe?.contentWindow?.postMessage({ id: evalId, fnId, arg: logs, type: 'eval-fn' }, '*');
            const result = await evalPromise;

            delete this.pendingFunctions[evalId];

            return result as K[];
        }, logs => logs.map(log => log.id).join(','));
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
        sandbox.current.onUnload(() => setIframeKey(key => key + 1));
    }, [sandbox]);

    onMessage((evt: MessageEvent) => {
        if (evt.origin === "null" && evt.source === ref?.contentWindow) {
            sandbox.current.postMessage(evt.data);
        }
    });

    useEffect(() => {
        if (ref) {
            sandbox.current.init(ref);
        }
    }, [ref, sandbox]);

    useEffect(() => setIframeKey(key => key + 1), []);

    return (
        <>
            <iframe key={iframeKey} ref={setRef} className="h-0" id="code-sandbox" sandbox="allow-scripts" src={sandboxSrc} />
            {ref && (
                <SandboxContext.Provider value={sandbox.current}>
                    {children}
                </SandboxContext.Provider>
            )}
        </>
    );
}
