import { RiInsertColumnRight } from 'react-icons/ri';

interface NewColumnButtonProps {
	onClick: () => void;
}

export function NewColumnButton(props: NewColumnButtonProps) {
	const { onClick } = props;

	return (
		<button
			className="h-[35px] inline-flex flex-row items-center bg-slate-300 hover:bg-slate-200 text-slate-500 font-medium px-2 rounded shadow ml-2"
			data-tooltip-id="tooltip"
			data-tooltip-content="New column"
			data-cy="new-column-button"
			onClick={onClick}
		>
			<RiInsertColumnRight className="text-2xl" />
		</button>
	);
}
