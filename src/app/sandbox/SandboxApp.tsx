import useGlobalEvent from 'beautiful-react-hooks/useGlobalEvent';
import lodash from 'lodash';
import { useCallback, useEffect, useRef } from 'react';

type JSONFunc = (value: JSONValue) => Promise<JSONValue>;

export default function SandboxApp() {
	const functions = useRef<Record<string, JSONFunc>>({});
	const functionGroups = useRef<Record<string, { [id: string]: JSONFunc }>>({});

	const createFunction = useCallback((code: string) => {
		const wrapperCode = `
const require = name => {
    const m = modules[name];
    if (!m) throw new Error('Module not found: ' + name);
    return m;
};

${code}`;

		try {
			const result = new Function('modules', wrapperCode)({ lodash });
			return typeof result === 'function' ? result : () => result;
		} catch (err) {
			return () => {
				throw err;
			};
		}
	}, []);

	const callFunction = useCallback(
		async (fn: JSONFunc, args: JSONValue[]): Promise<Array<JSONValue | Error>> => {
			return Promise.all(
				args.map(async (arg) => {
					try {
						const res = await fn(arg);

						if (typeof res === 'function') {
							throw new Error('Cannot return a function');
						}

						return res;
					} catch (err: any) {
						return err;
					}
				})
			);
		},
		[]
	);

	const callFunctionGroup = useCallback(
		async (group: { [id: string]: JSONFunc }, args: JSONValue[]) => {
			return Promise.all(
				args.map(async (arg) => {
					const result = {} as { [id: string]: JSONValue | Error };

					for (const key of Object.keys(group)) {
						try {
							result[key] = await group[key](arg);

							if (typeof result[key] === 'function') {
								throw new Error('Cannot return a function');
							}
						} catch (err: any) {
							result[key] = err;
						}
					}

					return result;
				})
			);
		},
		[]
	);

	const onMessage = useGlobalEvent<MessageEvent>('message');
	const onBeforeUnload = useGlobalEvent('beforeunload');

	onMessage(async (evt) => {
		let response;

		if (evt.data.type === 'create-fn') {
			const { id, code } = evt.data;
			functions.current[id] = createFunction(code);
			response = { source: 'sandbox', id, type: 'fn-created' };
		}

		if (evt.data.type === 'create-fn-group') {
			const { id, codes } = evt.data;
			functionGroups.current[id] = Object.keys(codes).reduce(
				(obj, key) => ({ ...obj, [key]: createFunction(codes[key]) }),
				{}
			);
			response = { source: 'sandbox', id, type: 'fn-group-created' };
		}

		if (evt.data.type === 'eval-fn') {
			const { id, fnId, arg } = evt.data;
			const result = await callFunction(functions.current[fnId], arg);
			response = { source: 'sandbox', id, type: 'fn-result', result };
		}

		if (evt.data.type === 'eval-fn-group') {
			const { id, groupId, arg } = evt.data;
			const result = await callFunctionGroup(functionGroups.current[groupId], arg);
			response = { source: 'sandbox', id, type: 'fn-group-result', result };
		}

		if (evt.data.type === 'ping') {
			response = { source: 'sandbox', type: 'pong' };
		}

		window.parent.postMessage(response, evt.origin);
	});

	onBeforeUnload(() => {
		window.parent.postMessage({ source: 'sandbox', type: 'sandbox-unloaded' }, '*');
	});

	useEffect(() => {
		window.parent.postMessage({ source: 'sandbox', type: 'sandbox-loaded' }, '*');
	}, []);

	return (
		<div>
			<h1>Sandbox</h1>
			<p>Nothing to see here</p>
		</div>
	);
}
