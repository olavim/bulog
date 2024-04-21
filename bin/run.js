#!/usr/bin/env node
import { execute } from '@oclif/core';

(async () => {
	process.env.NODE_ENV = 'production';
	await execute({ development: false, dir: import.meta.url });
})();
