import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { MouseEventHandler, useCallback } from 'react';
import { MdDragIndicator } from 'react-icons/md';

interface LogColumnOverlayProps {
	name: string;
	width: number;
}

export function LogColumnOverlay(props: LogColumnOverlayProps) {
	const { name, width } = props;

	return (
		<div
			className="cursor-grabbing uppercase text-xs group font-semibold flex text-left items-center text-slate-600 hover:text-slate-500 data-[selected]:hover:text-slate-600 border-y bg-slate-50 shadow"
			style={{ width: width + 3, height: 35 }}
		>
			<span className="h-full bg-clip-content">
				<span className="inline-block min-w-[1px] h-full border-x box-content" />
			</span>
			<div className="pl-6 grow flex items-center overflow-hidden">
				<div className="w-full text-ellipsis overflow-hidden">{name}</div>
				<div className="basis-auto shrink-0 grow-0 flex items-center">
					<span className="py-1 mr-1 rounded bg-slate-200">
						<MdDragIndicator className="text-lg text-slate-400" />
					</span>
				</div>
			</div>
			<span className="h-full bg-clip-content">
				<span className="inline-block min-w-[1px] h-full border-x box-content" />
			</span>
		</div>
	);
}

interface LogColumnProps {
	column: ColumnData;
	onClick: (column: ColumnData) => void;
	onResizeStart: (column: ColumnData, mouseX: number) => void;
	resizing: boolean;
	selected: boolean;
}

export default function LogColumn(props: LogColumnProps) {
	const { column, resizing, selected, onResizeStart, onClick } = props;

	const { attributes, listeners, setNodeRef, transform, transition, isDragging, isSorting } =
		useSortable({ id: column.id });

	const handleClick: MouseEventHandler<HTMLDivElement> = useCallback(() => {
		onClick(column);
	}, [column, onClick]);

	const handleDragStart: MouseEventHandler<HTMLSpanElement> = useCallback(
		(evt) => {
			onResizeStart(column, evt.clientX);
		},
		[column, onResizeStart]
	);

	return (
		<th
			className="group flex text-left items-center text-slate-600 hover:text-slate-500 p-0"
			data-resizing={resizing || undefined}
			data-selected={selected || undefined}
			data-cy="log-column-header"
			style={{
				flexGrow: 0,
				flexShrink: 0,
				flexBasis: column.width,
				width: column.width,
				backgroundColor: selected ? 'var(--slate-100)' : undefined,
				pointerEvents: resizing ? 'none' : undefined
			}}
		>
			<div
				ref={setNodeRef}
				className="h-full overflow-hidden whitespace-nowrap flex grow items-center text-xs font-semibold uppercase cursor-pointer group-data-[selected]:cursor-default"
				style={{
					transform: CSS.Translate.toString(transform),
					transition: isSorting ? transition : undefined,
					zIndex: isDragging ? 10 : undefined
				}}
				{...attributes}
				onClick={handleClick}
			>
				{isDragging && (
					<div className="h-full grow flex">
						<div className="h-full grow flex px-4 py-2">
							<div className="h-full grow bg-slate-100 rounded-md" />
						</div>
						<span className="pl-[2px] grow-0 h-full bg-clip-content cursor-col-resize">
							<span className="inline-block min-w-[1px] h-full border-x box-content" />
						</span>
					</div>
				)}
				{!isDragging && (
					<div className="h-full grow flex items-center hover:bg-slate-50 group-data-[selected]:hover:text-slate-600 group-data-[selected]:bg-slate-100 overflow-hidden">
						<div className="pl-6 pr-0 w-full text-ellipsis overflow-hidden">{column.name}</div>
						<div className="basis-auto shrink-0 grow-0 flex items-center">
							<button
								{...listeners}
								className="py-1 mr-1 rounded hover:bg-slate-200 cursor-grab"
								data-cy="drag-handle"
							>
								<MdDragIndicator className="text-lg text-slate-400" />
							</button>
						</div>
						<span
							className="pl-[2px] h-full bg-clip-content cursor-col-resize"
							onMouseDown={handleDragStart}
						>
							<span className="inline-block min-w-[1px] h-full border-x box-content" />
						</span>
					</div>
				)}
			</div>
		</th>
	);
}
