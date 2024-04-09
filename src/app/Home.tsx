import { useState, useEffect, useCallback } from 'react';
import Tab from '@/components/Tab';
import { Tooltip } from 'react-tooltip';
import BucketView from '@/components/BucketView';
import { MdAddCircleOutline } from 'react-icons/md';
import FilterView from './components/FilterView';
import useWebSocket from 'react-use-websocket';
import globalStore from './stores/globalStore';
import useSandbox from './hooks/useSandbox';
import { IoMdSettings } from 'react-icons/io';
import SettingsDialog from './components/settings/SettingsDialog';

export default function Home() {
	const [host, setHost] = useState<string>();

	useEffect(() => {
		if (window.location.host !== host) {
			setHost(window.location.host);
		}
	}, [host]);

	const sandbox = useSandbox();
	const configLoaded = globalStore.use.configLoaded();
	const loadConfig = globalStore.use.loadConfig();
	const filters = globalStore.use.filters();
	const buckets = globalStore.use.buckets();
	const addLogs = globalStore.use.addLogs();
	const createFilter = globalStore.use.createFilter();
	const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
	const [logCountsByBucket, setLogCountsByBucket] = useState<Record<string, number>>({});
	const [logCountsByFilter, setLogCountsByFilter] = useState<Record<string, number>>({});

	useEffect(() => {
		const filterUnsubs = Array.from(filters.keys()).map((filterId) => {
			return filters.get(filterId)!.subscribe(
				(s) => s.data.logs.length,
				(length) => setLogCountsByFilter((prev) => ({ ...prev, [filterId]: length }))
			);
		});
		const bucketUnsubs = Array.from(buckets.keys()).map((bucketId) => {
			return buckets.get(bucketId)!.subscribe(
				(s) => s.data.logs.length,
				(length) => setLogCountsByBucket((prev) => ({ ...prev, [bucketId]: length }))
			);
		});

		const filterCounts: Record<string, number> = {};
		const bucketCounts: Record<string, number> = {};

		for (const [filterId, filter] of filters) {
			filterCounts[filterId] = filter.getState().data.logs.length;
		}

		for (const [bucketId, bucket] of buckets) {
			bucketCounts[bucketId] = bucket.getState().data.logs.length;
		}

		setLogCountsByFilter(filterCounts);
		setLogCountsByBucket(bucketCounts);

		return () => {
			filterUnsubs.forEach((unsub) => unsub());
			bucketUnsubs.forEach((unsub) => unsub());
		};
	}, [filters, buckets]);

	const bucketIds = globalStore.use((state) =>
		Array.from(state.buckets.keys()).filter(
			(bucket) => state.buckets.get(bucket)?.getState().data?.logs?.length ?? 0 > 0
		)
	);
	const filterIds = globalStore.use((state) => Array.from(state.filters.keys()));
	const [filterNamesById, setFilterNamesById] = useState<Record<string, string>>({});

	useEffect(() => {
		const namesById: Record<string, string> = {};
		for (const [filterId, filter] of filters) {
			namesById[filterId] = filter.getState().data.name;
		}
		setFilterNamesById(namesById);

		const unsubs = Array.from(filters.keys()).map((filterId) => {
			return filters.get(filterId)!.subscribe(
				(s) => s.data.name,
				(name) => setFilterNamesById((prev) => ({ ...prev, [filterId]: name }))
			);
		});

		return () => {
			for (const unsub of unsubs) {
				unsub();
			}
		};
	}, [filters]);

	const onMessage = useCallback(
		(evt: MessageEvent) => {
			const newLogs = JSON.parse(evt.data) as LogData[];
			setTimeout(() => addLogs(newLogs, sandbox), 0);
		},
		[addLogs, sandbox]
	);

	useWebSocket(`ws://${host}/api/sockets/out`, { onMessage }, host !== undefined && configLoaded);

	const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
	const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

	const onSelectBucket = useCallback(
		(bucketId: string) => {
			setSelectedBucket(bucketId);
			setSelectedFilter(null);
		},
		[setSelectedBucket]
	);

	const onSelectFilter = useCallback((filterId: string) => {
		setSelectedBucket(null);
		setSelectedFilter(filterId);
	}, []);

	const onCreateFilter = useCallback(() => {
		(async () => {
			const filterId = await createFilter(sandbox);
			setSelectedBucket(null);
			setSelectedFilter(filterId);
		})();
	}, [createFilter, sandbox]);

	useEffect(() => {
		if (!selectedBucket && !selectedFilter && bucketIds.length > 0) {
			setSelectedBucket(bucketIds[0]);
		} else if (selectedFilter && !filterIds.includes(selectedFilter)) {
			setSelectedFilter(filterIds[filterIds.length - 1]);
		}
	}, [bucketIds, filterIds, filterIds.length, selectedBucket, selectedFilter]);

	useEffect(() => {
		if (configLoaded) {
			return;
		}

		loadConfig(sandbox);
	}, [configLoaded, loadConfig, sandbox]);

	const openSettings = useCallback(() => {
		setSettingsOpen(true);
	}, []);

	const closeSettings = useCallback(() => {
		setSettingsOpen(false);
	}, []);

	return (
		<main className="font-[Inter] flex min-h-screen max-h-screen max-w-[100vw] p-0 overflow-hidden">
			<Tooltip
				id="tooltip"
				className="text-xs px-3 py-1 rounded z-[200]"
				disableStyleInjection
				clickable
			/>
			<SettingsDialog open={settingsOpen} onClose={closeSettings} />
			<div className="flex flex-col basis-[15rem] grow-0 shrink-0 shadow-xl z-10 overflow-hidden">
				<div className="shrink-0 grow-0 basis-20 bg-slate-800 flex items-center px-6 text-3xl">
					<span className="text-sky-500">{'Bu'}</span>
					<span className="text-gray-100">{'log'}</span>
				</div>
				<div className="bg-slate-700 flex flex-col grow">
					<div className="py-6 flex flex-col" data-cy="bucket-tabs">
						<div className="px-6 group w-full flex items-center justify-start py-3">
							<span className="text-xs font-medium text-white/50">{'BUCKETS'}</span>
						</div>
						{bucketIds.map((bucketId, index) => (
							<Tab
								key={index}
								id={bucketId}
								title={bucketId}
								count={logCountsByBucket[bucketId]}
								selected={bucketId === selectedBucket}
								onClick={onSelectBucket}
							/>
						))}
					</div>
					<div className="py-6 grow flex flex-col" data-cy="filter-tabs">
						<div className="px-6 group w-full flex items-center justify-start py-3">
							<span className="text-xs font-medium text-white/50">{'FILTERS'}</span>
						</div>
						{filterIds.map((filterId) => (
							<Tab
								key={filterId}
								id={filterId}
								title={filterNamesById[filterId]}
								count={logCountsByFilter[filterId] ?? 0}
								selected={filterId === selectedFilter}
								onClick={onSelectFilter}
							/>
						))}
						<div className="px-6 w-full flex items-center justify-start text-slate-400">
							<div
								className="grow flex items-center justify-start pr-4"
								style={
									filterIds.length === 0
										? undefined
										: {
												paddingTop: '0.75rem',
												marginTop: '0.75rem',
												borderTop: '1px solid rgb(71, 85, 105)'
											}
								}
							>
								<div
									className="grow flex items-center justify-start py-3 hover:text-sky-400 cursor-pointer"
									data-cy="new-filter-button"
									onClick={onCreateFilter}
								>
									<MdAddCircleOutline className="text-md" />
									<span className="text-xs ml-2 relative top-[-1px]">{'Add filter'}</span>
								</div>
							</div>
						</div>
					</div>
					<div className="py-6 mx-6 basis-auto overflow-y-auto flex flex-col border-t border-slate-600">
						<button
							className="flex items-center cursor-pointer text-slate-400 hover:text-slate-300 disabled:opacity-50 active:text-slate-200"
							data-cy="settings-button"
							onClick={openSettings}
							disabled={!configLoaded}
						>
							<IoMdSettings className="text-xl" />
							<span className="pl-4 text-xs font-medium relative">{'Settings'}</span>
						</button>
					</div>
				</div>
			</div>
			{selectedBucket && globalStore.getState().buckets.has(selectedBucket) && (
				<BucketView bucket={selectedBucket} />
			)}
			{selectedFilter && globalStore.getState().filters.has(selectedFilter) && (
				<FilterView filterId={selectedFilter} />
			)}
		</main>
	);
}
