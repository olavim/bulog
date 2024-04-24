import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { filter as liqeFilter, LiqeQuery } from 'liqe';
import { LogList } from './LogList';
import { LogView } from './LogView';
import { ColumnSettings } from './settings/ColumnSettings';
import { Drawer } from './Drawer';
import { Search } from './Search';
import { NewColumnButton } from './NewColumnButton';
import { IoMdSettings } from 'react-icons/io';
import { FilterSettings } from './settings/FilterSettings';
import { useSandbox } from '@app/hooks/useSandbox';
import { globalStore } from '@app/stores/globalStore';
import { createColumn, deleteColumn } from '@app/utils/columns';
import { LogData, ColumnConfig } from '@/types';

interface FilterViewProps {
	filterId: string;
}

export const FilterView = memo(function FilterView(props: FilterViewProps) {
	const { filterId } = props;

	const sandbox = useSandbox();
	const filterStore = globalStore.use((state) => state.filters.get(filterId)!);
	const logs = filterStore.use((state) => state.data.logs);
	const columns = filterStore.use((state) => state.data.columns);
	const filterPredicateString = filterStore.use((state) => state.data.predicateString);
	const filterName = filterStore.use((state) => state.data.name);
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
		(id: string, name: string, predicateString: string) => {
			setPredicate(predicateString, sandbox);
			rename(id, name);
		},
		[setPredicate, sandbox, rename]
	);

	const onDeleteFilter = useCallback(() => {
		setSettingOpen(false);
		deleteFilter(filterId);
	}, [deleteFilter, filterId]);

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

	const onAddColumn = useCallback(() => {
		const newColumn = createColumn();
		setSelectedColumnId(newColumn.id);
		setSelectedLog(null);
		setSettingOpen(false);
		setColumns([...columns, newColumn], sandbox);
	}, [columns, sandbox, setColumns]);

	const onAddColumnWithConfig = useCallback(
		(config: Partial<ColumnConfig>) => {
			const newColumn = createColumn(config);
			setSelectedColumnId(newColumn.id);
			setSelectedLog(null);
			setColumns([...columns, newColumn], sandbox);
		},
		[columns, sandbox, setColumns]
	);

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

	const onSelectColumn = useCallback((column: ColumnConfig) => {
		setSelectedColumnId(column.id);
		setSelectedLog(null);
		setSettingOpen(false);
	}, []);

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
		async (id: string) => {
			const newColumns = deleteColumn(columns, id);
			setColumns(newColumns, sandbox);
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
							data-cy="filter-settings-button"
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
					<LogView
						log={selectedLog}
						columns={columns}
						logRenderer={logRenderer}
						onAddColumn={onAddColumnWithConfig}
					/>
				</Drawer>
			)}
			{selectedColumn && (
				<Drawer title="Column details" onClose={onDeselect}>
					<div className="w-full px-6">
						<ColumnSettings
							column={selectedColumn}
							onChange={handleSetColumn}
							onDelete={handleDeleteColumn}
						/>
					</div>
				</Drawer>
			)}
			{settingsOpen && (
				<Drawer title="Filter settings" onClose={onDeselect}>
					<div className="w-full px-6">
						<FilterSettings
							id={filterId}
							name={filterName}
							predicateString={filterPredicateString}
							onSave={handleSetFilterConfig}
							onDelete={onDeleteFilter}
						/>
					</div>
				</Drawer>
			)}
		</div>
	);
});
