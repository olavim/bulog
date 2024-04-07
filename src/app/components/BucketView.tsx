import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { filter as liqeFilter, LiqeQuery } from 'liqe';
import LogList from './LogList';
import LogView from './LogView';
import ColumnView from './ColumnView';
import Drawer from './Drawer';
import Search from './Search';
import NewColumnButton from './NewColumnButton';
import globalStore from '@/stores/globalStore';
import useSandbox from '@/hooks/useSandbox';
import { createColumn, deleteColumn } from '@/utils/columns';

interface BucketLogsProps {
	bucket: string;
}

export default memo(function BucketLogs(props: BucketLogsProps) {
	const { bucket } = props;

	const sandbox = useSandbox();
	const bucketStore = globalStore.use((state) => state.buckets.get(bucket)!);
	const logs = bucketStore.use((state) => state.data.logs);
	const columns = bucketStore.use((state) => state.data.columns);
	const logRenderer = bucketStore.use((state) => state.data.logRenderer);
	const setColumns = bucketStore.use.setColumns();

	const [query, setQuery] = useState<LiqeQuery | null>(null);
	const [searchedLogs, setSearchedLogs] = useState<LogData[]>(logs);
	const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
	const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
	const selectedColumn = useMemo(
		() => columns.find((c) => c.id === selectedColumnId) ?? null,
		[columns, selectedColumnId]
	);

	const onAddColumn = useCallback(async () => {
		const newColumn = createColumn();
		setSelectedColumnId(newColumn.id);
		setSelectedLog(null);
		setColumns([...columns, newColumn], sandbox);
	}, [columns, sandbox, setColumns]);

	const onDeselect = useCallback(() => {
		setSelectedLog(null);
		setSelectedColumnId(null);
	}, []);

	const onSelectLog = useCallback((log: LogData) => {
		setSelectedColumnId(null);
		setSelectedLog(log);
	}, []);

	const onSelectColumn = useCallback((column: ColumnConfig) => {
		setSelectedColumnId(column.id);
		setSelectedLog(null);
	}, []);

	useEffect(() => {
		if (!query || query?.type === 'EmptyExpression') {
			setSearchedLogs(logs);
		} else {
			setSearchedLogs(liqeFilter(query, logs) as LogData[]);
		}
	}, [logs, query]);

	const handleSetColumns = useCallback(
		(cols: ColumnConfig[]) => {
			setColumns(cols, sandbox);
		},
		[sandbox, setColumns]
	);

	const handleSetColumn = useCallback(
		async (config: ColumnConfig) => {
			const idx = columns.findIndex((c) => c.id === config.id);
			const col = createColumn(config);
			const newColumns = columns.toSpliced(idx, 1, col);
			setColumns(newColumns, sandbox);
		},
		[columns, sandbox, setColumns]
	);

	const handleDeleteColumn = useCallback(
		(id: string) => {
			const newColumns = deleteColumn(columns, id);
			setColumns(newColumns, sandbox);
		},
		[columns, sandbox, setColumns]
	);

	return (
		<div className="flex flex-row grow overflow-hidden">
			<div className="flex flex-col grow overflow-hidden">
				<div className="flex flex-row items-center justify-between basis-20 shrink-0 grow-0 shadow-lg px-12 bg-slate-100">
					<div className="grow flex justify-between">
						<Search onSearch={setQuery} />
						<NewColumnButton onClick={onAddColumn} />
					</div>
				</div>
				<div className="flex flex-row basis-full grow-1 shrink-1 w-full max-w-full overflow-hidden justify-center bg-slate-200 px-12 py-8">
					<LogList
						logs={searchedLogs}
						columns={columns}
						logRenderer={logRenderer}
						selectedLog={selectedLog}
						selectedColumn={selectedColumn}
						onSelectLog={onSelectLog}
						onSelectColumn={onSelectColumn}
						onChangeColumns={handleSetColumns}
					/>
				</div>
			</div>
			{selectedLog && (
				<Drawer title="Log details" onClose={onDeselect}>
					<LogView log={selectedLog} onAddColumn={onAddColumn} />
				</Drawer>
			)}
			{selectedColumn && (
				<Drawer title="Column details" onClose={onDeselect}>
					<ColumnView
						column={selectedColumn}
						onChange={handleSetColumn}
						onDelete={handleDeleteColumn}
					/>
				</Drawer>
			)}
		</div>
	);
});
