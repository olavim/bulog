import { MouseEventHandler, useCallback } from 'react';
import { ColumnSettings } from './ColumnSettings';
import { MdDeleteForever, MdDragIndicator } from 'react-icons/md';
import { useSortable } from '@dnd-kit/sortable';

interface ColumnListItemProps {
	column: ColumnConfig;
	expanded: boolean;
	onSetExpanded?: (id: string, expanded: boolean) => void;
	onChange?: (config: ColumnConfig) => void;
	onDelete?: (id: string) => void;
}

export function ColumnListItem(props: ColumnListItemProps) {
	const { column, expanded, onChange, onDelete, onSetExpanded } = props;

	const toggleExpanded = useCallback(() => {
		onSetExpanded?.(column.id, !expanded);
	}, [column.id, expanded, onSetExpanded]);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: column.id
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { role, ...rest } = attributes;

	const handleDelete: MouseEventHandler<HTMLButtonElement> = useCallback(
		(evt) => {
			evt.stopPropagation();
			onDelete?.(column.id);
		},
		[onDelete, column.id]
	);

	return (
		<div
			ref={setNodeRef}
			className="flex flex-col items-center relative"
			data-cy="config-column"
			{...rest}
			style={{
				transform: `translate(${transform?.x ?? 0}px, ${transform?.y ?? 0}px)`,
				transition
			}}
		>
			<div
				className="flex flex-col w-full border rounded overflow-hidden relative"
				style={{ borderWidth: isDragging ? 0 : 1, padding: isDragging ? 1 : 0 }}
			>
				<div
					className="absolute left-0 top-0 w-full h-full bg-slate-100 z-[100] pointer-events-none"
					style={{ opacity: isDragging ? 1 : 0 }}
				/>
				<div
					className="h-9 flex items-center w-full px-2 bg-gray-50 justify-between cursor-pointer hover:bg-gray-50/50 active:bg-white"
					onClick={toggleExpanded}
				>
					<div className="flex items-center">
						<button
							{...listeners}
							className="py-1 rounded hover:bg-slate-200 cursor-grab active:cursor-grabbing"
							data-cy="drag-handle"
						>
							<MdDragIndicator className="text-lg text-slate-400" />
						</button>
						<span className="ml-2 relative font-medium text-xs text-slate-600">{column.name}</span>
					</div>
					<button
						className="h-7 w-7 flex items-center justify-center rounded-full text-red-400 hover:bg-slate-200 active:text-red-300 cursor-pointer"
						data-cy="delete-column-button"
						onClick={handleDelete}
					>
						<MdDeleteForever className="text-lg" />
					</button>
				</div>
				{expanded && (
					<div className="bg-white w-full flex p-4 border-t">
						<ColumnSettings column={column} onChange={onChange} />
					</div>
				)}
			</div>
		</div>
	);
}
