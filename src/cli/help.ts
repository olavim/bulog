import { Command, Help } from '@oclif/core';

export default class CustomHelp extends Help {
	formatCommands(commands: Array<Command.Loadable>): string {
		if (commands.length === 0) {
			return '';
		}

		const body = this.renderList(
			commands
				// If aliases do not contain the current command's id then it's the "main" command
				.filter((cmd) => cmd.aliases.every((alias) => alias !== cmd.id))
				.map((cmd) => {
					if (this.config.topicSeparator !== ':') {
						cmd.id = cmd.id.replace(/:/g, this.config.topicSeparator);
					}

					return [[cmd.id, ...cmd.aliases].join(', '), this.summary(cmd)];
				}),
			{
				spacer: '\n',
				stripAnsi: this.opts.stripAnsi,
				indentation: 2
			}
		);

		return this.section('COMMANDS', body);
	}
}
