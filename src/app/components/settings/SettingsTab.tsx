import { useCallback } from 'react';
import { IconType } from 'react-icons/lib';

interface SettingsTabProps {
	id: string;
	Icon?: IconType;
	title: string;
	selected: boolean;
	onClick: (id: string) => void;
}

export default function SettingsTab(props: SettingsTabProps) {
	const { id, title, selected, onClick, Icon } = props;

	const handleClick = useCallback(() => {
		onClick(id);
	}, [onClick, id]);

	return (
		<button
			id={`settings-tab-${id}`}
			aria-controls={`settings-tabpanel-${id}`}
			role="tab"
			data-cy={`settings-tab-${id}`}
			aria-selected={selected}
			className="h-7 text-slate-600 hover:bg-gray-100 aria-selected:bg-sky-600 aria-selected:text-white flex px-2 py-1 items-center rounded text-xs font-normal cursor-pointer whitespace-nowrap"
			onClick={handleClick}
		>
			{Icon && <Icon className="text-lg mr-2" />}
			<span className="leading-none">{title}</span>
		</button>
	);
}
