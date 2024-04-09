import { javascript } from '@codemirror/lang-javascript';
import { ChangeEventHandler, useCallback, useEffect, useState } from 'react';
import { MdCheckCircle, MdRemoveCircle } from 'react-icons/md';
import CodeMirror from '@uiw/react-codemirror';

interface FilterSettingsProps {
	id: string;
	name: string;
	predicateString: string;
	onChange?: (id: string, name: string, predicateString: string) => void;
	onSave?: (id: string, name: string, predicateString: string) => void;
	onDelete?: () => void;
}

export default function ColumnView(props: FilterSettingsProps) {
	const { id, name, predicateString, onChange, onSave, onDelete } = props;
	const [nameStr, setNameStr] = useState(name);
	const [predicateStr, setPredicateStr] = useState(predicateString);

	useEffect(() => {
		setNameStr(name);
		setPredicateStr(predicateString);
	}, [name, predicateString]);

	const onChangeName: ChangeEventHandler<HTMLInputElement> = useCallback(
		(evt) => {
			setNameStr(evt.target.value);
			onChange?.(id, evt.target.value, predicateStr);
		},
		[predicateStr, id, onChange]
	);

	const onChangeFilter = useCallback(
		(value: string) => {
			setPredicateStr(value);
			onChange?.(id, nameStr, value);
		},
		[id, nameStr, onChange]
	);

	const handleSave = useCallback(() => {
		onSave?.(id, nameStr, predicateStr);
	}, [onSave, id, nameStr, predicateStr]);

	return (
		<div className="w-full items-start flex flex-col grow space-y-4">
			<div className="flex flex-col w-full space-y-2">
				<label htmlFor="filter-name-input" className="text-xs text-slate-600 font-medium">
					{'Name'}
				</label>
				<input
					value={nameStr}
					onChange={onChangeName}
					id="filter-name-input"
					data-cy="filter-name-input"
					className="text-xs basis-[35px] w-full border border-gray-300 shadow rounded py-1 px-3 text-gray-600"
				/>
			</div>
			<div className="flex flex-col grow w-full space-y-2">
				<label htmlFor="filter-predicate-input" className="text-xs text-slate-600 font-medium">
					{'Predicate'}
				</label>
				<CodeMirror
					id="filter-predicate-input"
					data-cy="filter-predicate-input"
					className="basis-40 border rounded shadow p-2 outline-none"
					height="100%"
					extensions={[javascript()]}
					value={predicateStr}
					onChange={onChangeFilter}
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
						className="h-[30px] inline-flex flex-row items-center bg-sky-500 hover:bg-sky-400 disabled:bg-gray-300 text-sm text-white font-medium pl-3 pr-4 rounded shadow"
						data-cy="save-filter-button"
						onClick={handleSave}
						disabled={nameStr === ''}
					>
						<MdCheckCircle className="mr-2" />
						<span>{'Save'}</span>
					</button>
					<button
						className="h-[30px] inline-flex flex-row items-center bg-red-500 hover:bg-red-400 text-sm text-white font-medium pl-3 pr-4 rounded shadow"
						onClick={onDelete}
					>
						<MdRemoveCircle className="mr-2" />
						<span>{'Delete'}</span>
					</button>
				</div>
			)}
		</div>
	);
}
