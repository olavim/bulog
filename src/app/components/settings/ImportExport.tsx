import { ChangeEventHandler, useCallback, useRef } from 'react';
import { AiOutlineExport, AiOutlineImport } from 'react-icons/ai';
import { BulogConfigExportSchema } from '../../../schemas';

export default function ImportExport() {
	const importFileInputRef = useRef<HTMLInputElement>(null);

	const onClickImportFile = useCallback(() => {
		if (importFileInputRef.current) {
			importFileInputRef.current.click();
		}
	}, []);

	const onChangeImportFile: ChangeEventHandler<HTMLInputElement> = useCallback((evt) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const config = BulogConfigExportSchema.parse(JSON.parse(text));
			console.log(config);
		};
		reader.readAsText(evt.target.files?.[0] as File);
	}, []);

	return (
		<div className="flex-col max-h-full">
			<div className="py-3 px-6 flex flex flex-col space-y-4 overflow-y-auto overflow-x-hidden max-h-full">
				<div className="flex flex-col space-y-2">
					<div className="h-[30px] flex items-center">
						<h1 className="font-medium text-sm text-slate-700">{'Share settings'}</h1>
					</div>
					<a
						href="/api/config"
						download="bulog-config.json"
						className="h-[30px] text-xs font-medium bg-gray-50 hover:bg-gray-50/50 active:bg-white border border-gray-200 w-full text-left px-4 rounded text-slate-600 flex items-center"
					>
						<span className="grow">{'Export'}</span>
						<AiOutlineExport className="text-sm" />
					</a>
					<button
						className="h-[30px] text-xs font-medium bg-gray-50 hover:bg-gray-50/50 active:bg-white border border-gray-200 w-full text-left px-4 rounded text-slate-600 flex items-center"
						onClick={onClickImportFile}
					>
						<span className="grow">{'Import...'}</span>
						<AiOutlineImport className="text-sm" />
					</button>
					<input
						onChange={onChangeImportFile}
						multiple={false}
						ref={importFileInputRef}
						accept=".json"
						type="file"
						hidden
					/>
				</div>
			</div>
		</div>
	);
}
