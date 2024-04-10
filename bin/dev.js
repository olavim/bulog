#!/usr/bin/env node_modules/.bin/tsx watch

const fs = await import('fs');
const path = await import('path');
const { fileURLToPath } = await import('url');
const pjson = JSON.parse(await fs.promises.readFile('package.json', 'utf8'));

pjson.oclif.commands = './src/cli/commands';
pjson.oclif.helpClass = './src/cli/help';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const oclif = await import('@oclif/core');
await oclif.execute({
	development: true,
	loadOptions: {
		pjson,
		root: path.resolve(dirname, '..')
	}
});
