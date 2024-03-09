import { createContext, useState } from 'react';

export const LogsContext = createContext<[LogData[], (logs: LogData[]) => void]>([[], () => { }]);

interface LogProviderProps {
    children: React.ReactNode;
}

export function LogProvider({ children }: LogProviderProps) {
    const [logs, setLogs] = useState<LogData[]>([]);

    return (
        <LogsContext.Provider value={[logs, setLogs]}>
            {children}
        </LogsContext.Provider>
    );
}
