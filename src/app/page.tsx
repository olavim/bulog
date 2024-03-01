'use client';

import { useState, useEffect } from "react";
import BucketTab from "@/components/BucketTab";
import { Tooltip } from "react-tooltip";
import BucketLogs from "@/components/BucketLogs";
import { useBuckets } from "@/context/buckets";

export default function Home() {
  const buckets = useBuckets();
  const [selectedBucket, setSelectedBucket] = useState<string>();
  const bucketNames = Array.from(buckets.keys());

  useEffect(() => {
    if (!selectedBucket && bucketNames.length > 0) {
      setSelectedBucket(bucketNames[0]);
    }
  }, [bucketNames, buckets, selectedBucket]);

  return (
    <main className="flex min-h-screen max-h-screen max-w-[100vw] p-0 overflow-hidden">
      <Tooltip id="tooltip" clickable />
      <div className="flex flex-col basis-[15rem] grow-0 shrink-0 shadow-xl z-10">
        <div className="shrink-0 grow-0 basis-20 bg-slate-800 flex items-center pl-6 text-3xl">
          <span className="text-sky-500">{'Bu'}</span>
          <span className="text-gray-100">{'log'}</span>
        </div>
        <div className="py-6 grow overflow-y-auto flex flex-col bg-slate-700 shadow-lg z-10">
          <div className="group w-full flex items-center justify-start py-3 px-6">
            <span className="text-xs font-medium text-white/50">
              {'BUCKETS'}
            </span>
          </div>
          {bucketNames.map((bucket, index) => (
            <BucketTab key={index} bucket={bucket} selected={bucket === selectedBucket} onClick={setSelectedBucket} />
          ))}
        </div>
      </div>
      {selectedBucket && <BucketLogs bucket={selectedBucket} />}
    </main >
  );
}
