import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableComponents, TableVirtuoso, VirtuosoHandle } from "react-virtuoso";
import Log from "./Log";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import { InstancePlugin, OverlayScrollbars } from 'overlayscrollbars';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import LogColumn, { LogColumnOverlay } from "./LogColumn";
import { useResizeDetector } from "react-resize-detector";
import useGlobalEvent from "beautiful-react-hooks/useGlobalEvent";

type ClickScrollEventDetails = { direction: 'horizontal' | 'vertical' };

const instantClickScrollPlugin: InstancePlugin<'instantClickScrollPlugin'> = {
    instantClickScrollPlugin: {
        instance: (osInstance, event) => {
            event('initialized', () => {
                osInstance.elements().scrollbarVertical.handle.addEventListener('pointerdown', () => {
                    const wp = osInstance.elements().viewport;
                    wp.dispatchEvent(new CustomEvent<ClickScrollEventDetails>('clickScroll', { detail: { direction: 'vertical' } }));
                });

                osInstance.elements().scrollbarHorizontal.handle.addEventListener('pointerdown', () => {
                    const wp = osInstance.elements().viewport;
                    wp.dispatchEvent(new CustomEvent<ClickScrollEventDetails>('clickScroll', { detail: { direction: 'horizontal' } }));
                });

                osInstance.elements().scrollbarVertical.track.addEventListener('pointerdown', evt => {
                    if (evt.target === osInstance.elements().scrollbarVertical.handle) {
                        return;
                    }

                    const wp = osInstance.elements().viewport;
                    const scrollbar = osInstance.elements().scrollbarVertical;

                    const trackHeight = scrollbar.track.offsetHeight;
                    const handleHeight = scrollbar.handle.offsetHeight;
                    const scrollRatio = (evt.offsetY - handleHeight / 2) / (trackHeight - handleHeight);
                    wp.scrollTo({ top: (wp.scrollHeight - wp.clientHeight) * scrollRatio });

                    scrollbar.handle.dispatchEvent(new PointerEvent('pointerdown', evt));
                    wp.dispatchEvent(new CustomEvent<ClickScrollEventDetails>('clickscroll', { detail: { direction: 'vertical' } }));
                });

                osInstance.elements().scrollbarHorizontal.track.addEventListener('pointerdown', evt => {
                    if (evt.target === osInstance.elements().scrollbarHorizontal.handle) {
                        return;
                    }

                    const wp = osInstance.elements().viewport;
                    const scrollbar = osInstance.elements().scrollbarHorizontal;

                    const trackWidth = scrollbar.track.offsetWidth;
                    const handleWidth = scrollbar.handle.offsetWidth;
                    const scrollRatio = (evt.offsetX - handleWidth / 2) / (trackWidth - handleWidth);
                    wp.scrollTo({ left: (wp.scrollWidth - wp.clientWidth) * scrollRatio });

                    scrollbar.handle.dispatchEvent(new PointerEvent('pointerdown', evt));
                    wp.dispatchEvent(new CustomEvent<ClickScrollEventDetails>('clickscroll', { detail: { direction: 'horizontal' } }));
                });
            });
        }
    }
};

OverlayScrollbars.plugin(instantClickScrollPlugin);

const VirtuosoTable: TableComponents<LogData>['Table'] = memo(props => {
    return (
        <table
            className="w-full border-box"
            style={{ width: '100%' }}
            {...props}
        />
    );
});

interface LogListProps {
    logs: LogData[];
    columns: ColumnData[];
    selectedLog: LogData | null;
    selectedColumn: ColumnData | null;
    onSelectLog: (log: LogData) => void;
    onSelectColumn: (log: ColumnData) => void;
    onChangeColumns: (columns: ColumnData[]) => void;
}

