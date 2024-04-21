import SyntaxHighlighter from 'react-syntax-highlighter';
import { foundation as theme } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { createSimpleFormatter } from '@app/utils/columns';
import JsonView from '@uiw/react-json-view';
import { LuClipboardCheck } from 'react-icons/lu';
import { FaRegCopy } from 'react-icons/fa6';
import { MdAddCircleOutline, MdOutlineExpandLess, MdOutlineExpandMore } from 'react-icons/md';
import { MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import { IconBaseProps } from 'react-icons/lib';
import { ColumnConfig, LogData, JSONValue, LogRenderer } from '@/types';

const jsonViewTheme = {
	'--w-rjv-font-family': 'Fira Code',
	'--w-rjv-color': 'rgb(71, 85, 105)',
	'--w-rjv-key-number': 'var(--w-rjv-type-int-color)',
	'--w-rjv-key-string': 'var(--w-rjv-color)',
	'--w-rjv-background-color': 'transparent',
	'--w-rjv-line-color': 'rgba(0, 0, 0, 0.1)',
	'--w-rjv-arrow-color': '#838383',
	'--w-rjv-edit-color': 'var(--w-rjv-color)',
	'--w-rjv-info-color': '#9c9c9c',
	'--w-rjv-update-color': '#9cdcfe',
	'--w-rjv-copied-color': '#9cdcfe',
	'--w-rjv-copied-success-color': '#28a745',

	'--w-rjv-curlybraces-color': 'var(--w-rjv-color)',
	'--w-rjv-colon-color': 'var(--w-rjv-color)',
	'--w-rjv-brackets-color': 'var(--w-rjv-color)',
	'--w-rjv-ellipsis-color': 'var(--w-rjv-type-string-color)',
	'--w-rjv-quotes-color': 'var(--w-rjv-color)',
	'--w-rjv-quotes-string-color': 'var(--w-rjv-type-string-color)',

	'--w-rjv-type-string-color': '#d14',
	'--w-rjv-type-int-color': '#099',
	'--w-rjv-type-float-color': 'var(--w-rjv-type-int-color)',
	'--w-rjv-type-bigint-color': 'var(--w-rjv-type-int-color)',
	'--w-rjv-type-boolean-color': 'var(--w-rjv-type-int-color)',
	'--w-rjv-type-date-color': 'var(--w-rjv-type-int-color)',
	'--w-rjv-type-url-color': 'var(--w-rjv-type-string-color)',
	'--w-rjv-type-null-color': 'var(--w-rjv-type-int-color)',
	'--w-rjv-type-nan-color': 'var(--w-rjv-type-int-color)',
	'--w-rjv-type-undefined-color': 'var(--w-rjv-type-int-color)'
};

interface CopyButtonProps {
	copied: boolean;
	onClick?: MouseEventHandler<SVGSVGElement>;
}

function CopyButton(props: CopyButtonProps & IconBaseProps) {
	const { copied, onClick, ...rest } = props;
	return (
		<span data-tooltip-id="tooltip" data-tooltip-content="Copy">
			{copied ? (
				<LuClipboardCheck {...rest} className="inline text-emerald-600" />
			) : (
				<FaRegCopy
					{...rest}
					className="inline text-gray-500 hover:text-gray-400"
					onClick={onClick}
				/>
			)}
		</span>
	);
}

interface JSONCopyWithAddColumnProps {
	onAddColumn: (config: Partial<ColumnConfig>) => void;
}

function JSONCopyWithAddColumn(props: JSONCopyWithAddColumnProps) {
	const { onAddColumn } = props;

	return (
		<JsonView.Copied<'svg'>
			render={({ style, onClick, ...props }, { keys }) => {
				const copied = (props as any)['data-copied'];
				const columnName = keys ? String(keys[keys.length - 1]) : 'log';
				const columnPattern = keys
					? keys
							.map((k) => (/^[a-zA-Z][a-zA-Z0-9]*$/.test(String(k)) ? `.${k}` : `.['${k}']`))
							.join('?')
					: '';

				return (
					<span className="pl-1">
						<CopyButton style={style} copied={copied} onClick={onClick} />
						<MdAddCircleOutline
							style={style}
							className="inline text-gray-500 hover:text-gray-400"
							data-tooltip-id="tooltip"
							data-tooltip-content="Add column"
							onClick={() =>
								onAddColumn({
									name: columnName,
									formatter: createSimpleFormatter(columnPattern ? `log${columnPattern}` : 'log')
								})
							}
						/>
					</span>
				);
			}}
		/>
	);
}

interface ColumnValueViewProps {
	title: string;
	value: any;
}

function ColumnValueView(props: ColumnValueViewProps) {
	const { title, value } = props;
	const [expanded, setExpanded] = useState(false);

	const collapsedValue = useMemo(
		() => (
			<SyntaxHighlighter
				style={{ ...theme, hljs: {} }}
				className="!overflow-hidden text-ellipsis !bg-transparent"
				language={typeof value === 'object' ? 'json' : 'plaintext'}
			>
				{typeof value === 'object' ? JSON.stringify(value) : value}
			</SyntaxHighlighter>
		),
		[value]
	);
	const toggleExpanded = useCallback(() => setExpanded((ex) => !ex), []);

	return (
		<div className="space-y-2">
			<button className="w-full flex items-center justify-between group" onClick={toggleExpanded}>
				<label className="text-sm font-medium text-slate-600 cursor-pointer">{title}</label>
				<div className="p-1 rounded-full group-hover:bg-slate-100">
					{expanded && <MdOutlineExpandLess className="text-slate-600" />}
					{!expanded && <MdOutlineExpandMore className="text-slate-600" />}
				</div>
			</button>
			<div className="border px-3 py-2 rounded">
				{!expanded && (
					<div className="overflow-hidden text-ellipsis text-xs font-['Fira_Code'] text-slate-600 whitespace-nowrap">
						{collapsedValue}
					</div>
				)}
				{expanded && typeof value === 'object' && (
					<JsonView
						value={value}
						displayDataTypes={false}
						style={jsonViewTheme as any}
						className="py-2"
					>
						<JsonView.Copied<'svg'>
							render={({ style, onClick, ...props }) => {
								const copied = (props as any)['data-copied'];
								return (
									<span className="pl-1">
										<CopyButton style={style} copied={copied} onClick={onClick} />
									</span>
								);
							}}
						/>
					</JsonView>
				)}
				{expanded && typeof value !== 'object' && (
					<div className="text-xs font-['Fira_Code'] text-slate-600">{value}</div>
				)}
			</div>
		</div>
	);
}

interface LogViewProps {
	log: LogData;
	columns: ColumnConfig[];
	logRenderer: LogRenderer;
	onAddColumn: (data: Partial<ColumnConfig>) => void;
}

export function LogView(props: LogViewProps) {
	const { log, columns, logRenderer, onAddColumn } = props;
	const [render, setRender] = useState<Record<string, JSONValue>>({});

	useEffect(() => {
		logRenderer([log]).then((r) => setRender(r[0]));
	}, [log, logRenderer]);

	return (
		<div className="w-full space-y-8 flex flex-col">
			<div className="space-y-4 px-6">
				{columns.map((column) => (
					<ColumnValueView key={column.id} title={column.name} value={render[column.id]} />
				))}
			</div>
			<div className="flex flex-col space-y-8">
				<div className="flex basis-20 border-b px-6 items-center">
					<label className="text-lg font-medium text-slate-500">{'Log JSON'}</label>
				</div>
				<div className="px-6">
					<div className="border rounded py-2 px-4">
						<JsonView
							value={log}
							displayDataTypes={false}
							className="py-2"
							style={jsonViewTheme as any}
						>
							<JSONCopyWithAddColumn onAddColumn={onAddColumn} />
						</JsonView>
					</div>
				</div>
			</div>
		</div>
	);
}
