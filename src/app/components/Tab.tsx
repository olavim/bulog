import { useCallback } from 'react';

interface TabProps {
	id: string;
	title: string;
	count: number;
	selected: boolean;
	onClick: (id: string) => void;
}

export default function Tab(props: TabProps) {
	const { onClick, id, title, selected, count } = props;

	const handleClick = useCallback(() => {
		onClick(id);
	}, [onClick, id]);

	return (
		<div
			data-selected={selected || undefined}
			className="group w-full flex items-center justify-start py-3 px-6 cursor-pointer hover:bg-slate-600 data-[selected=true]:bg-sky-600 data-[selected=true]:shadow-lg data-[selected=true]:cursor-default"
			data-cy="tab"
			onClick={handleClick}
		>
			<span className="text-ellipsis overflow-hidden whitespace-nowrap text-xs font-medium text-gray-300 group-hover:text-gray-200 group-data-[selected=true]:text-gray-800 group-data-[selected=true]:text-white">
				{title}
			</span>
			<span className="pl-4 grow flex justify-end text-xs text-slate-400 group-data-[selected=true]:text-slate-300">
				{count}
			</span>
		</div>
	);
}
