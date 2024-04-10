import { useCallback, useState } from 'react';
import { MdAddCircleOutline } from 'react-icons/md';
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	closestCenter
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createColumn } from '@app/utils/columns';
import { ColumnListItem } from './ColumnListItem';
import { ColumnListItemOverlay } from './ColumnListItemOverlay';

interface ColumnListProps {
	columns: ColumnConfig[];
	onChange: (columns: ColumnConfig[]) => void;
}

export function ColumnList(props: ColumnListProps) {
	const { columns, onChange } = props;
	const [columnExpanded, setColumnExpanded] = useState<Record<string, boolean>>({});
	const [dragColumn, setDragColumn] = useState<ColumnConfig | null>(null);

	const onDragColumnStart = useCallback(
		(evt: DragStartEvent) => {
			setDragColumn(columns.find((col) => col.id === evt.active?.id) ?? null);
		},
		[columns]
	);

	const onDragColumnEnd = useCallback(
		(evt: DragEndEvent) => {
			const activeId = evt.active?.id as string;
			const overId = evt.over?.id as string;

			if (!activeId || !overId || activeId === overId) {
				return;
			}

			const activeIdx = columns.findIndex((col) => col.id === activeId);
			const overIdx = columns.findIndex((col) => col.id === overId);

			onChange(arrayMove(columns, activeIdx, overIdx));
		},
		[columns, onChange]
	);

	const onChangeColumn = useCallback(
		(column: ColumnConfig) => {
			onChange(columns.map((col) => (col.id === column.id ? column : col)));
		},
		[columns, onChange]
	);

	const onDeleteColumn = useCallback(
		(columnId: string) => {
			onChange(columns.filter((col) => col.id !== columnId));
		},
		[columns, onChange]
	);

	const onAddColumn = useCallback(() => {
		onChange([...columns, createColumn()]);
	}, [columns, onChange]);

	const onChangeColumnExpanded = useCallback((columnId: string, expanded: boolean) => {
		setColumnExpanded((prev) => ({
			...prev,
			[columnId]: expanded
		}));
	}, []);

	return (
		<DndContext
			onDragStart={onDragColumnStart}
			onDragEnd={onDragColumnEnd}
			collisionDetection={closestCenter}
			autoScroll={{ threshold: { x: 0, y: 0.2 } }}
		>
			<DragOverlay>
				{dragColumn && (
					<ColumnListItemOverlay column={dragColumn} expanded={columnExpanded[dragColumn.id]} />
				)}
			</DragOverlay>
			<div className="space-y-2">
				<SortableContext
					items={columns.map((col) => col.id)}
					strategy={verticalListSortingStrategy}
				>
					{columns.map((column) => (
						<ColumnListItem
							key={column.id}
							column={column}
							expanded={columnExpanded[column.id] || false}
							onSetExpanded={onChangeColumnExpanded}
							onChange={onChangeColumn}
							onDelete={onDeleteColumn}
						/>
					))}
				</SortableContext>
				<div
					className="h-7 grow flex items-center justify-start text-slate-500 hover:text-sky-500 cursor-pointer"
					data-cy="new-filter-button"
					onClick={onAddColumn}
				>
					<MdAddCircleOutline className="text-lg" />
					<span className="text-xs font-normal ml-2">{'Add column'}</span>
				</div>
			</div>
		</DndContext>
	);
}
