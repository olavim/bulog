import { ChangeEventHandler } from 'react';

interface ValidatedInputProps {
	value: string;
	error?: string;
	onChange: ChangeEventHandler<HTMLInputElement>;
}

export default function ValidatedInput(
	props: ValidatedInputProps &
		Omit<React.HTMLProps<HTMLInputElement>, 'value' | 'onChange' | 'className'>
) {
	const { onChange, value, error, ...rest } = props;

	return (
		<div
			className="relative group basis-auto text-xs flex flex-col"
			data-error={error ? true : undefined}
		>
			<input
				value={value}
				onChange={onChange}
				{...rest}
				className="basis-[35px] w-full border border-gray-300 rounded py-1 px-3 text-gray-600 group-data-[error]:ring-2 group-data-[error]:ring-red-400 focus:group-data-[error]:ring-red-300 focus:group-data-[error]:outline-none"
			/>
			<label className="absolute bottom-[-1.25rem] flex items-end text-xs text-red-400 font-medium opacity-0 group-data-[error]:opacity-100">
				{error}
			</label>
		</div>
	);
}
