#!/usr/bin/env node_modules/.bin/tsx watch

import path from 'path';
import { fileURLToPath } from 'url';

(async () => {
	const dirname = path.dirname(fileURLToPath(import.meta.url));

	const oclif = await import('@oclif/core');
	await oclif.execute({
		development: true,
		loadOptions: {
			root: path.resolve(dirname, '..')
		}
	});
})();
