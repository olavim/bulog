import { useCallback, useMemo, useRef, useState } from "react";
import { filter as liqeFilter, parse as liqeParse, SyntaxError as LiqeSyntaxError } from 'liqe';
import { useResizeDetector } from "react-resize-detector";
import useGlobalEvent from "beautiful-react-hooks/useGlobalEvent";
import { MdAddCircle, MdCheckCircle, MdClose, MdRemoveCircle, MdSearch } from "react-icons/md";
import JsonView from "@uiw/react-json-view";
import { FaClipboard, FaClipboardCheck, FaQuestionCircle } from "react-icons/fa";
import Card from "./Card";
import LogList from "./LogList";
import LogColumn from "./LogColumn";
import { RiInsertColumnRight } from "react-icons/ri";
import ReactDOMServer from "react-dom/server";
import { createSimpleFormatter, useColumns, useLogs } from "@/context/buckets";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { v4 as uuidv4 } from 'uuid';
import { useSandbox } from "@/context/codeSandbox";

const defaultFormatter = createSimpleFormatter();

interface BucketLogsProps {
    bucket: string;
}

export default function BucketLogs(props: BucketLogsProps) {
    const { bucket } = props;
    const logs = useLogs(bucket);
    const { columns, setColumns } = useColumns(bucket);

    const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<number>(-1);
    const [scrollLeft, setScrollLeft] = useState<number>(0);
    const [columnResizeData, setColumnResizeData] = useState<{ target: number, origin: number; originalWidth: number }>();
    const [logContainerSize, setLogContainerSize] = useState<{ width: number; height: number }>();
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

    const logContainerRef = useRef<HTMLDivElement>(null);

    const onMouseMove = useGlobalEvent<MouseEvent>('mousemove');
    const onMouseUp = useGlobalEvent<MouseEvent>('mouseup');

    const onLogContainerResize = useCallback((width?: number, height?: number) => {
        setLogContainerSize({ width: width ?? 0, height: height ?? 0 });
    }, []);

    const onScroll = useCallback((scrollLeft: number) => {
        setScrollLeft(scrollLeft);
    }, []);

    const onAddEmptyColumn = useCallback(async () => {
        setSelectedColumn(columns.length);
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
            setSelectedColumn(columns.length);
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

    useResizeDetector({
        targetRef: logContainerRef,
        onResize: onLogContainerResize
    });

    onMouseUp(() => {
        if (columnResizeData && logContainerSize) {
            const widthSum = columns.reduce((acc, col) => acc + col.width, 0);
            if (widthSum <= logContainerSize.width && columns[columns.length - 1].width > 200) {
                const cols = [...columns];
                cols[cols.length - 1].width = 200;
                setColumns(cols);
            }
        }

        document.body.style.cursor = "auto";
        document.body.style.userSelect = "auto";
        setColumnResizeData(undefined);
    });

    onMouseMove((evt: MouseEvent) => {
        if (!columnResizeData) {
            return;
        }

        const { target, origin, originalWidth } = columnResizeData;

        const cols = [...columns];
        const newWidth = originalWidth + (evt.clientX - origin);

        cols[target].width = Math.max(100, newWidth);
        setColumns(cols);
    });

    const onDeselect = useCallback(() => {
        setSelectedLog(null);
        setSelectedColumn(-1);
    }, []);

    const onResizeColumnStart = useCallback((id: number, mouseX: number) => {
        if (!logContainerSize) {
            return;
        }

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        const widthSum = columns.reduce((acc, col) => acc + col.width, 0);
        const actualWidth = widthSum <= logContainerSize.width && id === columns.length - 1
            ? logContainerSize.width - widthSum + columns[id].width
            : columns[id].width;
        setColumnResizeData({ target: id, origin: mouseX, originalWidth: actualWidth });
    }, [columns, logContainerSize]);

    const onSelectLog = useCallback((log: LogData) => {
        setSelectedColumn(-1);
        setSelectedLog(log);
    }, []);

    const onSaveSelectedColumn = useCallback(async () => {
        const cols = [...columns];
        cols[selectedColumn] = {
            ...cols[selectedColumn],
            name: columnNameStr,
            evalStr: columnFormatterStr,
            evalFn: await createFn(cols[selectedColumn].id, columnFormatterStr)
        };
        setColumns(cols);
    }, [columnFormatterStr, columnNameStr, columns, createFn, selectedColumn, setColumns]);

    const onDeleteSelectedColumn = useCallback(() => {
        const cols = columns.toSpliced(selectedColumn, 1);
        if (selectedColumn === 0) {
            cols[selectedColumn].width = columns[0].width + columns[1].width;
        } else {
            cols[selectedColumn].width = columns[selectedColumn - 1].width + columns[selectedColumn].width;
        }

        setColumns(cols);
        setSelectedColumn(-1);
    }, [columns, selectedColumn, setColumns]);

    const onSelectColumn = useCallback((id: number) => {
        setSelectedColumn(id);
        setSelectedLog(null);
        setColumnNameStr(columns[id].name);
        setColumnFormatterStr(columns[id].evalStr);
    }, [columns]);

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
                                className="h-[35px] inline-flex flex-row items-center bg-sky-500 hover:bg-sky-400 text-white font-medium pl-2 pr-4 rounded shadow ml-2"
                                onClick={onAddEmptyColumn}
                            >
                                <RiInsertColumnRight className="mr-2 text-2xl" />
                                <span className="text-sm mb-px">{'Add column'}</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row basis-full grow-1 shrink-1 w-full max-w-full overflow-hidden justify-center bg-slate-200 px-12 py-8">
                    <Card className="grow h-full max-w-full">
                        <div className="grow w-full max-w-full min-w-full flex flex-col" ref={logContainerRef}>
                            <div className="flex flex-col max-w-full overflow-hidden border-b">
                                <div
                                    className="flex flex-row min-w-fit max-w-full overflow-hidden shrink-0 grow-0 h-[35px]"
                                    style={{
                                        position: 'relative',
                                        left: -scrollLeft
                                    }}
                                >
                                    {columns.map((col, index) => (
                                        <LogColumn
                                            key={index}
                                            id={index}
                                            width={columns[index].width}
                                            last={index === columns.length - 1}
                                            name={col.name}
                                            onClick={onSelectColumn}
                                            onResizeStart={onResizeColumnStart}
                                            resizing={columnResizeData?.target === index}
                                            selected={selectedColumn === index}
                                        />
                                    ))}
                                </div>
                            </div>
                            <LogList
                                logs={filteredLogs}
                                onScroll={onScroll}
                                columns={columns}
                                onSelectLog={onSelectLog}
                                selectedLog={selectedLog}
                            />
                        </div>
                    </Card>
                </div>
            </div>
            {(selectedLog || selectedColumn !== -1) && (
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
                    {selectedColumn !== -1 && (
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