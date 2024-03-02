import { memo, useCallback, useEffect, useState } from "react";
import { Fira_Code } from "next/font/google";
import { JSONValue, LogColumnData, LogData, RenderedLog } from "@/types";

const fira = Fira_Code({ subsets: ["latin"] });

interface LogProps {
    log: LogData;
    selected: boolean;
    columns: LogColumnData[];
    columnWidths: number[];
    onClick: (log: LogData) => void;
}

interface LogCellProps {
    value: JSONValue;
    width: number;
    grow: boolean;
}

const getElementClass = (className?: string) => `text-ellipsis overflow-hidden whitespace-nowrap text-xs ${className ?? ''}`;

function getElement(value: JSONValue) {
    try {
        if (value instanceof Error) {
            throw value;
        }

        if (typeof value === 'object') {
            return (
                <div className={getElementClass("text-gray-500")}>
                    <span>{JSON.stringify(value)}</span>
                </div>
            );
        }

        if (typeof value === 'string') {
            return (
                <div className={getElementClass("text-gray-800")}>
                    <span>{value}</span>
                </div>
            );
        }

        if (typeof value === 'number') {
            return (
                <div className={getElementClass("text-sky-700")}>
                    <span>{value}</span>
                </div>
            );
        }

        return (
            <div className={getElementClass()}>
                <span>{value}</span>
            </div>
        );
    } catch (err: any) {
        return (
            <div className={getElementClass()}>
                <span className="text-red-700">Formatter error: </span>
                <span className="text-gray-600">{err.message}</span>
            </div>
        );
    }
}

function LogCell(props: LogCellProps) {
    const { value, width, grow } = props;
    const [element, setElement] = useState<JSX.Element | null>(null);

    return (
        <div
            className="flex items-center overflow-hidden pl-6 pr-2 group-hover:bg-slate-50 group-data-[selected]:bg-slate-100"
            style={{
                flexGrow: grow ? 1 : 0,
                flexShrink: 0,
                flexBasis: width,
                width
            }}
        >
            {getElement(value)}
        </div>
    );
}

const Log = memo(function Log(props: LogProps) {
    const { onClick, log, selected, columns } = props;
    const [render, setRender] = useState<JSONValue[]>([]);

    useEffect(() => {
        Promise.all(columns.map(col => col.evalFn(log).then(val => val).catch(err => err))).then(setRender);
    }, [log, columns]);

    const onClickLog = useCallback(() => {
        onClick(log);
    }, [onClick, log]);

    return (
        <div data-selected={selected || undefined} className={`${fira.className} border-b group-last:border-b-0 border-box flex flex-row group min-w-fit`} style={{ height: 35 }} onClick={onClickLog}>
            {render.map((value, index) => (
                <LogCell
                    key={index}
                    value={value}
                    width={props.columnWidths[index]}
                    grow={index === columns.length - 1}
                />
            ))}
        </div>
    );
});

export default Log;
