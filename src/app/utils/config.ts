import { Sandbox } from '@/context/SandboxContext';
import { nanoid } from 'nanoid';

export function columnConfigToData(config: ColumnConfig): ColumnData {
	return {
		id: nanoid(16),
		name: config.name,
		width: config.width,
		formatterString: config.formatter
	};
}

export function columnDataToConfig(data: ColumnData): ColumnConfig {
	return {
		name: data.name,
		width: data.width,
		formatter: data.formatterString
	};
}

export async function bucketConfigToData(
	config: BucketConfig,
	sandbox: Sandbox
): Promise<BucketData> {
	const columns = config.columns.map(columnConfigToData);
	return {
		logs: [],
		columns,
		logRenderer: await sandbox.createLogRenderer(columns)
	};
}

export function bucketDataToConfig(data: BucketData): BucketConfig {
	return {
		columns: (data.columns ?? []).map(columnDataToConfig)
	};
}

export async function filterConfigToData(
	config: FilterConfig,
	sandbox: Sandbox
): Promise<FilterData> {
	const columns = config.columns.map(columnConfigToData);
	return {
		logs: [],
		columns,
		filterString: config.filter,
		filterFunction: await sandbox.createCallback(config.filter),
		logRenderer: await sandbox.createLogRenderer(columns)
	};
}

export function filterDataToConfig(data: FilterData): FilterConfig {
	return {
		columns: (data.columns ?? []).map(columnDataToConfig),
		filter: data.filterString
	};
}
