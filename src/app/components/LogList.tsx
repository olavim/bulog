import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TableComponents, TableVirtuoso, VirtuosoHandle } from 'react-virtuoso';
import Log from './Log';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import { InstancePlugin, OverlayScrollbars } from 'overlayscrollbars';
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	closestCenter
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import LogColumn, { LogColumnOverlay } from './LogColumn';
import { useResizeDetector } from 'react-resize-detector';
import useGlobalEvent from 'beautiful-react-hooks/useGlobalEvent';

type ClickScrollEventDetails = { direction: 'horizontal' | 'vertical' };

const instantClickScrollPlugin: InstancePlugin<'instantClickScrollPlugin'> = {
	instantClickScrollPlugin: {
		instance: (osInstance, event) => {
			event('initialized', () => {
				osInstance.elements().scrollbarVertical.handle.addEventListener('pointerdown', () => {
					const wp = osInstance.elements().viewport;
					wp.dispatchEvent(
						new CustomEvent<ClickScrollEventDetails>('clickScroll', {
							detail: { direction: 'vertical' }
						})
					);
				});

				osInstance.elements().scrollbarHorizontal.handle.addEventListener('pointerdown', () => {
					const wp = osInstance.elements().viewport;
					wp.dispatchEvent(
						new CustomEvent<ClickScrollEventDetails>('clickScroll', {
							detail: { direction: 'horizontal' }
						})
					);
				});

				osInstance.elements().scrollbarVertical.track.addEventListener('pointerdown', (evt) => {
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
					wp.dispatchEvent(
						new CustomEvent<ClickScrollEventDetails>('clickscroll', {
							detail: { direction: 'vertical' }
						})
					);
				});

				osInstance.elements().scrollbarHorizontal.track.addEventListener('pointerdown', (evt) => {
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
					wp.dispatchEvent(
						new CustomEvent<ClickScrollEventDetails>('clickscroll', {
							detail: { direction: 'horizontal' }
						})
					);
				});
			});
		}
	}
};

OverlayScrollbars.plugin(instantClickScrollPlugin);

const VirtuosoTable: TableComponents<LogData>['Table'] = memo((props) => {
	return <table className="w-full" {...props} />;
});

const VirtuosoTableRow: TableComponents<LogData>['TableRow'] = memo((props) => {
	const { style, context, ...rest } = props;
	const onClick = useCallback(
		() => (context as any).onSelectLog(props.item),
		[context, props.item]
	);
	return (
		<tr
			className="group font-['Fira_Code'] border-b last:border-b-0 border-box flex flex-row min-w-fit h-[35px]"
			style={{ ...style, height: 35 }}
			onClick={onClick}
			data-selected={props.item.id === (context as any).selectedLog?.id ? true : undefined}
			{...rest}
		/>
	);
});

interface LogListProps {
	logs: LogData[];
	columns: ColumnData[];
	renderKey?: number;
	logRenderer: (logs: LogData[]) => Promise<Array<{ [id: string]: JSONValue }>>;
	selectedLog: LogData | null;
	selectedColumn: ColumnData | null;
	onSelectLog: (log: LogData) => void;
	onSelectColumn: (log: ColumnData) => void;
	onChangeColumns: (columns: ColumnData[]) => void;
}

