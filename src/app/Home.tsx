import { useState, useEffect, useCallback } from "react";
import Tab from "@/components/Tab";
import { Tooltip } from "react-tooltip";
import BucketView from "@/components/BucketView";
import useBuckets from "@/hooks/useBuckets";
import useFilters from "@/hooks/useFilters";
import { MdAddCircle } from 'react-icons/md';
import FilterView from "./components/FilterView";
import useLogs from "./hooks/useLogs";
import useWebSocket from "react-use-websocket";

export default function Home() {
  const [host, setHost] = useState<string>();

  useEffect(() => {
    if (window.location.host !== host) {
      setHost(window.location.host);
    }
  }, [host]);

  const { logs, addLogs } = useLogs();

  const {
    buckets,
    loadConfig: loadBucketConfig,
    configLoaded: bucketConfigLoaded,
    saveConfig: saveBucketConfig,
    addLogs: addLogsToBucket
  } = useBuckets();

  const {
    filters,
    loadConfig: loadFilterConfig,
    configLoaded: filterConfigLoaded,
    saveConfig: saveFilterConfig,
    createFilter,
    addLogs: addLogsToFilter
  } = useFilters();

  const onMessage = useCallback((evt: MessageEvent) => {
    const json = JSON.parse(evt.data) as LogMessage;
    const newLogs = json.logs;
    addLogs(newLogs);
  }, [addLogs]);

  useWebSocket(`ws://${host}/api/sockets/out`, { onMessage }, host !== undefined && bucketConfigLoaded && filterConfigLoaded);

  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<number>(-1);

  const bucketNames = Array.from(buckets.keys()).filter(bucket => buckets.get(bucket)?.logs);
  const filterNames = Array.from(filters.keys());

  const onSelectBucket = useCallback((bucket: string) => {
    setSelectedBucket(bucket);
    setSelectedFilter(-1);
  }, [setSelectedBucket]);

  const onSelectFilter = useCallback((filter: string) => {
    setSelectedBucket(null);
    setSelectedFilter(filterNames.indexOf(filter));
  }, [filterNames]);

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
  }, [bucketNames, buckets, filterNames.length, selectedBucket, selectedFilter]);

  useEffect(() => {
    (async () => {
      await loadBucketConfig();
      await loadFilterConfig();
    })();
  }, [loadBucketConfig, loadFilterConfig]);

  useEffect(() => {
    (async () => {
      if (bucketConfigLoaded) {
        await saveBucketConfig();
      }
    })();
  }, [buckets, bucketConfigLoaded, saveBucketConfig]);

  useEffect(() => {
    (async () => {
      if (filterConfigLoaded) {
        await saveFilterConfig();
      }
    })();
  }, [filters, filterConfigLoaded, saveFilterConfig]);

  const [processed, setProcessed] = useState(0);

  const processNewBucketLogs = useCallback((logs: LogData[]) => {
    const groups = {} as { [bucket: string]: LogData[] };

    for (const log of logs) {
      if (!groups[log.bucket]) {
        groups[log.bucket] = [];
      }

      groups[log.bucket].push(log);
    }

    for (const bucket of Object.keys(groups)) {
      addLogsToBucket(bucket, groups[bucket]);
    }
  }, [addLogsToBucket]);

  const processNewFilterLogs = useCallback(async (logs: LogData[]) => {
    for (const filter of filters.keys()) {
      const fn = filters.get(filter)!.filterFunction;
      const predicates = await fn(logs);
      addLogsToFilter(filter, logs.filter((_, i) => predicates[i]));
    }
  }, [addLogsToFilter, filters]);

  useEffect(() => {
    if (logs.length > processed) {
      const newLogs = logs.slice(processed);
      const lastProcessedLogId = logs[processed - 1]?.id;
      const lastNewLogId = newLogs[newLogs.length - 1]?.id;

      if (lastProcessedLogId !== lastNewLogId) {
        processNewBucketLogs(newLogs);
        processNewFilterLogs(newLogs);
      }

      setProcessed(logs.length);
    }
  }, [logs, processed, processNewBucketLogs, processNewFilterLogs]);

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
            <span className="text-xs font-medium text-white/50">
              {'BUCKETS'}
            </span>
          </div>
          {bucketConfigLoaded && bucketNames.map((bucket, index) => (
            <Tab key={index} title={bucket} selected={bucket === selectedBucket} onClick={onSelectBucket} />
          ))}
        </div>
        <div className="py-6 grow overflow-y-auto flex flex-col bg-slate-700 shadow-lg z-10">
          <div className="group w-full flex items-center justify-start py-3 px-6">
            <span className="text-xs font-medium text-white/50">
              {'FILTERS'}
            </span>
            <button onClick={onCreateFilter} className="ml-4">
              <MdAddCircle className="text-slate-400 hover:text-slate-300 text-md" />
            </button>
          </div>
          {filterConfigLoaded && filterNames.map((_filter, index) => (
            <Tab key={index} title={filterNames[index]} selected={index === selectedFilter} onClick={onSelectFilter} />
          ))}
        </div>
      </div>
      {selectedBucket && <BucketView bucket={selectedBucket} />}
      {selectedFilter !== -1 && <FilterView filter={filterNames[selectedFilter]} />}
    </main >
  );
}
