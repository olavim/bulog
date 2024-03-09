import { LogsContext } from '@/context/LogContext';
import { useCallback, useContext } from 'react';

export default function useLogs() {
	const [logs, setLogs] = useContext(LogsContext);

	const addLogs = useCallback(
		(newLogs: LogData[]) => {
			setLogs([...logs, ...newLogs]);
		},
		[logs, setLogs]
	);

	return { logs, addLogs };
}