export default function LogList(props: LogListProps) {
    const { logs, columns, selectedLog, selectedColumn, onSelectLog, onChangeColumns, onSelectColumn } = props;

    const rootRef = useRef<HTMLDivElement>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [logContainerSize, setLogContainerSize] = useState<{ width: number; height: number }>();
    const [dragColumn, setDragColumn] = useState<ColumnData | null>(null);
    const [columnResizeData, setColumnResizeData] = useState<{ target: ColumnData, origin: number; originalWidth: number } | null>(null);
    const [scroller, setScroller] = useState<HTMLElement | Window | null>(null);
    const [initialize, osInstance] = useOverlayScrollbars({
        defer: false,
        options: {
            scrollbars: {
                clickScroll: true,
                autoHide: 'never'
            }
        }
    });

    const onMouseMove = useGlobalEvent<MouseEvent>('mousemove');
    const onMouseUp = useGlobalEvent<MouseEvent>('mouseup');

    const onLogContainerResize = useCallback((width?: number, height?: number) => {
        setLogContainerSize({ width: width ?? 0, height: height ?? 0 });
    }, []);

    useResizeDetector({
        targetRef: logContainerRef,
        onResize: onLogContainerResize
    });

    const onResizeColumnStart = useCallback((col: ColumnData, mouseX: number) => {
        if (!logContainerSize) {
            return;
        }

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        setColumnResizeData({ target: col, origin: mouseX, originalWidth: col.width });
    }, [logContainerSize]);

    onMouseUp(() => {
        document.body.style.cursor = "auto";
        document.body.style.userSelect = "auto";
        setColumnResizeData(null);
    });

    onMouseMove((evt: MouseEvent) => {
        if (!columnResizeData) {
            return;
        }

        const { target, origin, originalWidth } = columnResizeData;
        const newWidth = originalWidth + (evt.clientX - origin);

        const cols = [...columns];
        const idx = cols.findIndex(c => c.id === target.id);
        cols[idx] = { ...cols[idx], width: Math.max(100, newWidth) };
        onChangeColumns(cols);
    });

    useEffect(() => {
        const { current: root } = rootRef;
        if (scroller && root) {
            initialize({
                target: root,
                elements: {
                    viewport: scroller as HTMLElement
                }
            });
        }
        return () => osInstance()?.destroy();
    }, [scroller, initialize, osInstance]);

    const onDragStart = useCallback((evt: DragStartEvent) => {
        const activeId = evt.active?.id;
        setDragColumn(columns.find(col => col.id === activeId) ?? null);
    }, [columns]);

    const onDragEnd = useCallback((evt: DragEndEvent) => {
        const activeId = evt.active?.id;
        const overId = evt.over?.id;
        if (!activeId || !overId || activeId === overId) {
            return;
        }

        const activeIdx = columns.findIndex(col => col.id === activeId);
        const overIdx = columns.findIndex(col => col.id === overId);
        onChangeColumns(arrayMove(columns, activeIdx, overIdx));
    }, [columns, onChangeColumns]);

    const VirtuosoTableRow = useMemo(() => {
        const VirtuosoTableRow: TableComponents<LogData>['TableRow'] = props => {
            const { style, ...rest } = props;
            return (
                <tr
                    className="group font-['Fira_Code'] border-b last:border-b-0 border-box flex flex-row group min-w-fit h-[35px]"
                    style={{ ...style, height: 35 }}
                    onClick={() => onSelectLog(props.item)}
                    data-selected={props.item.id === selectedLog?.id ? true : undefined}
                    {...rest}
                />
            );
        };
        return VirtuosoTableRow;
    }, [onSelectLog, selectedLog?.id]);

    return (
        <div className="grow w-full max-w-full min-w-full flex flex-col px-1" ref={logContainerRef}>
            <DndContext
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                collisionDetection={closestCenter}
                autoScroll={{ threshold: { x: 0.2, y: 0 } }}
            >
                <DragOverlay>
                    {dragColumn && <LogColumnOverlay width={dragColumn.width} name={dragColumn.name} />}
                </DragOverlay>
                <div ref={rootRef} data-overlayscrollbars="" className="h-full overflow-visible" />
                <TableVirtuoso
                    ref={virtuosoRef}
                    data={logs}
                    totalCount={logs.length}
                    scrollerRef={setScroller}
                    width="100%"
                    components={{
                        Table: VirtuosoTable,
                        TableRow: VirtuosoTableRow
                    }}
                    followOutput="smooth"
                    overscan={{ main: 100, reverse: 100 }}
                    initialTopMostItemIndex={logs.length}
                    computeItemKey={(_, log) => log.id}
                    fixedHeaderContent={() => (
                        <tr className="flex flex-row min-w-fit border-b bg-white" style={{ height: 35 }}>
                            <SortableContext
                                items={columns.map(c => c.id)}
                                strategy={horizontalListSortingStrategy}
                                disabled={columnResizeData !== null}
                            >
                                {columns.map(col => (
                                    <LogColumn
                                        key={col.id}
                                        column={col}
                                        onClick={onSelectColumn}
                                        onResizeStart={onResizeColumnStart}
                                        resizing={columnResizeData !== null}
                                        selected={selectedColumn?.id === col.id}
                                    />
                                ))}
                            </SortableContext>
                        </tr>
                    )}
                    itemContent={(_, log) => <Log log={log} columns={columns} />}
                />
            </DndContext >
        </div>
    );
}
