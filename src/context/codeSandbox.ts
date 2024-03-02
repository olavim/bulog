import { JSONValue, LogData } from "@/types";
import useGlobalEvent from "beautiful-react-hooks/useGlobalEvent";
import lodash from "lodash";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export const CodeSandboxContext = createContext<HTMLIFrameElement>({} as HTMLIFrameElement);

export function useSandbox() {
    const iframe = useContext(CodeSandboxContext)!;
    const onMessage = useGlobalEvent<MessageEvent<any>>('message');
    const pendingCreates = useRef<Record<string, () => void>>({});
    const pendingEvals = useRef<Record<string, (value: JSONValue) => void>>({});

    onMessage(evt => {
        if (evt.origin === "null" && evt.source === iframe.contentWindow) {
            if (evt.data.type === 'fn-created') {
                const fnId = evt.data.id;
                pendingCreates.current[fnId]?.();
            }

            if (evt.data.type === 'fn-result') {
                const evalId = evt.data.id;
                pendingEvals.current[evalId]?.(evt.data.result);
            }
        }
    });

    const createFn = useCallback(async (fnId: string, code: string) => {
        const createPromise = new Promise<void>(resolve => {
            pendingCreates.current[fnId] = resolve;
        });

        iframe.contentWindow?.postMessage({ id: fnId, code, type: 'create-fn' }, '*');
        await createPromise;

        delete pendingCreates.current[fnId];

        return async (value: JSONValue) => {
            const evalId = uuidv4();
            const evalPromise = new Promise<JSONValue>(resolve => {
                pendingEvals.current[evalId] = resolve;
            });

            iframe.contentWindow?.postMessage({ id: evalId, fnId, arg: value, type: 'eval-fn' }, '*');
            const result = await evalPromise;

            delete pendingEvals.current[evalId];

            return result;
        };
    }, [iframe.contentWindow]);

    return { createFn };
}
