import { Command } from '@oclif/core';
import envPaths from 'env-paths';

export class Where extends Command {
	static description = 'Returns the config directory';

	static flags = {};

	async run() {
		console.log(envPaths('bulog').config);
	}
}
