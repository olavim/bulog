export { run } from '@oclif/core';
import { Start } from './commands/start.js';
import { Forward } from './commands/forward/index.js';
import { Where as ConfigWhere } from './commands/config/where.js';

export const commands = {
	start: Start,
	forward: Forward,
	'config:where': ConfigWhere
};
