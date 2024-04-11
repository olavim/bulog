import { WebSocket } from 'ws';
import { Args, Command, Flags } from '@oclif/core';
import JSON5 from 'json5';
import _ from 'lodash';
import { getInstanceConfig, watchInstanceConfig } from '@cli/utils/instance.js';

export class Forward extends Command {
	static aliases = ['fw'];

	static args = {
		bucket: Args.string({
			description: 'Bucket name. Logs are separated by buckets in the Web UI.',
			required: true
		})
	};

	static description = 'Forwards logs from stdin to a Bulog server';

	static examples = [
		'Send logs to bucket "my-app"\n  $ tail -f logs.txt | bulog fw my-app',
		'Send logs to a Bulog instance running at 127.0.0.1:3000\n  $ tail -f logs.txt | bulog fw my-app -p 3000',
		'Send logs to a Bulog instance running at myhost:3000\n  $ tail -f logs.txt | bulog fw my-app -h myhost -p 3000',
		'Send logs with additional log fields\n  $ tail -f logs.txt | bulog fw my-app -v name:MyApp1 group:MyApps',
		'Send logs to a Bulog instance with name "my-instance"\n  $ tail -f logs.txt | bulog fw my-app -i my-instance'
	];

	static flags = {
		port: Flags.integer({
			char: 'p',
			helpValue: '<port>',
			description: 'Server port to connect to',
			default: 3100
		}),
		host: Flags.string({
			char: 'h',
			helpValue: '<host>',
			description: 'Server hostname to connect to',
			default: '127.0.0.1'
		}),
		instance: Flags.string({
			char: 'i',
			helpValue: '<id>',
			description: 'Server instance to connect to',
			exclusive: ['host', 'port'],
			default: 'default'
		}),
		value: Flags.string({
			char: 'v',
			helpValue: '<value>',
			multiple: true,
			description: 'Value added to logs'
		}),
		pipeOutput: Flags.boolean({
			char: 'o',
			description: 'Echo logs in addition to sending them to Bulog'
		})
	};

	async run() {
		const { args, flags, raw } = await this.parse(Forward);
		const { bucket } = args;
		const { pipeOutput, value } = flags;

		const staticConnection = raw.some(
			(arg) => arg.type === 'flag' && ['port', 'host'].includes(arg.flag)
		);
		let connStr: string | null = null;

		if (staticConnection) {
			connStr = `${flags.host}:${flags.port}`;
		} else {
			connStr = await getInstanceConfig(flags.instance);
		}

		const extraFields: any = {};

		for (const val of value ?? []) {
			const [key, value] = val.split(':');
			if (!key || !value) {
				this.error(`Invalid value "${val}". Use --help for more information`, { exit: 1 });
			}
			_.set(extraFields, key, value);
		}

		process.stdin.pause();
		process.stdin.setEncoding('utf8');

		let socket: WebSocket;
		let socketCloseListener = () => {};
		let socketConnectTimeout: NodeJS.Timeout;

		function connect(host: string) {
			socketCloseListener = () => {
				process.stdin.pause();
				socketConnectTimeout = setTimeout(() => connect(host), 5000);
			};

			socket = new WebSocket(`ws://${host}/api/sockets/in`, {
				handshakeTimeout: 1000
			});

			socket.on('open', () => process.stdin.resume());
			socket.on('error', () => {});
			socket.on('close', socketCloseListener);
		}

		let prevChunk = '';

		process.stdin.on('data', (data) => {
			if (pipeOutput) {
				process.stdout.write(data);
			}

			const lines = data.toString().split('\n');
			lines[0] = prevChunk + lines[0];

			const messages: any[] = [];

			for (let i = 0; i < lines.length - 1; i++) {
				if (lines[i].trim().startsWith('{')) {
					let jsonChunk = '';
					let foundJson = false;

					for (let j = i; j < lines.length - 1; j++) {
						jsonChunk += lines[j];

						if (lines[j].trim().endsWith('}')) {
							try {
								messages.push(JSON5.parse(jsonChunk));
								foundJson = true;
								i = j;
								break;
							} catch {
								// Ignore error
							}
						}
					}

					if (!foundJson) {
						messages.push(lines[i]);
					}
				} else {
					messages.push(lines[i]);
				}
			}

			for (const message of messages) {
				socket.send(JSON.stringify({ bucket, message, extraFields }));
			}

			prevChunk = lines[lines.length - 1];
		});

		process.stdin.on('end', () => {
			if (prevChunk) {
				socket.send(JSON.stringify({ bucket, message: prevChunk, extraFields }));
			}
			process.exit();
		});

		if (connStr) {
			connect(connStr);
		}

		if (!staticConnection) {
			watchInstanceConfig(flags.instance, (newConnStr) => {
				if (!newConnStr) {
					return;
				}

				if (socket) {
					clearTimeout(socketConnectTimeout);
					process.stdin.pause();
					socket.off('close', socketCloseListener);
					socket.close();
				}

				connect(newConnStr);
			});
		}
	}
}
