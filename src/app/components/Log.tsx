import LogCell from "./LogCell";

interface LogProps {
    log: LogData;
    columns: ColumnData[];
}

function Log(props: LogProps) {
    const { log, columns } = props;

    return (
        <>
            {columns.map((col, index) => (
                <LogCell
                    key={index}
                    log={log}
                    column={col}
                    grow={index === columns.length - 1}
                />
            ))}
        </>
    );
}

export default Log;
