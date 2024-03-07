import { Sandbox } from "@/context/SandboxContext";
import { v4 as uuidv4 } from 'uuid';

export async function columnConfigToData(config: ColumnConfig, sandbox: Sandbox): Promise<ColumnData> {
    return {
        id: uuidv4(),
        name: config.name,
        width: config.width,
        formatterString: config.formatter,
        formatterFunction: await sandbox.createCallback(config.formatter)
    };
}

export function columnDataToConfig(data: ColumnData): ColumnConfig {
    return {
        name: data.name,
        width: data.width,
        formatter: data.formatterString
    };
}

export async function bucketConfigToData(config: BucketConfig, sandbox: Sandbox): Promise<BucketData> {
    return {
        logs: [],
        columns: await Promise.all(config.columns.map(async col => columnConfigToData(col, sandbox)))
    };
}

export function bucketDataToConfig(data: BucketData): BucketConfig {
    return {
        columns: (data.columns ?? []).map(columnDataToConfig)
    };
}

export async function filterConfigToData(config: FilterConfig, sandbox: Sandbox): Promise<FilterData> {
    return {
        logs: [],
        columns: await Promise.all(config.columns.map(async col => columnConfigToData(col, sandbox))),
        filterString: config.filter,
        filterFunction: await sandbox.createCallback(config.filter)
    };
}

export function filterDataToConfig(data: FilterData): FilterConfig {
    return {
        columns: (data.columns ?? []).map(columnDataToConfig),
        filter: data.filterString
    };
}
