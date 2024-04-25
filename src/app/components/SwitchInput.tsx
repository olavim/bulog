import { ChangeEvent, useCallback, useRef } from 'react';

interface SwitchInputProps {
	id?: string;
	value: boolean;
	onChange: (evt: ChangeEvent<HTMLInputElement>) => void;
}

export function SwitchInput(props: SwitchInputProps) {
	const { id, value, onChange } = props;
	const checkboxRef = useRef<HTMLInputElement>(null);

	const onClick = useCallback(() => {
		checkboxRef.current?.click();
	}, []);

	return (
		<div
			className="h-[20px] w-[40px] relative group cursor-pointer"
			data-checked={value}
			onClick={onClick}
		>
			<div className="w-full h-full relative p-[4px] bg-clip-content pointer-events-none group-data-[checked=true]:bg-sky-400 group-data-[checked=false]:bg-slate-400 rounded-full transition-colors">
				<div
					className="relative left-[-2px] top-[-2px] group-data-[checked=true]:translate-x-full transition-transform duration-200 ease-in-out"
					style={{ width: 'calc(100% + 4px)', height: 'calc(100% + 4px)' }}
				>
					<div className="aspect-square h-full bg-white group-data-[checked=true]:bg-sky-600 rounded-full group-data-[checked=true]:-translate-x-full transition-[transform,background-color] duration-200 ease-in-out shadow-sm shadow-black/40 group-hover:ring-4 ring-black/10" />
				</div>
			</div>
			<input
				id={id}
				ref={checkboxRef}
				type="checkbox"
				role="switch"
				aria-checked={value}
				checked={value}
				onChange={onChange}
				style={{ clipPath: 'circle(0%)' }}
			/>
		</div>
	);
}
