import { useCallback } from 'react';
import { ColumnList } from '@app/components/settings/ColumnList';
import { SettingsSection } from '@app/components/settings/SettingsSection';
import { MdRemoveCircle } from 'react-icons/md';
import { ZodIssue } from 'zod';

interface BucketSettingsPageProps {
	config: BucketConfig;
	validationErrors: Record<string, ZodIssue>;
	onChange: (config: BucketConfig) => void;
	onDelete: () => void;
}

export function BucketSettingsPage(props: BucketSettingsPageProps) {
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
				<ColumnList columns={config.columns} onChange={onChangeColumns} />
			</SettingsSection>
			<SettingsSection title="Delete Bucket" className="space-y-4 pt-5">
				<p className="text-sm font-normal text-slate-500">
					Deleting this bucket will erase logs and configuration associated with it. Logs sent to
					this bucket will also be removed from server memory.
				</p>
				<button
					data-cy="settings-delete-bucket-button"
					className="h-[30px] bg-red-500 hover:bg-red-400 active:bg-red-400/80 flex items-center text-slate-50 pl-3 pr-4 rounded text-sm font-medium"
					onClick={onDelete}
				>
					<MdRemoveCircle className="mr-2" />
					<span>{'Delete'}</span>
				</button>
			</SettingsSection>
		</div>
	);
}
