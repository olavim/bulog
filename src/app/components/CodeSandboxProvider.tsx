import { useState } from "react";
import { CodeSandboxContext } from "@/context/codeSandbox";
import useGlobalEvent from "beautiful-react-hooks/useGlobalEvent";
import sandboxSrc from "@/assets/sandbox.html?url";

interface CodeSandboxProviderProps {
    children: React.ReactNode;
}

export function CodeSandboxProvider({ children }: CodeSandboxProviderProps) {
    const [ref, setRef] = useState<HTMLIFrameElement | null>(null);
    const [iframeKey, setIframeKey] = useState(0);
    const onMessage = useGlobalEvent<MessageEvent>("message");

    onMessage(evt => {
        if (evt.origin === "null" && evt.source === ref?.contentWindow && evt.data.type === 'sandbox-unloaded') {
            setIframeKey(key => key + 1);
        }
    });

    return (
        <>
            <iframe key={iframeKey} ref={setRef} className="h-0" id="code-sandbox" sandbox="allow-scripts" src={sandboxSrc} />
            {ref && (
                <CodeSandboxContext.Provider value={ref}>
                    {children}
                </CodeSandboxContext.Provider>
            )}
        </>
    );
}
