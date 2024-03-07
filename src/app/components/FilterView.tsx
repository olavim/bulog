import { useCallback, useEffect, useMemo, useState } from "react";
import { filter as liqeFilter, LiqeQuery } from 'liqe';
import Card from "./Card";
import LogList from "./LogList";
import useFilter from "@/hooks/useFilter";
import LogView from "./LogView";
import ColumnView from "./ColumnView";
import Drawer from "./Drawer";
import Search from "./Search";
import NewColumnButton from "./NewColumnButton";
import { IoMdSettings } from "react-icons/io";
import FilterSettings from "./FilterSettings";
import useLogs from "@/hooks/useLogs";
import { FilterConfigInput } from "@/context/FiltersContext";

interface FilterViewProps {
    filter: string;
}

export default function FilterView(props: FilterViewProps) {
    const { filter } = props;
    const { logs: allLogs } = useLogs();
    const { logs, setLogs, columns, setColumns, setColumn, filterString, filterFunction, setConfig, deleteFilter } = useFilter(filter);
    const [query, setQuery] = useState<LiqeQuery | null>(null);
    const [searchedLogs, setSearchedLogs] = useState<LogData[]>(logs);
    const [settingsOpen, setSettingOpen] = useState<boolean>(false);
    const [shouldReadLogs, setShouldReadLogs] = useState<boolean>(false);
    const [readProgress, setReadProgress] = useState<number | null>(null);
    const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
    const selectedColumn = useMemo(
        () => columns.find(c => c.id === selectedColumnId) ?? null,
        [columns, selectedColumnId]
    );

    const handleSetFilterConfig = useCallback((config: FilterConfigInput) => {
        setShouldReadLogs(true);
        setConfig(config);
    }, [setConfig]);

    const onDeleteFilter = useCallback(() => {
        setSettingOpen(false);
        deleteFilter();
    }, [deleteFilter]);

    useEffect(() => {
        if (!shouldReadLogs) {
            return;
        }

        setShouldReadLogs(false);
        setReadProgress(0);

        (async () => {
            await new Promise(resolve => setTimeout(resolve, 10));

            const filteredLogs = [];
            const predicate = filterFunction || ((arr) => arr.map(() => true));
            const chunkSize = Math.ceil(allLogs.length / 10);
            console.log('chunkSize', chunkSize);
            let processed = 0;

            while (processed < allLogs.length) {
                const newLogs = allLogs.slice(processed, processed + chunkSize);
                const predicates = await predicate(newLogs);
                const filtered = newLogs.filter((_, i) => predicates[i]);
                filteredLogs.push(...filtered);
                processed += chunkSize;

                setReadProgress(processed / allLogs.length);

                await new Promise(resolve => setTimeout(resolve, 0));
            }

            setLogs(filteredLogs);
            setReadProgress(null);
        })();
    }, [allLogs, setLogs, shouldReadLogs, filterFunction]);

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

    const onAddColumn = useCallback(async (id: string, data: Partial<ColumnData> | null) => {
        setSelectedColumnId(id);
        setSelectedLog(null);
        setSettingOpen(false);
        setColumn(id, data);
    }, [setColumn]);

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

    return (
        <div className="flex flex-row grow overflow-hidden">
            {readProgress !== null && allLogs.length > 10000 && (
                <div className="fixed z-10 flex items-center justify-center w-full h-full bg-black/25">
                    <div className="w-full max-w-[25%] flex flex-col items-center justify-center text-slate-500 left-1/2 top-1/3 bg-slate-50 p-12 shadow-xl space-y-4 rounded-md">
                        <span className="w-full text-left text-sm font-medium">Applying filter</span>
                        <div className="w-full h-[20px] text-left bg-slate-200 p-1 rounded">
                            <div style={{ width: `${readProgress * 100}%` }} className="bg-sky-400 h-full rounded" />
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
                    <Card className="grow h-full max-w-full">
                        <LogList
                            logs={searchedLogs}
                            columns={columns}
                            selectedLog={selectedLog}
                            selectedColumn={selectedColumn}
                            onSelectLog={onSelectLog}
                            onSelectColumn={onSelectColumn}
                            onChangeColumns={setColumns}
                        />
                    </Card>
                </div>
            </div>
            {selectedLog && (
                <Drawer title="Log details" onClose={onDeselect}>
                    <LogView log={selectedLog} onAddColumn={onAddColumn} />
                </Drawer>
            )}
            {selectedColumn && (
                <Drawer title="Column details" onClose={onDeselect}>
                    <ColumnView column={selectedColumn} onChange={setColumn} />
                </Drawer>
            )}
            {settingsOpen && (
                <Drawer title="Filter settings" onClose={onDeselect}>
                    <FilterSettings filter={filter} filterString={filterString} onChange={handleSetFilterConfig} onDelete={onDeleteFilter} />
                </Drawer>
            )}
        </div>
    );
}