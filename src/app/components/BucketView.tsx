import { useCallback, useMemo, useState } from "react";
import { filter as liqeFilter, parse as liqeParse, SyntaxError as LiqeSyntaxError } from 'liqe';
import { MdAddCircle, MdCheckCircle, MdClose, MdRemoveCircle, MdSearch } from "react-icons/md";
import JsonView from "@uiw/react-json-view";
import { FaClipboard, FaClipboardCheck, FaQuestionCircle } from "react-icons/fa";
import Card from "./Card";
import LogList from "./LogList";
import { RiInsertColumnRight } from "react-icons/ri";
import ReactDOMServer from "react-dom/server";
import { createSimpleFormatter, useColumns, useLogs } from "@/context/buckets";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { v4 as uuidv4 } from 'uuid';
import { useSandbox } from "@/context/codeSandbox";
import { arrayMove } from "@dnd-kit/sortable";

const defaultFormatter = createSimpleFormatter();

interface BucketLogsProps {
    bucket: string;
}

export default function BucketLogs(props: BucketLogsProps) {
    const { bucket } = props;
    const logs = useLogs(bucket);
    const { columns, setColumns } = useColumns(bucket);

    const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<LogColumnData | null>(null);
    const [columnNameStr, setColumnNameStr] = useState<string>('');
    const [columnFormatterStr, setColumnFormatterStr] = useState<string>('');
    const [searchStr, setSearchStr] = useState<string>('');
    const { createFn } = useSandbox();

    const [filteredLogs, searchError] = useMemo(() => {
        if (searchStr === '') {
            return [logs, null];
        }

        try {
            const filtered = liqeFilter(liqeParse(searchStr), logs);
            return [filtered as LogData[], null];
        } catch (err) {
            if (err instanceof LiqeSyntaxError) {
                return [[] as LogData[], err.message];
            }

            return [logs, null];
        }
    }, [logs, searchStr]);

    const onAddEmptyColumn = useCallback(async () => {
        setSelectedColumn(columns[columns.length - 1]);
        setSelectedLog(null);

        const id = uuidv4();
        const name = 'New Column';
        const evalStr = defaultFormatter;

        setColumns([...columns, {
            id,
            name,
            width: 200,
            evalStr,
            evalFn: await createFn(id, defaultFormatter)
        }]);
        setColumnNameStr(name);
        setColumnFormatterStr(evalStr);
    }, [columns, setColumns, createFn]);

    const onAddColumn = useCallback(async (name: string, pattern: string, select: boolean) => {
        if (select) {
            setSelectedColumn(columns[columns.length - 1]);
            setSelectedLog(null);
        }

        const id = uuidv4();
        const evalStr = createSimpleFormatter(pattern ? `log${pattern}` : 'log');

        setColumns([...columns, {
            id,
            name,
            width: 200,
            evalStr,
            evalFn: await createFn(id, evalStr)
        }]);
    }, [columns, createFn, setColumns]);

    const onDeselect = useCallback(() => {
        setSelectedLog(null);
        setSelectedColumn(null);
    }, []);

    const onResizeColumn = useCallback((col: LogColumnData, newWidth: number) => {
        const cols = [...columns];
        const idx = cols.findIndex(c => c.id === col.id);
        cols[idx] = { ...cols[idx], width: Math.max(100, newWidth) };
        setColumns(cols);
    }, [columns, setColumns]);

    const onSelectLog = useCallback((log: LogData) => {
        setSelectedColumn(null);
        setSelectedLog(log);
    }, []);

    const onSaveSelectedColumn = useCallback(async () => {
        const cols = [...columns];
        const idx = cols.findIndex(col => col.id === selectedColumn?.id);
        cols[idx] = {
            ...cols[idx],
            name: columnNameStr,
            evalStr: columnFormatterStr,
            evalFn: await createFn(cols[idx].id, columnFormatterStr)
        };
        setColumns(cols);
    }, [columnFormatterStr, columnNameStr, columns, createFn, selectedColumn, setColumns]);

    const onDeleteSelectedColumn = useCallback(() => {
        const idx = columns.findIndex(col => col.id === selectedColumn?.id);
        const cols = columns.toSpliced(idx, 1);
        if (idx === 0) {
            cols[idx].width = columns[0].width + columns[1].width;
        } else {
            cols[idx - 1].width = columns[idx - 1].width + columns[idx].width;
        }

        setColumns(cols);
        setSelectedColumn(null);
    }, [columns, selectedColumn, setColumns]);

    const onSelectColumn = useCallback((col: LogColumnData) => {
        setSelectedColumn(col);
        setSelectedLog(null);
        setColumnNameStr(col.name);
        setColumnFormatterStr(col.evalStr);
    }, []);

    const onMoveColumn = useCallback((oldIndex: number, newIndex: number) => {
        setColumns(arrayMove(columns, oldIndex, newIndex));
    }, [columns, setColumns]);

    return (
        <div className="flex flex-row grow overflow-hidden">
            <div className="flex flex-col grow overflow-hidden">
                <div className="flex flex-row items-center justify-between basis-20 shrink-0 grow-0 shadow-lg">
                    <div className="flex grow bg-slate-100 h-full px-12 flex flex-row items-center">
                        <div className="grow flex justify-between">
                            <div className="flex grow items-center">
                                <span className="relative basis-60 shrink-0">
                                    <MdSearch className="absolute left-2 translate-y-[-50%] top-1/2 my-auto text-gray-500 text-xl" />
                                    <input
                                        type="text"
                                        value={searchStr}
                                        onChange={evt => setSearchStr(evt.target.value)}
                                        placeholder="Search..."
                                        data-error={searchError ?? undefined}
                                        className="w-full text-xs border border-gray-300 rounded py-2 pl-8 pr-1 text-gray-700 data-[error]:outline-red-500 data-[error]:outline-2"
                                    />
                                </span>
                                <a
                                    data-tooltip-id="tooltip"
                                    data-tooltip-html={ReactDOMServer.renderToStaticMarkup(
                                        <div className="text-sm">
                                            The search supports <a href="https://github.com/gajus/liqe#readme" rel="noreferrer noopener" target="_blank" className="font-semibold underline">Liqe</a> syntax
                                        </div>
                                    )}
                                    data-tooltip-variant="info"
                                    className="ml-4 cursor-pointer"
                                >
                                    <FaQuestionCircle className="text-sky-600 text-lg" />
                                </a>
                            </div>
                            <button
                                className="h-[35px] inline-flex flex-row items-center bg-sky-500 hover:bg-sky-400 text-white font-medium px-2 rounded shadow ml-2"
                                data-tooltip-id="tooltip"
                                data-tooltip-content="New column"
                                onClick={onAddEmptyColumn}
                            >
                                <RiInsertColumnRight className="text-2xl" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row basis-full grow-1 shrink-1 w-full max-w-full overflow-hidden justify-center bg-slate-200 px-12 py-8">
                    <Card className="grow h-full max-w-full">
                        <LogList
                            logs={filteredLogs}
                            columns={columns}
                            selectedLog={selectedLog}
                            selectedColumn={selectedColumn}
                            onSelectLog={onSelectLog}
                            onSelectColumn={onSelectColumn}
                            onResizeColumn={onResizeColumn}
                            onMoveColumn={onMoveColumn}
                        />
                    </Card>
                </div>
            </div>
            {(selectedLog || selectedColumn) && (
                <div className="basis-auto grow-0 shrink-0 max-h-full min-h-full overflow-hidden flex flex-col bg-white shadow-xl">
                    {selectedLog && (
                        <div className="flex flex-col px-4 w-[35rem] justify-items-center overflow-hidden">
                            <div className="flex px-2 basis-20 shrink-0 grow-0 items-center justify-between">
                                <h1 className="text-lg font-medium text-slate-600">{'Log details'}</h1>
                                <button className="p-2 rounded-full hover:bg-gray-200 cursor-pointer" onClick={onDeselect}>
                                    <MdClose className="text-xl text-slate-600" />
                                </button>
                            </div>
                            <div className="overflow-auto w-full items-start justify-between border-t font-mono flex py-6 px-2">
                                <JsonView
                                    value={selectedLog}
                                    displayDataTypes={false}

                                    className="grow"
                                >
                                    <JsonView.Copied<'svg'>
                                        render={({ style, onClick, ...props }, { keys }) => {
                                            const copied = (props as any)['data-copied'];
                                            const columnName = keys ? String(keys[keys.length - 1]) : 'log';
                                            const columnPattern = keys
                                                ? keys.map(k => /^[a-zA-Z][a-zA-Z0-9]*$/.test(String(k)) ? `.${k}` : `.['${k}']`).join('?')
                                                : '';
                                            return (
                                                <>
                                                    {!copied && <FaClipboard style={style} className="inline text-gray-500 hover:text-gray-400" onClick={onClick} />}
                                                    {copied && <FaClipboardCheck style={style} className="inline text-emerald-500" />}
                                                    <MdAddCircle
                                                        style={style}
                                                        className="inline text-gray-500 hover:text-gray-400"
                                                        onClick={() => onAddColumn(columnName, columnPattern, false)}
                                                    />
                                                </>
                                            );
                                        }}
                                    />
                                </JsonView>
                            </div>
                        </div>
                    )}
                    {selectedColumn && (
                        <div className="flex flex-col w-[35rem] px-4">
                            <div className="flex px-2 basis-20 shrink-0 grow-0 items-center justify-between">
                                <h1 className="text-lg font-medium text-slate-600">{'Column details'}</h1>
                                <button className="p-2 rounded-full hover:bg-gray-200 cursor-pointer" onClick={onDeselect}>
                                    <MdClose className="text-xl text-slate-600" />
                                </button>
                            </div>
                            <div className="items-start flex flex-col grow py-6 px-2 border-t space-y-4">
                                <div className="flex flex-col w-full space-y-2">
                                    <label htmlFor="column-name-input" className="text-xs text-gray-800 font-medium">{'Name'}</label>
                                    <input
                                        value={columnNameStr}
                                        onChange={evt => setColumnNameStr(evt.target.value)}
                                        id="column-name-input"
                                        className="text-xs basis-[35px] w-full border border-gray-300 shadow rounded py-1 px-3 text-gray-600"
                                    />
                                </div>
                                <div className="flex flex-col grow w-full space-y-2">
                                    <label htmlFor="column-pattern-input" className="text-xs text-gray-800 font-medium">{'Formatter'}</label>
                                    <CodeMirror
                                        className="basis-40 border rounded shadow p-2 outline-none"
                                        height="100%"
                                        extensions={[javascript()]}
                                        value={columnFormatterStr}
                                        onChange={setColumnFormatterStr}
                                        basicSetup={{
                                            lineNumbers: false,
                                            foldGutter: false,
                                            highlightActiveLineGutter: false
                                        }}
                                        onCreateEditor={view => {
                                            view.dom.style.outline = 'none';
                                        }}
                                    />
                                </div>
                                <div className="flex flex-row w-full justify-between pt-4">
                                    <button
                                        className="h-[30px] inline-flex flex-row items-center bg-sky-500 hover:bg-sky-400 disabled:bg-gray-300 text-sm text-white font-medium pl-3 pr-4 rounded shadow"
                                        onClick={onSaveSelectedColumn}
                                        disabled={columnNameStr === ''}
                                    >
                                        <MdCheckCircle className="mr-2" />
                                        <span className="mb-px">{"Save"}</span>
                                    </button>
                                    <button
                                        className="h-[30px] inline-flex flex-row items-center bg-red-500 hover:bg-red-400 text-sm text-white font-medium pl-3 pr-4 rounded shadow"
                                        onClick={onDeleteSelectedColumn}
                                    >
                                        <MdRemoveCircle className="mr-2" />
                                        <span className="mb-px">{"Delete"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}