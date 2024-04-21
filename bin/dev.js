import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execute } from '@oclif/core';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(dirname, '../package.json'), 'utf-8'));
pkg.oclif.commands.target = './src/cli/index.ts';
pkg.oclif.help = './src/cli/help.ts';

(async () => {
	await execute({
		development: true,
		loadOptions: {
			root: path.resolve(dirname, '..'),
			pjson: pkg
		}
	});
})();
