import { memo, useCallback, useEffect, useState } from 'react';
import { TbServer } from 'react-icons/tb';
import SettingsTab from './SettingsTab';
import ConfigBucketSettings from './ConfigBucketSettings';
import globalStore from '@/stores/globalStore';
import { MdAddCircleOutline, MdClose, MdImportExport } from 'react-icons/md';
import { CgSpinner } from 'react-icons/cg';
import ConfigFilterSettings from './ConfigFilterSettings';
import { createFilter, filterDataToConfig } from '@/utils/filters';
import { nanoid } from 'nanoid';
import useSandbox from '@/hooks/useSandbox';
import { bucketDataToConfig } from '@/utils/buckets';

interface SettingsDialogProps {
	open: boolean;
	onClose: () => void;
}

export default memo(function SettingsDialog(props: SettingsDialogProps) {
	const { open, onClose } = props;
	const [tab, setTab] = useState<string>('server');
	const config = globalStore.use.config();
	const buckets = globalStore.use.buckets();
	const filters = globalStore.use.filters();
	const configLoaded = globalStore.use.configLoaded();
	const [configTimeoutElapsed, setConfigTimeoutElapsed] = useState(true);
	const sandbox = useSandbox();
	const saveConfig = globalStore.use.saveConfig();
	const loadConfig = globalStore.use.loadConfig();
	const [configDraft, setConfigDraft] = useState<BulogConfig>(config);

	const resetConfig = useCallback(() => {
		const draft: BulogConfig = { buckets: {}, filters: {} };

		for (const bucketId of buckets.keys()) {
			draft.buckets[bucketId] = bucketDataToConfig(buckets.get(bucketId)!.getState().data);
		}

		for (const filterId of filters.keys()) {
			draft.filters[filterId] = filterDataToConfig(filters.get(filterId)!.getState().data);
		}

		setConfigDraft(draft);
	}, [buckets, filters]);

	useEffect(() => {
		if (configLoaded && configTimeoutElapsed) {
			resetConfig();
		}
	}, [buckets, filters, config, configLoaded, configTimeoutElapsed, resetConfig]);

	const onChangeBucketConfig = useCallback(
		(config: BucketConfig) => {
			const bucketId = tab.substring('buckets:'.length);
			setConfigDraft((prev) => ({
				...prev,
				buckets: {
					...prev.buckets,
					[bucketId]: config
				}
			}));
		},
		[tab]
	);

	const onChangeFilterConfig = useCallback(
		(config: FilterConfig) => {
			const filterId = tab.substring('filters:'.length);
			setConfigDraft((prev) => ({
				...prev,
				filters: {
					...prev.filters,
					[filterId]: config
				}
			}));
		},
		[tab]
	);

	const onDeleteBucket = useCallback(() => {
		const bucketId = tab.substring('buckets:'.length);
		const nextBucketId = Object.keys(configDraft.buckets).find((id) => id !== bucketId);
		setTab(nextBucketId ? `buckets:${nextBucketId}` : 'server');
		setConfigDraft((prev) => ({
			...prev,
			buckets: Object.fromEntries(Object.entries(prev.buckets).filter(([id]) => id !== bucketId))
		}));
	}, [configDraft.buckets, tab]);

	const onDeleteFilter = useCallback(() => {
		const filterId = tab.substring('filters:'.length);
		const nextBucketId = Object.keys(configDraft.filters).find((id) => id !== filterId);
		setTab(nextBucketId ? `filters:${nextBucketId}` : 'server');
		setConfigDraft((prev) => ({
			...prev,
			filters: Object.fromEntries(Object.entries(prev.filters).filter(([id]) => id !== filterId))
		}));
	}, [configDraft.filters, tab]);

	const onAddFilter = useCallback(() => {
		const id = nanoid(16);
		setConfigDraft((prev) => ({
			...prev,
			filters: {
				...prev.filters,
				[id]: createFilter()
			}
		}));
		setTab(`filters:${id}`);
	}, []);

	const onSave = useCallback(async () => {
		setConfigTimeoutElapsed(false);
		await saveConfig(configDraft);
		loadConfig(sandbox);
		setTimeout(() => setConfigTimeoutElapsed(true), 1000);
	}, [configDraft, loadConfig, sandbox, saveConfig]);

	if (!open) {
		return null;
	}

	return (
		<div className="absolute left-0 top-0 w-full h-full bg-black/25 z-50 flex items-center justify-center">
			<div className="flex flex-col bg-white w-[90%] max-w-[50rem] h-[90%] max-h-[50rem] overflow-hidden rounded-lg">
				<div className="basis-[70px] shrink-0 grow-0 px-6 flex items-center justify-between text-xl text-slate-600 font-medium border-black/10">
					<h1>{'Settings'}</h1>
					<button
						className="p-2 rounded-full hover:bg-gray-200 cursor-pointer"
						data-cy="close-drawer-button"
						onClick={onClose}
					>
						<MdClose className="text-xl text-slate-600" />
					</button>
				</div>
				<div className="flex flex-row grow overflow-y-hidden border-y border-black/10">
					<div className="flex flex-col p-3 min-w-[12rem] space-y-1">
						<SettingsTab
							title="Server"
							id="server"
							selected={tab === 'server'}
							onClick={setTab}
							Icon={TbServer}
						/>
						<SettingsTab
							title="Import & Export"
							id="importexport"
							selected={tab === 'importexport'}
							onClick={setTab}
							Icon={MdImportExport}
						/>
						<hr className="!my-2" />
						<h2 className="pl-2 py-1 text-xs font-semibold text-slate-500">{'BUCKET SETTINGS'}</h2>
						{Object.keys(configDraft.buckets).map((bucketId) => (
							<SettingsTab
								key={bucketId}
								id={`buckets:${bucketId}`}
								title={bucketId}
								selected={tab === `buckets:${bucketId}`}
								onClick={setTab}
							/>
						))}
						<hr className="!my-2" />
						<div className="px-2 py-1 flex justify-between items-center text-slate-500">
							<h2 className="text-xs font-semibold">{'FILTER SETTINGS'}</h2>
							<button
								className="hover:text-sky-500"
								data-tooltip-id="tooltip"
								data-tooltip-content="Add filter"
								onClick={onAddFilter}
							>
								<MdAddCircleOutline className="text-md" />
							</button>
						</div>
						{Object.keys(configDraft.filters).map((filterId) => (
							<SettingsTab
								key={filterId}
								id={`filters:${filterId}`}
								title={configDraft.filters[filterId].name || '-'}
								selected={tab === `filters:${filterId}`}
								onClick={setTab}
							/>
						))}
					</div>
					<div className="flex flex-col grow py-3 px-6 overflow-y-auto">
						{tab.startsWith('buckets:') && (
							<ConfigBucketSettings
								config={configDraft.buckets[tab.substring('buckets:'.length)]}
								onChange={onChangeBucketConfig}
								onDelete={onDeleteBucket}
							/>
						)}
						{tab.startsWith('filters:') && (
							<ConfigFilterSettings
								config={configDraft.filters[tab.substring('filters:'.length)]}
								onChange={onChangeFilterConfig}
								onDelete={onDeleteFilter}
							/>
						)}
					</div>
				</div>
				<div className="basis-[70px] shrink-0 grow-0 px-6 flex items-center justify-end text-xl text-slate-600 font-medium space-x-4">
					<button
						className="h-[30px] relative bg-emerald-500 enabled:hover:bg-emerald-400 disabled:bg-emerald-400 inline-flex items-center text-white px-4 rounded font-medium shadow overflow-hidden"
						onClick={onSave}
						disabled={!configLoaded || !configTimeoutElapsed}
					>
						<div
							className="absolute left-0 top-0 w-full h-full flex items-center justify-center transition-all bg-emerald-400"
							style={{
								opacity: configLoaded && configTimeoutElapsed ? 0 : 1
							}}
						>
							<CgSpinner className="animate-spin text-lg" />
						</div>
						<span
							className="text-sm transition-all duration-[400ms]"
							style={{ opacity: configLoaded && configTimeoutElapsed ? 1 : 0 }}
						>
							{'Save'}
						</span>
					</button>
					<button
						className="h-[30px] border border-gray-400 hover:border-gray-400/75 inline-flex items-center text-gray-500 hover:text-gray-400 px-4 rounded font-medium shadow"
						onClick={resetConfig}
					>
						<span className="text-sm">{'Cancel'}</span>
					</button>
				</div>
			</div>
		</div>
	);
});
