export function routeExists(
	target: any,
	path: string,
	method: string = 'get',
	strict: boolean = true,
	history: any[] = []
): boolean {
	if (path === '' && target.route?.methods[method]) {
		return true;
	}

	let match = false;
	const stack: any[] = (target._router?.stack ?? target.handle?.stack ?? []).slice();

	for (const layer of stack) {
		if (layer.regexp && (!strict || layer.regexp.fast_star === false) && layer.regexp.test(path)) {
			match =
				match ||
				routeExists(layer, path.replace(layer.regexp, ''), method, strict, [
					...history,
					layer.regexp
				]);
		}
	}

	return match;
}
