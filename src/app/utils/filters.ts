import { Sandbox } from '@context/SandboxContext';
import { createDefaultColumns } from './columns';

const defaultPredicateString = `
const _ = require('lodash');

return log => {
  return true;
};
`.trim();

export function createFilter(base?: Partial<FilterConfig>): FilterConfig {
	return {
		name: base?.name ?? 'New Filter',
		filter: base?.filter ?? defaultPredicateString,
		columns: base?.columns ?? createDefaultColumns()
	};
}

export async function filterConfigToData(
	config: FilterConfig,
	sandbox: Sandbox
): Promise<FilterData> {
	return {
		logs: [],
		name: config.name,
		columns: config.columns,
		predicateString: config.filter,
		predicate: await sandbox.createCallback(config.filter),
		logRenderer: await sandbox.createLogRenderer(config.columns)
	};
}

export function filterDataToConfig(data: FilterData): FilterConfig {
	return {
		columns: data.columns,
		filter: data.predicateString,
		name: data.name
	};
}
