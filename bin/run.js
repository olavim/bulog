#!/usr/bin/env node

(async () => {
	process.env.NODE_ENV = 'production';
	const oclif = await import('@oclif/core');
	await oclif.execute({ development: false, dir: import.meta.url });
})();
