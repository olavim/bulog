import { LogColumnData, LogData, RenderedLog } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import Log from "./Log";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import { InstancePlugin, OverlayScrollbars } from 'overlayscrollbars';

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

interface LogListProps {
    logs: RenderedLog[];
    selectedLog: LogData | null;
    columns: LogColumnData[];
    columnWidths: number[];
    onSelectLog: (log: RenderedLog) => void;
    onScroll: (scrollLeft: number, scrollTop: number) => void;
}

function VirtuosoItem(props: React.HTMLAttributes<HTMLDivElement>) {
    return <div className="group" {...props} />;
}

export default function LogList(props: LogListProps) {
    const { logs, columns, columnWidths, onSelectLog, onScroll, selectedLog } = props;

    const rootRef = useRef<HTMLDivElement>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [scroller, setScroller] = useState<HTMLElement | Window | null>(null);
    const [initialize, osInstance] = useOverlayScrollbars({
        defer: true,
        options: {
            scrollbars: {
                clickScroll: true,
                autoHide: 'never'
            }
        }
    });

    const handleScroll = useCallback((evt: React.UIEvent<HTMLElement>) => {
        const target = evt.target as HTMLElement;
        onScroll(target.scrollLeft, target.scrollTop);
    }, [onScroll]);

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

    const renderItem = useCallback((index: number, renderedLog: RenderedLog) => {
        return (
            <Log
                log={renderedLog}
                columns={columns}
                columnWidths={columnWidths}
                onClick={onSelectLog}
                selected={renderedLog.log.id === selectedLog?.id}
            />
        );
    }, [columnWidths, columns, onSelectLog, selectedLog]);

    return (
        <>
            <div ref={rootRef} data-overlayscrollbars="" className="h-full overflow-visible" />
            <Virtuoso
                ref={virtuosoRef}
                data={logs}
                scrollerRef={setScroller}
                components={{ Item: VirtuosoItem }}
                followOutput={'smooth'}
                initialTopMostItemIndex={logs.length - 1}
                onScroll={handleScroll}
                itemContent={renderItem}
            />
        </>
    );
}