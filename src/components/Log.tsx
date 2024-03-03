import { useCallback, useEffect, useState } from "react";
import { Fira_Code } from "next/font/google";
import { JSONValue, LogColumnData, LogData } from "@/types";
import LogCell from "./LogCell";

const fira = Fira_Code({ subsets: ["latin"] });

interface LogProps {
    log: LogData;
    selected: boolean;
    columns: LogColumnData[];
    columnWidths: number[];
    onClick: (log: LogData) => void;
}

function Log(props: LogProps) {
    const { onClick, log, selected, columns } = props;
    const [render, setRender] = useState<JSONValue[]>([]);

    useEffect(() => {
        (async () => {
            const render = await Promise.all(columns.map(col => col.evalFn(log).then(val => val).catch(err => err)));
            setRender(render);
        })();
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
}

export default Log;
