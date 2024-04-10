import { MdDragIndicator } from 'react-icons/md';
import { LogColumnOverlayProps } from './LogColumnHeader';

export function LogColumnHeaderOverlay(props: LogColumnOverlayProps) {
	const { name, width } = props;

	return (
		<div
			className="h-[36px] z-[100] relative uppercase text-xs group font-semibold flex text-left items-center text-slate-500 bg-slate-50 pointer-events-none"
			style={{ width }}
		>
			<div
				className="absolute h-full border-y top-[-1px] left-[-3px]"
				style={{ width: width + 3 }}
			/>
			<div className="absolute left-[-3px] top-0 h-[34px] bg-clip-content bg-white">
				<div className="inline-block min-w-[1px] h-full border-x box-content" />
			</div>
			<div className="pl-6 mb-[1.5px] grow flex items-center overflow-hidden">
				<div className="w-full text-ellipsis overflow-hidden">{name}</div>
				<div className="basis-auto shrink-0 grow-0 flex items-center">
					<div className="inline-block py-1 mr-[0.4rem] rounded bg-slate-200">
						<MdDragIndicator className="text-lg text-slate-400" />
					</div>
				</div>
			</div>
			<div className="h-full bg-clip-content">
				<div className="inline-block min-w-[1px] h-[34px] border-x box-content" />
			</div>
		</div>
	);
}
