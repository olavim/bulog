import { ChangeEventHandler, useCallback, useRef, useState } from 'react';

interface FileInputProps {
	onChange: (file: File) => void;
}

export function FileInput(
	props: FileInputProps & Omit<React.HTMLProps<HTMLDivElement>, keyof FileInputProps>
) {
	const { onChange, ...rest } = props;

	const importFileInputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);

	const onClickImportFile = useCallback(() => {
		if (importFileInputRef.current) {
			importFileInputRef.current.click();
		}
	}, []);

	const onChangeFile: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) => {
			const file = evt.target.files?.[0];
			setFileName(file?.name ?? null);

			if (file) {
				onChange(file);
			}
		},
		[onChange]
	);

	return (
		<div {...rest}>
			<div className="h-[30px] w-full flex space-x-2">
				<div className="h-full grow flex items-center px-4 border border-slate-300 rounded">
					<span className="text-sm text-slate-500">{fileName ?? 'No file selected'}</span>
				</div>
				<button
					className="h-full font-medium bg-gray-50 hover:bg-gray-50/50 active:bg-white border border-slate-300 text-left px-4 rounded flex items-center"
					onClick={onClickImportFile}
				>
					<span className="grow text-sm text-slate-500">{'Browse...'}</span>
				</button>
			</div>
			<input
				onChange={onChangeFile}
				multiple={false}
				ref={importFileInputRef}
				accept=".json"
				type="file"
				hidden
			/>
		</div>
	);
}
