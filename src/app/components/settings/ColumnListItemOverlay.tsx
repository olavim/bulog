import { ColumnSettings } from './ColumnSettings';
import { MdDeleteForever, MdDragIndicator } from 'react-icons/md';

interface ColumnListItemOverlayProps {
	column: ColumnConfig;
	expanded: boolean;
}

export function ColumnListItemOverlay(props: ColumnListItemOverlayProps) {
	const { column, expanded } = props;

	return (
		<div className="flex flex-col items-center relative" style={{ zIndex: 100 }}>
			<div className="flex flex-col w-full border rounded overflow-hidden">
				<div className="h-9 flex w-full px-2 bg-gray-50 justify-between items-center">
					<div className="flex items-center">
						<div className="inline-block py-1 rounded bg-slate-200 cursor-grabbing">
							<MdDragIndicator className="text-lg text-slate-400" />
						</div>
						<span className="ml-2 font-medium text-xs text-slate-600">{column.name}</span>
					</div>
					<div className="inline-block p-1 rounded-full text-red-400">
						<MdDeleteForever className="text-lg" />
					</div>
				</div>
				{expanded && (
					<div className="border-t bg-white w-full flex p-4">
						<ColumnSettings column={column} />
					</div>
				)}
			</div>
		</div>
	);
}
