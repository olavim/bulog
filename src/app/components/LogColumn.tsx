import { MouseEventHandler, useCallback } from "react";

interface LogColumnProps {
    id: number;
    name: string;
    width: number;
    last: boolean;
    onClick: (id: number) => void;
    onResizeStart: (id: number, mouseX: number) => void;
    resizing: boolean;
    selected: boolean;
}

export default function LogColumn(props: LogColumnProps) {
    const { id, name, resizing, selected, width, last, onResizeStart, onClick } = props;

    const handleClick: MouseEventHandler<HTMLDivElement> = useCallback(() => {
        onClick(id);
    }, [id, onClick]);

    const handleDragStart: MouseEventHandler<HTMLSpanElement> = useCallback(evt => {
        onResizeStart(id, evt.clientX);
    }, [id, onResizeStart]);

    return (
        <div
            className="group flex pl-6 pr-0 text-left items-center data-[resizing]:pointer-events-none cursor-pointer hover:bg-slate-50 data-[selected]:bg-slate-100 data-[selected]:cursor-default text-slate-600 hover:text-slate-500 data-[selected]:hover:text-slate-600"
            data-resizing={resizing || undefined} data-selected={selected || undefined}
            onClick={handleClick}
            style={{
                flexGrow: last ? 1 : 0,
                flexShrink: 0,
                flexBasis: width,
                width
            }}
        >
            <div className="text-ellipsis overflow-hidden whitespace-nowrap flex-grow text-xs font-semibold uppercase">
                {name}
            </div>
            <span
                className="pl-[2px] group-last:pr-[2px] h-full bg-clip-content cursor-col-resize group-hover:inline group-data-[resizing]:inline"
                onMouseDown={handleDragStart}
            >
                <span className="inline-block min-w-[1px] h-full border-x box-content" />
            </span>
        </div>
    );
}