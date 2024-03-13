import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { filter as liqeFilter, LiqeQuery } from 'liqe';
import LogList from './LogList';
import LogView from './LogView';
import ColumnView from './ColumnView';
import Drawer from './Drawer';
import Search from './Search';
import NewColumnButton from './NewColumnButton';
import { IoMdSettings } from 'react-icons/io';
import FilterSettings from './FilterSettings';
import useSandbox from '@/hooks/useSandbox';
import globalStore from '@/stores/globalStore';
import { createColumn, deleteColumn } from '@/utils/columns';

interface FilterViewProps {
	filter: string;
}

export default memo(function FilterView(props: FilterViewProps) {
	const { filter } = props;

	const sandbox = useSandbox();
	const filterStore = globalStore.use((state) => state.filters.get(filter)!);
	const logs = filterStore.use((state) => state.data.logs);
	const columns = filterStore.use((state) => state.data.columns);
	const predicateString = filterStore.use((state) => state.data.filterString);
	const renderKey = filterStore.use.renderKey();
	const readProgress = filterStore.use.readProgress();
	const readingLogs = filterStore.use.readingLogs();
	const logRenderer = filterStore.use((state) => state.data.logRenderer);
	const setColumns = filterStore.use.setColumns();
	const setPredicate = filterStore.use.setPredicate();
	const rename = globalStore.use.renameFilter();
	const deleteFilter = globalStore.use.deleteFilter();

	const [query, setQuery] = useState<LiqeQuery | null>(null);
	const [searchedLogs, setSearchedLogs] = useState<LogData[]>(logs);
	const [settingsOpen, setSettingOpen] = useState<boolean>(false);
	const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
	const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
	const selectedColumn = useMemo(
		() => columns.find((c) => c.id === selectedColumnId) ?? null,
		[columns, selectedColumnId]
	);

	const handleSetFilterConfig = useCallback(
		(name: string, filterString: string) => {
			setPredicate(filterString, sandbox);
			rename(filter, name);
		},
		[filter, sandbox, rename, setPredicate]
	);

	const onDeleteFilter = useCallback(() => {
		setSettingOpen(false);
		deleteFilter(filter);
	}, [deleteFilter, filter]);

	const onSettings = useCallback(() => {
		setSelectedColumnId(null);
		setSelectedLog(null);
		setSettingOpen(true);
	}, []);

	useEffect(() => {
		if (!query || query?.type === 'EmptyExpression') {
			setSearchedLogs(logs);
		} else {
			setSearchedLogs(liqeFilter(query, logs) as LogData[]);
		}
	}, [logs, query]);

	const onAddColumn = useCallback(async () => {
		const newColumn = createColumn(null);
		setSelectedColumnId(newColumn.id);
		setSelectedLog(null);
		setSettingOpen(false);
		setColumns([...columns, newColumn], sandbox);
	}, [columns, sandbox, setColumns]);

	const onDeselect = useCallback(() => {
		setSelectedLog(null);
		setSelectedColumnId(null);
		setSettingOpen(false);
	}, []);

	const onSelectLog = useCallback((log: LogData) => {
		setSelectedColumnId(null);
		setSelectedLog(log);
		setSettingOpen(false);
	}, []);

	const onSelectColumn = useCallback((column: ColumnData) => {
		setSelectedColumnId(column.id);
		setSelectedLog(null);
		setSettingOpen(false);
	}, []);

	const handleSetColumns = useCallback(
		(cols: ColumnData[]) => {
			setColumns(cols, sandbox);
		},
		[sandbox, setColumns]
	);

	const handleSetColumn = useCallback(
		async (id: string, data: Partial<ColumnData> | null) => {
			const idx = columns.findIndex((c) => c.id === id);

			if (data === null) {
				const newColumns = deleteColumn(columns, id);
				setColumns(newColumns, sandbox);
			} else {
				const col = createColumn({ id, ...data });
				const newColumns = columns.toSpliced(idx, 1, col);
				setColumns(newColumns, sandbox);
			}
		},
		[columns, sandbox, setColumns]
	);

	return (
		<div className="flex flex-row grow overflow-hidden">
			{readingLogs && (
				<div className="fixed z-10 flex items-center justify-center w-full h-full bg-black/25">
					<div className="w-full max-w-[25%] flex flex-col items-center justify-center text-slate-500 left-1/2 top-1/3 bg-slate-50 p-12 shadow-xl space-y-4 rounded-md">
						<span className="w-full text-left text-sm font-medium">Applying filter</span>
						<div className="w-full h-[20px] text-left bg-slate-200 p-1 rounded">
							<div
								style={{ width: `${readProgress * 100}%` }}
								className="bg-sky-400 h-full rounded"
							/>
						</div>
					</div>
				</div>
			)}
			<div className="flex flex-col grow overflow-hidden">
				<div className="flex flex-row items-center justify-between basis-20 shrink-0 grow-0 shadow-lg px-12 bg-slate-100">
					<div className="grow flex justify-between">
						<Search onSearch={setQuery} />
						<NewColumnButton onClick={onAddColumn} />
						<button
							className="h-[35px] inline-flex flex-row items-center hover:bg-slate-200 bg-slate-300 hover:bg-sky-400 shadow text-white font-medium px-2 py-1 rounded ml-2"
							onClick={onSettings}
						>
							<IoMdSettings className="text-2xl text-slate-500" />
						</button>
					</div>
				</div>
				<div className="flex flex-col basis-full grow-1 shrink-1 w-full max-w-full overflow-hidden justify-center bg-slate-200 px-12 py-8">
					<LogList
						logs={searchedLogs}
						columns={columns}
						renderKey={renderKey}
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
					<ColumnView column={selectedColumn} onChange={handleSetColumn} />
				</Drawer>
			)}
			{settingsOpen && (
				<Drawer title="Filter settings" onClose={onDeselect}>
					<FilterSettings
						filter={filter}
						filterString={predicateString}
						onChange={handleSetFilterConfig}
						onDelete={onDeleteFilter}
					/>
				</Drawer>
			)}
		</div>
	);
});
