import { javascript } from '@codemirror/lang-javascript';
import { ChangeEventHandler, memo, useCallback, useEffect, useState } from 'react';
import { MdCheckCircle, MdRemoveCircle } from 'react-icons/md';
import CodeMirror from '@uiw/react-codemirror';

interface ColumnViewProps {
	column: ColumnConfig;
	onChange?: (config: ColumnConfig) => void;
	onSave?: (config: ColumnConfig) => void;
	onDelete?: (id: string) => void;
}

const codeMirrorExtensions = [javascript()];

export default memo(function ColumnView(props: ColumnViewProps) {
	const { column: initialColumn, onSave, onChange, onDelete } = props;
	const [column, setColumn] = useState(initialColumn);

	const handleSave = useCallback(() => {
		onSave?.(column);
	}, [onSave, column]);

	const handleDelete = useCallback(() => {
		onDelete?.(column.id);
	}, [column.id, onDelete]);

	const handleChangeName: ChangeEventHandler<HTMLInputElement> = useCallback((evt) => {
		setColumn((prevColumn) => ({
			...prevColumn,
			name: evt.target.value
		}));
	}, []);

	const handleChangeFormatter = useCallback((value: string) => {
		setColumn((prevColumn) => ({
			...prevColumn,
			formatter: value
		}));
	}, []);

	useEffect(() => {
		if (column === initialColumn) {
			return;
		}

		onChange?.(column);
	}, [onChange, column, initialColumn]);

	return (
		<div className="w-full items-start flex flex-col grow space-y-4">
			<div className="flex flex-col w-full space-y-2">
				<label htmlFor="column-name-input" className="text-xs text-gray-800 font-medium">
					{'Name'}
				</label>
				<input
					value={column.name}
					onChange={handleChangeName}
					id="column-name-input"
					data-cy="column-name-input"
					className="text-xs font-normal basis-[35px] w-full border border-gray-300 rounded py-1 px-3 text-gray-600"
				/>
			</div>
			<div className="flex flex-col grow w-full space-y-2">
				<label htmlFor="column-pattern-input" className="text-xs text-gray-800 font-medium">
					{'Formatter'}
				</label>
				<CodeMirror
					className="basis-40 border overflow-hidden rounded outline-none text-gray-800 text-xs"
					data-cy="column-formatter-input"
					height="100%"
					extensions={codeMirrorExtensions}
					value={column.formatter}
					onChange={handleChangeFormatter}
					basicSetup={{
						lineNumbers: false,
						foldGutter: false,
						highlightActiveLineGutter: false
					}}
					onCreateEditor={(view) => {
						view.dom.style.outline = 'none';
					}}
				/>
			</div>
			{(onSave || onDelete) && (
				<div className="flex flex-row w-full justify-between pt-4">
					<button
						className="h-[30px] inline-flex flex-row items-center bg-sky-500 hover:bg-sky-400 disabled:bg-gray-300 text-sm text-white font-medium pl-3 pr-4 rounded"
						data-cy="save-column-button"
						onClick={handleSave}
						disabled={column.name === ''}
					>
						<MdCheckCircle className="mr-2" />
						<span>{'Save'}</span>
					</button>
					<button
						className="h-[30px] inline-flex flex-row items-center bg-red-500 hover:bg-red-400 text-sm text-white font-medium pl-3 pr-4 rounded"
						data-cy="delete-column-button"
						onClick={handleDelete}
					>
						<MdRemoveCircle className="mr-2" />
						<span>{'Delete'}</span>
					</button>
				</div>
			)}
		</div>
	);
});
