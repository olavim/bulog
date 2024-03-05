import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import Log from "./Log";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import { InstancePlugin, OverlayScrollbars } from 'overlayscrollbars';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
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

function VirtuosoItem(props: React.HTMLAttributes<HTMLDivElement>) {
    return <div className="group" {...props} />;
}

const maxPlaceholderRenders = 5;

interface LogListProps {
    logs: LogData[];
    columns: LogColumnData[];
    selectedLog: LogData | null;
    selectedColumn: LogColumnData | null;
    onSelectLog: (log: LogData) => void;
    onSelectColumn: (log: LogColumnData) => void;
    onResizeColumn: (col: LogColumnData, newWidth: number) => void;
    onMoveColumn: (oldIndex: number, newIndex: number) => void;
}

export default function LogList(props: LogListProps) {
    const { logs, columns, selectedLog, selectedColumn, onSelectLog, onResizeColumn, onSelectColumn, onMoveColumn } = props;

    const rootRef = useRef<HTMLDivElement>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [logContainerSize, setLogContainerSize] = useState<{ width: number; height: number }>();
    const [dragColumn, setDragColumn] = useState<LogColumnData | null>(null);
    const [columnResizeData, setColumnResizeData] = useState<{ target: LogColumnData, origin: number; originalWidth: number } | null>(null);
    const [scroller, setScroller] = useState<HTMLElement | Window | null>(null);
    const [placeholderRenders, setPlaceholderRenders] = useState<JSONValue[][]>([]);
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

    useEffect(() => {
        (async () => {
            const logsToRender = logs.slice(0, maxPlaceholderRenders);
            const renders = await Promise.all(
                logsToRender.map(log => Promise.all(
                    columns.map(col => col.evalFn(log).then(val => val).catch(err => err))
                ))
            );
            setPlaceholderRenders(renders);
        })();
    }, [logs, columns]);

    const onResizeColumnStart = useCallback((col: LogColumnData, mouseX: number) => {
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
        onResizeColumn(target, newWidth);
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
        onMoveColumn(activeIdx, overIdx);
    }, [columns, onMoveColumn]);

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
                <Virtuoso
                    ref={virtuosoRef}
                    data={logs}
                    totalCount={logs.length + 1}
                    topItemCount={1}
                    scrollerRef={setScroller}
                    components={{ Item: VirtuosoItem }}
                    followOutput="smooth"
                    initialTopMostItemIndex={logs.length}
                    computeItemKey={index => index === 0 ? 'header' : logs[index - 1].id}
                    itemContent={(index, data) => index === 0 ? (
                        <div className="flex flex-row min-w-fit border-b bg-white h-[35px]">
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
                        </div>
                    ) : (
                        <Log
                            log={data}
                            columns={columns}
                            placeholderRender={placeholderRenders[index % placeholderRenders.length] ?? []}
                            onClick={onSelectLog}
                            selected={data.id === selectedLog?.id}
                        />
                    )}
                />
            </DndContext >
        </div>
    );
}
