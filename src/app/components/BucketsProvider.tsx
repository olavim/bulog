import { useCallback, useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { BucketsContext, BucketsDispatchContext, useBucketsReducer } from "@/context/buckets";

interface BucketsProviderProps {
    children: React.ReactNode;
}

export function BucketsProvider({ children }: BucketsProviderProps) {
    const [context, dispatch] = useBucketsReducer();
    const [host, setHost] = useState<string>();

    const onMessage = useCallback((evt: MessageEvent) => {
        const json = JSON.parse(evt.data) as LogMessage;
        const bucket = json.bucket;
        const logs = json.logs;
        dispatch({ type: 'addLogs', bucket, logs });
    }, [dispatch]);

    useWebSocket(`ws://${host}/api/sockets/out`, { onMessage }, host !== undefined);

    useEffect(() => {
        if (window.location.host !== host) {
            setHost(window.location.host);
        }
    }, [host]);

    return (
        <BucketsContext.Provider value={context}>
            <BucketsDispatchContext.Provider value={dispatch}>
                {children}
            </BucketsDispatchContext.Provider>
        </BucketsContext.Provider>
    );
}
