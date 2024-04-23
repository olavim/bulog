export function getRouteHandler(
	target: any,
	path: string,
	method: string = 'get',
	history: any[] = []
): any | null {
	if (path === '' && target.route?.methods[method]) {
		return target.route.stack[target.route.stack.length - 1].handle;
	}

	const stack: any[] = (target._router?.stack ?? target.handle?.stack ?? []).slice();

	for (const layer of stack) {
		if (layer.regexp && layer.regexp.test(path)) {
			const handle = getRouteHandler(layer, path.replace(layer.regexp, ''), method, [
				...history,
				layer.regexp
			]);
			if (handle) {
				return handle;
			}
		}
	}

	return null;
}
