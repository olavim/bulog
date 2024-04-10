import { Sandbox } from '@context/SandboxContext';
import { createDefaultColumns } from './columns';

export async function bucketConfigToData(
	config: BucketConfig,
	sandbox: Sandbox
): Promise<BucketData> {
	return {
		logs: [],
		columns: config.columns,
		logRenderer: await sandbox.createLogRenderer(config.columns)
	};
}

export function bucketDataToConfig(data: BucketData): BucketConfig {
	return {
		columns: data.columns
	};
}

export function createBucket(base?: Partial<BucketConfig>): BucketConfig {
	return {
		columns: base?.columns ?? createDefaultColumns()
	};
}
