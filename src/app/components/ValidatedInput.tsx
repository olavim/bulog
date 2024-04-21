import { ChangeEventHandler } from 'react';
import { MdErrorOutline } from 'react-icons/md';

interface ValidatedInputProps {
	value: string;
	error?: string;
	onChange: ChangeEventHandler<HTMLInputElement>;
}

export function ValidatedInput(
	props: ValidatedInputProps & Omit<React.HTMLProps<HTMLInputElement>, 'value' | 'onChange'>
) {
	const { onChange, value, error, className, ...rest } = props;

	return (
		<div
			className={`relative group basis-auto text-xs flex flex-col ${className ?? ''}`}
			data-error={error ? true : undefined}
		>
			<input
				value={value}
				onChange={onChange}
				{...rest}
				className="basis-[35px] w-full border border-gray-300 rounded py-1 px-3 text-gray-600 group-data-[error]:ring-2 group-data-[error]:ring-red-400 focus:group-data-[error]:ring-red-300 focus:group-data-[error]:outline-none"
				style={{ paddingRight: error ? '2rem' : undefined }}
			/>
			{error && (
				<div
					className="absolute bottom-[50%] translate-y-1/2 right-2 text-xl bg-white"
					data-tooltip-id="tooltip"
					data-tooltip-content={error}
				>
					<MdErrorOutline className="text-red-400" />
				</div>
			)}
		</div>
	);
}
