import { SandboxContext } from '@context/SandboxContext';
import lodash from 'lodash';
import { useContext } from 'react';

const functionModules = [{ name: 'lodash', module: lodash }];

export const createSimpleFunction = <T extends JSONValue, K extends JSONValue>(
	code: string
): ((log: T[]) => Promise<K[]>) => {
	code = functionModules.reduce(
		(str, module) => str.replace(new RegExp(`require\\(.${module.name}.\\)`), `__${module.name}`),
		code
	);

	try {
		const fn = new Function(...functionModules.map((m) => `__${m.name}`), code);
		return async (logs: T[]) => logs.map(fn(...functionModules.map((m) => m.module)));
	} catch (err: any) {
		return async () => {
			throw err;
		};
	}
};

export function useSandbox() {
	return useContext(SandboxContext);
}
