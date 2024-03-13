import { useState, useEffect, useCallback } from 'react';
import Tab from '@/components/Tab';
import { Tooltip } from 'react-tooltip';
import BucketView from '@/components/BucketView';
import { MdAddCircleOutline } from 'react-icons/md';
import FilterView from './components/FilterView';
import useWebSocket from 'react-use-websocket';
import globalStore from './stores/globalStore';
import useSandbox from './hooks/useSandbox';

export default function Home() {
	const [host, setHost] = useState<string>();

	useEffect(() => {
		if (window.location.host !== host) {
			setHost(window.location.host);
		}
	}, [host]);

	const sandbox = useSandbox();
	const bucketConfigLoaded = globalStore.use.bucketConfigLoaded();
	const filterConfigLoaded = globalStore.use.filterConfigLoaded();
	const filters = globalStore.use.filters();
	const buckets = globalStore.use.buckets();
	const [logCountsByBucket, setLogCountsByBucket] = useState<{ [id: string]: number }>({});
	const [logCountsByFilter, setLogCountsByFilter] = useState<{ [id: string]: number }>({});

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

		return () => {
			filterUnsubs.forEach((unsub) => unsub());
			bucketUnsubs.forEach((unsub) => unsub());
		};
	}, [filters, buckets, logCountsByFilter, logCountsByBucket]);

	const addLogs = globalStore.use.addLogs();
	const createFilter = globalStore.use.createFilter();
	const loadBuckets = globalStore.use.loadBuckets();
	const loadFilters = globalStore.use.loadFilters();

	const bucketNames = globalStore.use((state) =>
		Array.from(state.buckets.keys()).filter(
			(bucket) => state.buckets.get(bucket)?.getState().data?.logs?.length ?? 0 > 0
		)
	);
	const filterNames = globalStore.use((state) => Array.from(state.filters.keys()));

	const onMessage = useCallback(
		(evt: MessageEvent) => {
			const json = JSON.parse(evt.data) as LogMessage;
			const newLogs = json.logs;
			addLogs(newLogs);
		},
		[addLogs]
	);

	useWebSocket(
		`ws://${host}/api/sockets/out`,
		{ onMessage },
		host !== undefined && bucketConfigLoaded && filterConfigLoaded
	);

	const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
	const [selectedFilter, setSelectedFilter] = useState<number>(-1);

	const onSelectBucket = useCallback(
		(bucket: string) => {
			setSelectedBucket(bucket);
			setSelectedFilter(-1);
		},
		[setSelectedBucket]
	);

	const onSelectFilter = useCallback(
		(filter: string) => {
			setSelectedBucket(null);
			setSelectedFilter(filterNames.indexOf(filter));
		},
		[filterNames]
	);

	const onCreateFilter = useCallback(() => {
		setSelectedBucket(null);
		setSelectedFilter(filterNames.length);
		createFilter();
	}, [createFilter, filterNames.length]);

	useEffect(() => {
		if (!selectedBucket && selectedFilter === -1 && bucketNames.length > 0) {
			setSelectedBucket(bucketNames[0]);
		} else if (selectedFilter >= filterNames.length) {
			setSelectedFilter(filterNames.length - 1);
		}
	}, [bucketNames, filterNames.length, selectedBucket, selectedFilter]);

	useEffect(() => {
		if (bucketConfigLoaded || filterConfigLoaded) {
			return;
		}

		loadBuckets(sandbox);
		loadFilters(sandbox);
	}, [bucketConfigLoaded, filterConfigLoaded, loadBuckets, loadFilters, sandbox]);

	return (
		<main className="font-[Inter] flex min-h-screen max-h-screen max-w-[100vw] p-0 overflow-hidden">
			<Tooltip id="tooltip" className="text-xs px-3 py-1 rounded" disableStyleInjection clickable />
			<div className="flex flex-col basis-[15rem] grow-0 shrink-0 shadow-xl z-10 overflow-hidden">
				<div className="shrink-0 grow-0 basis-20 bg-slate-800 flex items-center pl-6 text-3xl">
					<span className="text-sky-500">{'Bu'}</span>
					<span className="text-gray-100">{'log'}</span>
				</div>
				<div className="py-6 overflow-y-auto flex flex-col bg-slate-700 shadow-lg z-10">
					<div className="group w-full flex items-center justify-start py-3 px-6">
						<span className="text-xs font-medium text-white/50">{'BUCKETS'}</span>
					</div>
					{bucketConfigLoaded &&
						bucketNames.map((bucket, index) => (
							<Tab
								key={index}
								title={bucket}
								count={logCountsByBucket[bucket]}
								selected={bucket === selectedBucket}
								onClick={onSelectBucket}
							/>
						))}
				</div>
				<div className="py-6 grow overflow-y-auto flex flex-col bg-slate-700 shadow-lg z-10">
					<div className="group w-full flex items-center justify-start py-3 px-6">
						<span className="text-xs font-medium text-white/50">{'FILTERS'}</span>
					</div>
					{filterConfigLoaded &&
						filterNames.map((filter, index) => (
							<Tab
								key={index}
								title={filter}
								count={logCountsByFilter[filter] ?? 0}
								selected={index === selectedFilter}
								onClick={onSelectFilter}
							/>
						))}
					<div className="w-full flex items-center justify-start pl-6 pr-6 text-slate-400">
						<div
							className="grow flex items-center justify-start pr-4"
							style={
								filterNames.length === 0
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
								onClick={onCreateFilter}
							>
								<MdAddCircleOutline className="text-md" />
								<span className="text-xs ml-2 relative top-[-1px]">{'Add filter'}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			{selectedBucket && globalStore.getState().buckets.has(selectedBucket) && (
				<BucketView bucket={selectedBucket} />
			)}
			{selectedFilter !== -1 && selectedFilter < filterNames.length && (
				<FilterView filter={filterNames[selectedFilter]} />
			)}
		</main>
	);
}
