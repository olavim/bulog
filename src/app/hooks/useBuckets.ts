import { getBucketsConfig, saveBucketsConfig } from "@/api/config";
import { BucketsContext } from "@/context/BucketsContext";
import { useCallback, useContext, useState } from "react";
import { debounce } from "lodash";
import useSandbox from "./useSandbox";
import { bucketConfigToData } from "@/utils/config";

const saveBucketsConfigDebounced = debounce(saveBucketsConfig, 500);

export default function useBuckets() {
    const [ctx, dispatch] = useContext(BucketsContext);
    const sandbox = useSandbox();
    const [configLoaded, setConfigLoaded] = useState(false);

    const saveConfig = useCallback(async () => {
        if (!configLoaded) {
            return;
        }

        const buckets = Array.from(ctx.buckets.keys());
        const bucketConfigs = buckets.reduce((acc, bucket) => {
            const config = ctx.buckets.get(bucket)!;
            acc[bucket] = {
                columns: (config.columns ?? []).map(col => ({
                    name: col.name,
                    width: col.width,
                    formatter: col.formatterString.trim() + '\n'
                }))
            };
            return acc;
        }, {} as { [bucket: string]: BucketConfig });

        await saveBucketsConfigDebounced(bucketConfigs);
    }, [configLoaded, ctx.buckets]);

    const loadConfig = useCallback(async () => {
        const config = await getBucketsConfig();

        const keys = Object.keys(config?.buckets);

        for (const key of keys) {
            const bucketConfig = config.buckets[key];
            if (!bucketConfig.columns) {
                continue;
            }

            const data = await bucketConfigToData(bucketConfig, sandbox);
            dispatch!({ type: 'setColumns', bucket: key, columns: data.columns });
        }

        setConfigLoaded(true);
    }, [sandbox, dispatch]);

    const addLogs = useCallback((bucket: string, logs: LogData[]) => {
        dispatch!({ type: 'addLogs', bucket, logs });
    }, [dispatch]);

    return { buckets: ctx.buckets, saveConfig, loadConfig, configLoaded, addLogs };
}
