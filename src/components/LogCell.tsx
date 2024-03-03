import { JSONValue } from "@/types";

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

interface LogCellProps {
    value: JSONValue;
    width: number;
    grow: boolean;
}

export default function LogCell(props: LogCellProps) {
    const { value, width, grow } = props;

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
