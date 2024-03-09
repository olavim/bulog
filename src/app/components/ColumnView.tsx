import { javascript } from "@codemirror/lang-javascript";
import { useCallback, useEffect, useState } from "react";
import { MdCheckCircle, MdRemoveCircle } from "react-icons/md";
import CodeMirror from '@uiw/react-codemirror';

interface ColumnViewProps {
    column: ColumnData;
    onChange: (id: string, data: ColumnData | null) => void;
}

export default function ColumnView(props: ColumnViewProps) {
    const { column, onChange } = props;
    const [nameStr, setColumnNameStr] = useState('');
    const [formatterStr, setColumnFormatterStr] = useState('');

    useEffect(() => {
        setColumnNameStr(column.name);
    }, [column.name]);

    useEffect(() => {
        setColumnFormatterStr(column.formatterString);
    }, [column.formatterString]);

    const handleSave = useCallback(() => {
        (async () => {
            onChange(column.id, {
                ...column,
                name: nameStr,
                formatterString: formatterStr
            });
        })();
    }, [onChange, column, nameStr, formatterStr]);

    const handleDelete = useCallback(() => {
        onChange(column.id, null);
    }, [onChange, column]);

    return (
        <div className="w-full items-start flex flex-col grow space-y-4">
            <div className="flex flex-col w-full space-y-2">
                <label htmlFor="column-name-input" className="text-xs text-gray-800 font-medium">{'Name'}</label>
                <input
                    value={nameStr}
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
                    value={formatterStr}
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
                    onClick={handleSave}
                    disabled={nameStr === ''}
                >
                    <MdCheckCircle className="mr-2" />
                    <span className="mb-px">{"Save"}</span>
                </button>
                <button
                    className="h-[30px] inline-flex flex-row items-center bg-red-500 hover:bg-red-400 text-sm text-white font-medium pl-3 pr-4 rounded shadow"
                    onClick={handleDelete}
                >
                    <MdRemoveCircle className="mr-2" />
                    <span className="mb-px">{"Delete"}</span>
                </button>
            </div>
        </div>
    );
}