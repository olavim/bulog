import { useCallback } from "react";
import { Fira_Code } from "next/font/google";
import get from 'lodash/get';
import { LogColumnData, LogData } from "@/types";

const fira = Fira_Code({ subsets: ["latin"] });

interface LogProps {
    log: LogData;
    selected: boolean;
    columns: LogColumnData[];
    columnWidths: number[];
    onClick: (log: LogData) => void;
}

function getElement(log: LogData, column: LogColumnData) {
    const value = column.pattern === '' ? log : get(log, column.pattern);

    const getClass = (className?: string) => `text-ellipsis overflow-hidden whitespace-nowrap text-xs ${className ?? ''}`;

    if (column.format) {
        return (
            <div className={getClass()}>
                <span>{column.format(value)}</span>
            </div>
        );
    }

    if (typeof value === 'object') {
        return (
            <div className={getClass("text-gray-500")}>
                <span>{JSON.stringify(value)}</span>
            </div>
        );
    }

    if (typeof value === 'string') {
        return (
            <div className={getClass("text-gray-800")}>
                <span>{value}</span>
            </div>
        );
    }

    if (typeof value === 'number') {
        return (
            <div className={getClass("text-sky-700")}>
                <span>{value}</span>
            </div>
        );
    }

    return (
        <div className={getClass()}>
            <span>{value}</span>
        </div>
    );
}

export default function Log(props: LogProps) {
    const { onClick, log, selected, columns } = props;

    const onClickLog = useCallback(() => {
        onClick(log);
    }, [onClick, log]);

    return (
        <div data-selected={selected || undefined} className={`${fira.className} border-b group-last:border-b-0 border-box flex flex-row group min-w-fit`} style={{ height: 35 }} onClick={onClickLog}>
            {columns.map((col, index) => (
                <div
                    key={index}
                    className="flex items-center overflow-hidden pl-6 pr-2 group-hover:bg-slate-50 group-data-[selected]:bg-slate-100"
                    style={{
                        flexGrow: index === columns.length - 1 ? 1 : 0,
                        flexShrink: 0,
                        flexBasis: props.columnWidths[index],
                        width: props.columnWidths[index]
                    }}
                >
                    {getElement(log, col)}
                </div>
            ))}
        </div>
    );
}