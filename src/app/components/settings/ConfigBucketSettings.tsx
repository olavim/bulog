import { useCallback } from 'react';
import ConfigColumnList from './ConfigColumnList';
import SettingsSection from './SettingsSection';
import { MdRemoveCircle } from 'react-icons/md';
import { ZodIssue } from 'zod';

interface ConfigBucketSettingsProps {
	config: BucketConfig;
	validationErrors: Record<string, ZodIssue>;
	onChange: (config: BucketConfig) => void;
	onDelete: () => void;
}

export default function ConfigBucketSettings(props: ConfigBucketSettingsProps) {
	const { config, onChange, onDelete } = props;

	const onChangeColumns = useCallback(
		(columns: ColumnConfig[]) => {
			onChange({ ...config, columns });
		},
		[config, onChange]
	);

	return (
		<div className="flex flex flex-col max-h-full">
			<SettingsSection title="Columns" className="pt-5">
				<ConfigColumnList columns={config.columns} onChange={onChangeColumns} />
			</SettingsSection>
			<SettingsSection title="Delete Bucket" className="space-y-4 pt-5">
				<p className="text-sm font-normal text-slate-500">
					Deleting this bucket will erase logs and configuration associated with it. Logs sent to
					this bucket will also be removed from server memory.
				</p>
				<button
					data-cy="settings-delete-bucket-button"
					className="h-[30px] bg-red-500 flex items-center text-slate-50 pl-3 pr-4 rounded text-sm font-medium"
					onClick={onDelete}
				>
					<MdRemoveCircle className="mr-2" />
					<span>{'Delete'}</span>
				</button>
			</SettingsSection>
		</div>
	);
}
