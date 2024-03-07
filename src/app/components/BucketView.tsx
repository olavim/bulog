import { useCallback, useEffect, useMemo, useState } from "react";
import { filter as liqeFilter, LiqeQuery } from 'liqe';
import Card from "./Card";
import LogList from "./LogList";
import useBucket from "@/hooks/useBucket";
import LogView from "./LogView";
import ColumnView from "./ColumnView";
import Drawer from "./Drawer";
import Search from "./Search";
import NewColumnButton from "./NewColumnButton";

interface BucketLogsProps {
    bucket: string;
}

export default function BucketLogs(props: BucketLogsProps) {
    const { bucket } = props;
    const { logs, columns, setColumn, setColumns } = useBucket(bucket);
    const [query, setQuery] = useState<LiqeQuery | null>(null);
    const [searchedLogs, setSearchedLogs] = useState<LogData[]>(logs);
    const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
    const selectedColumn = useMemo(
        () => columns.find(c => c.id === selectedColumnId) ?? null,
        [columns, selectedColumnId]
    );

    const onAddColumn = useCallback(async (id: string, data: Partial<ColumnData> | null) => {
        setSelectedColumnId(id);
        setSelectedLog(null);
        setColumn(id, data);
    }, [setColumn]);

    const onDeselect = useCallback(() => {
        setSelectedLog(null);
        setSelectedColumnId(null);
    }, []);

    const onSelectLog = useCallback((log: LogData) => {
        setSelectedColumnId(null);
        setSelectedLog(log);
    }, []);

    const onSelectColumn = useCallback((column: ColumnData) => {
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
        </div>
    );
}