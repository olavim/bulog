import { ChangeEventHandler, useCallback, useState } from 'react';
import { AiOutlineExport, AiOutlineImport } from 'react-icons/ai';
import { BulogConfigSchema } from '../../../schemas';
import SettingsSection from './SettingsSection';
import FileInput from '../FileInput';
import InfoBanner from './InfoBanner';

const settings: Array<{ key: keyof BulogConfig; label: string; default: boolean }> = [
	{ key: 'buckets', label: 'Bucket settings', default: true },
	{ key: 'filters', label: 'Filter settings', default: true },
	{ key: 'server', label: 'Server settings', default: false }
];

interface ImportExportProps {
	onImport: (config: Partial<BulogConfig>) => void;
}

export default function ImportExport(props: ImportExportProps) {
	const { onImport } = props;

	const [checkedExports, setCheckedExports] = useState<Record<string, boolean>>(
		settings.reduce((obj, s) => ({ ...obj, [s.key]: s.default }), {})
	);

	const [checkedImports, setCheckedImports] = useState<Record<string, boolean>>(
		settings.reduce((obj, s) => ({ ...obj, [s.key]: s.default }), {})
	);

	const [importDraft, setImportDraft] = useState<Partial<BulogConfig> | null>(null);
	const [importError, setImportError] = useState<boolean>(false);

	const onChangeImportFile = useCallback((file: File) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			try {
				const config = BulogConfigSchema.partial().parse(JSON.parse(text));
				setImportError(false);
				setImportDraft(config);
			} catch (err) {
				setImportError(true);
				setImportDraft(null);
				console.error(err);
			}
		};
		reader.readAsText(file);
	}, []);

	const onChangeExports: ChangeEventHandler<HTMLInputElement> = useCallback((evt) => {
		setCheckedExports((prev) => ({ ...prev, [evt.target.name]: evt.target.checked }));
	}, []);

	const onChangeImports: ChangeEventHandler<HTMLInputElement> = useCallback((evt) => {
		setCheckedImports((prev) => ({ ...prev, [evt.target.name]: evt.target.checked }));
	}, []);

	const onClickImport = useCallback(() => {
		if (importDraft) {
			onImport(importDraft);
		}
	}, [importDraft, onImport]);

	return (
		<div className="flex flex-col space">
			<SettingsSection title="Import" className="space-y-4 pt-5">
				<p className="text-sm font-normal text-slate-500 leading-none">
					Import settings from a file.
				</p>
				<div>
					<FileInput onChange={onChangeImportFile} className="w-full" />
				</div>
				{importError && <InfoBanner variant="error">Selected file cannot be imported</InfoBanner>}
				<div className="space-y-1">
					{settings.map((setting) => (
						<div key={setting.key}>
							<input
								type="checkbox"
								className="peer accent-sky-600 focus:outline-none focus-visible:ring"
								checked={Boolean(importDraft?.[setting.key] && checkedImports[setting.key])}
								name={setting.key}
								onChange={onChangeImports}
								disabled={!importDraft?.[setting.key]}
							/>
							<label
								htmlFor={setting.key}
								className="ml-4 text-sm font-normal text-slate-500 peer-disabled:opacity-50"
							>
								{setting.label}
							</label>
						</div>
					))}
				</div>
				<div>
					<button
						disabled={!importDraft}
						className="h-[30px] font-medium bg-gray-50 hover:bg-gray-50/50 active:bg-white border border-gray-200 text-left pl-3 pr-4 rounded inline-flex items-center disabled:opacity-60"
						onClick={onClickImport}
					>
						<AiOutlineImport className="text-sm text-slate-600" />
						<span className="ml-2 text-sm text-slate-500">{'Import'}</span>
					</button>
				</div>
				<InfoBanner variant="note">
					You will have a chance to preview the imported settings. Changes are applied only after
					clicking the <b>Apply changes</b> button.
				</InfoBanner>
			</SettingsSection>
			<SettingsSection title="Export" className="space-y-4 pt-5">
				<p className="text-sm font-normal text-slate-500">
					Export your settings to a file. Exported settings can later be imported into another
					instance of Bulog.
				</p>
				<InfoBanner>Only applied changes are exported</InfoBanner>
				<div className="space-y-1">
					{settings.map((setting) => (
						<div key={setting.key}>
							<input
								type="checkbox"
								className="accent-sky-600 focus:outline-none focus-visible:ring"
								checked={checkedExports[setting.key]}
								name={setting.key}
								onChange={onChangeExports}
							/>
							<label htmlFor={setting.key} className="ml-4 text-sm font-normal text-slate-500">
								{setting.label}
							</label>
						</div>
					))}
				</div>
				<div>
					<a
						href={`/api/config?k=${encodeURI(
							settings
								.filter((s) => checkedExports[s.key])
								.map((s) => s.key)
								.join(',')
						)}`}
						download="bulog-config.json"
						className="h-[30px] font-medium bg-gray-50 hover:bg-gray-50/50 active:bg-white border border-gray-200 text-left pl-3 pr-4 rounded inline-flex items-center"
					>
						<AiOutlineExport className="text-sm text-slate-600" />
						<span className="ml-2 text-sm text-slate-500">{'Export'}</span>
					</a>
				</div>
			</SettingsSection>
		</div>
	);
}
