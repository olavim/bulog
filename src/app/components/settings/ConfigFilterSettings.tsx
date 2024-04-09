import { useCallback } from 'react';
import ConfigColumnList from './ConfigColumnList';
import FilterSettings from '../FilterSettings';
import SettingsSection from './SettingsSection';
import { MdRemoveCircle } from 'react-icons/md';
import { ZodIssue } from 'zod';

interface ConfigFilterSettingsProps {
	config: FilterConfig;
	validationErrors: Record<string, ZodIssue>;
	onChange: (config: FilterConfig) => void;
	onDelete: () => void;
}

export default function ConfigFilterSettings(props: ConfigFilterSettingsProps) {
	const { config, onChange, onDelete } = props;

	const onChangeColumns = useCallback(
		(columns: ColumnConfig[]) => {
			onChange({ ...config, columns });
		},
		[config, onChange]
	);

	const onChangeFilter = useCallback(
		(_id: string, name: string, filter: string) => {
			onChange({ ...config, name, filter });
		},
		[config, onChange]
	);

	return (
		<div className="flex-col max-h-full">
			<div className="flex flex flex-col max-h-full">
				<SettingsSection title="General" className="pt-5">
					<FilterSettings
						id="filter"
						name={config.name}
						predicateString={config.filter}
						onChange={onChangeFilter}
					/>
				</SettingsSection>
				<SettingsSection title="Columns" className="pt-5">
					<ConfigColumnList columns={config.columns} onChange={onChangeColumns} />
				</SettingsSection>
				<SettingsSection title="Delete Filter" className="pt-5">
					<button
						className="h-[30px] bg-red-500 inline-flex items-center text-slate-50 pl-3 pr-4 rounded text-sm font-medium"
						onClick={onDelete}
					>
						<MdRemoveCircle className="mr-2" />
						<span>{'Delete'}</span>
					</button>
				</SettingsSection>
			</div>
		</div>
	);
}
