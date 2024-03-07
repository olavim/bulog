import { createSimpleFormatter } from "@/hooks/useColumnUtils";
import JsonView from "@uiw/react-json-view";
import { FaClipboard, FaClipboardCheck } from "react-icons/fa";
import { MdAddCircle } from "react-icons/md";
import { v4 as uuidv4 } from 'uuid';

interface LogViewProps {
    log: LogData;
    onAddColumn: (id: string, data: Partial<ColumnData> | null) => void;
}

export default function LogView(props: LogViewProps) {
    const { log, onAddColumn } = props;
    return (
        <JsonView
            value={log}
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
                                onClick={() => onAddColumn(uuidv4(), {
                                    name: columnName,
                                    formatterString: createSimpleFormatter(columnPattern ? `log${columnPattern}` : 'log')
                                })}
                            />
                        </>
                    );
                }}
            />
        </JsonView>
    );
}