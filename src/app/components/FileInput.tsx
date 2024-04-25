import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { FaRegFileLines } from 'react-icons/fa6';
import { RiDeleteBinLine } from 'react-icons/ri';

interface FileInputProps {
	onChange: (file: File | null) => void;
	file?: File;
	accept?: string;
	existingFileName?: string;
	inputProps?: React.HTMLProps<HTMLInputElement>;
}

export function FileInput(
	props: FileInputProps & Omit<React.HTMLProps<HTMLDivElement>, keyof FileInputProps>
) {
	const { onChange, file, existingFileName, accept, inputProps, ...rest } = props;

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

	const onDeleteFile = useCallback(() => {
		setFileName(null);
		onChange(null);
	}, [onChange]);

	useEffect(() => {
		if (importFileInputRef.current && file) {
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			importFileInputRef.current.files = dataTransfer.files;
		}
	}, [file]);

	return (
		<div {...rest}>
			<div className="h-[30px] w-full flex space-x-2">
				<div className="h-full grow flex items-center px-1 border border-slate-300 rounded">
					{(fileName || existingFileName) && (
						<FaRegFileLines className="text-slate-500 text-lg ml-1" />
					)}
					<span className="text-sm text-slate-500 grow ml-2">
						{fileName ?? existingFileName ?? 'No file selected'}
					</span>
					{(fileName || existingFileName) && (
						<button
							className="hover:bg-slate-100 rounded-full w-[24px] h-[24px] flex justify-center items-center"
							onClick={onDeleteFile}
						>
							<RiDeleteBinLine className="text-red-500 text-lg" />
						</button>
					)}
				</div>
				{!fileName && !existingFileName && (
					<>
						<button
							className="h-full w-[6rem] font-medium bg-gray-50 hover:bg-gray-50/50 active:bg-white border border-slate-300 text-center rounded flex items-center"
							onClick={onClickImportFile}
						>
							<span className="grow text-sm text-slate-500">{'Browse...'}</span>
						</button>
						<input
							{...inputProps}
							onChange={onChangeFile}
							multiple={false}
							ref={importFileInputRef}
							accept={accept}
							type="file"
							hidden
						/>
					</>
				)}
			</div>
		</div>
	);
}