export default function LogList(props: LogListProps) {
	const {
		logs,
		columns,
		renderKey,
		logRenderer,
		selectedLog,
		selectedColumn,
		onSelectLog,
		onChangeColumns,
		onSelectColumn
	} = props;
	const [renders, setRenders] = useState<JSONValue[][]>([]);
	const [shouldRenderAll, setShouldRenderAll] = useState(false);
	const [renderInProgress, setRenderInProgress] = useState(false);

	useEffect(() => {
		setRenderInProgress(false);
		setShouldRenderAll(true);
	}, [logRenderer]);

	useEffect(() => {
		setShouldRenderAll(true);
	}, [renderKey]);

	useEffect(() => {
		if (!shouldRenderAll || renderInProgress) {
			return;
		}

		setRenderInProgress(true);
		setShouldRenderAll(false);
		setRenders([]);

		(async () => {
			const maxChunk = 1000;
			const newRenders: JSONValue[][] = [];

			while (newRenders.length < logs.length) {
				await new Promise((resolve) => setTimeout(resolve, 0));
				const renderGroups = await logRenderer(
					logs.slice(newRenders.length, newRenders.length + maxChunk)
				);
				newRenders.push(...renderGroups.map((group) => columns.map((col) => group[col.id])));
				setRenders(newRenders);
			}

			setRenderInProgress(false);
		})();
	}, [columns, logRenderer, logs, renderInProgress, shouldRenderAll]);

	useEffect(() => {
		if (shouldRenderAll || renders.length >= logs.length || renderInProgress) {
			return;
		}

		setRenderInProgress(true);

		(async () => {
			const renderGroups = await logRenderer(logs.slice(renders.length));
			setRenders([...renders, ...renderGroups.map((group) => columns.map((col) => group[col.id]))]);

			setRenderInProgress(false);
		})();
	}, [columns, logRenderer, logs, renderInProgress, renders, renders.length, shouldRenderAll]);

	const rootRef = useRef<HTMLDivElement>(null);
	const virtuosoRef = useRef<VirtuosoHandle>(null);
	const logContainerRef = useRef<HTMLDivElement>(null);
	const [logContainerSize, setLogContainerSize] = useState<{ width: number; height: number }>();
	const [dragColumn, setDragColumn] = useState<ColumnData | null>(null);
	const [columnResizeData, setColumnResizeData] = useState<{
		target: ColumnData;
		origin: number;
		originalWidth: number;
	} | null>(null);
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

	const onResizeColumnStart = useCallback(
		(col: ColumnData, mouseX: number) => {
			if (!logContainerSize) {
				return;
			}

			document.body.style.cursor = 'col-resize';
			document.body.style.userSelect = 'none';

			setColumnResizeData({ target: col, origin: mouseX, originalWidth: col.width });
		},
		[logContainerSize]
	);

	onMouseUp(() => {
		document.body.style.cursor = 'auto';
		document.body.style.userSelect = 'auto';
		setColumnResizeData(null);
	});

	onMouseMove((evt: MouseEvent) => {
		if (!columnResizeData) {
			return;
		}

		const { target, origin, originalWidth } = columnResizeData;
		const newWidth = originalWidth + (evt.clientX - origin);

		const cols = [...columns];
		const idx = cols.findIndex((c) => c.id === target.id);
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

	const onDragStart = useCallback(
		(evt: DragStartEvent) => {
			const activeId = evt.active?.id;
			setDragColumn(columns.find((col) => col.id === activeId) ?? null);
		},
		[columns]
	);

	const onDragEnd = useCallback(
		(evt: DragEndEvent) => {
			const activeId = evt.active?.id;
			const overId = evt.over?.id;
			if (!activeId || !overId || activeId === overId) {
				return;
			}

			const activeIdx = columns.findIndex((col) => col.id === activeId);
			const overIdx = columns.findIndex((col) => col.id === overId);
			setRenders((renders) => renders.map((render) => arrayMove(render, activeIdx, overIdx)));
			onChangeColumns(arrayMove(columns, activeIdx, overIdx));
		},
		[columns, onChangeColumns]
	);

	const getFixedHeaderContent = useCallback(
		() => (
			<tr className="flex flex-row min-w-fit border-b bg-white" style={{ height: 35 }}>
				<SortableContext
					items={columns.map((col) => col.id)}
					strategy={horizontalListSortingStrategy}
					disabled={columnResizeData !== null}
				>
					{columns.map((col) => (
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
		),
		[columnResizeData, columns, onResizeColumnStart, onSelectColumn, selectedColumn?.id]
	);

	const getItemContent = useCallback(
		(index: number, log: LogData) => (
			<Log
				prerender={renders[index]}
				log={log}
				columns={columns}
				renderer={logRenderer}
				last={index === logs.length - 1}
			/>
		),
		[columns, logRenderer, logs.length, renders]
	);

	const computeItemKey = useCallback((_: number, log: LogData) => log.id, []);

	const virtuosoContext = useMemo(
		() => ({
			selectedLog,
			onSelectLog
		}),
		[selectedLog, onSelectLog]
	);

	const virtuosoComponents: TableComponents<LogData, unknown> = useMemo(
		() => ({
			Table: VirtuosoTable,
			TableRow: VirtuosoTableRow
		}),
		[]
	);

	return (
		<div className="grow w-full max-w-full min-w-full flex flex-col" ref={logContainerRef}>
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
					context={virtuosoContext}
					data={logs}
					totalCount={logs.length}
					scrollerRef={setScroller}
					className="bg-white rounded"
					width="100%"
					components={virtuosoComponents}
					followOutput="auto"
					initialTopMostItemIndex={logs.length}
					computeItemKey={computeItemKey}
					fixedHeaderContent={getFixedHeaderContent}
					itemContent={getItemContent}
				/>
			</DndContext>
		</div>
	);
}
