import { WebSocket } from 'ws';
import { Args, Command, Flags } from '@oclif/core';
import JSON5 from 'json5';
import _ from 'lodash';
import { getServerConfig, resetTempConfigs, validateConfigs } from '@/config';

export class Run extends Command {
	static args = {
		bucket: Args.string({
			description: 'Bucket name. Logs are separated by buckets in the Web UI.'
		})
	};

	static description = 'Starts the Bulog server or sends logs to it';

	static usage = `
\b\b\b\b\b\b\b\b\bStart the Bulog server
$ bulog [-h <host>] [-p <port>] [-m <memorySize>] [--tempConfig]

Start a Bulog client and send logs from stdin to a bucket
$ bulog [BUCKET] [-h <host>] [-p <port>] [-v <value>....] [-o]
`;

	static examples = [
		'Start the Bulog server on port 3000\n  $ bulog -p 3000',
		'Send logs to Bulog running on port 3000\n  $ echo "example" | bulog my-app -p 3000',
		'Send logs to Bulog with additional log fields\n  $ echo "example" | bulog my-app -v name:MyApp1 group:MyApps'
	];

	static flags = {
		port: Flags.integer({
			char: 'p',
			hidden: true
		}),
		host: Flags.string({
			char: 'h',
			hidden: true
		}),
		serverPort: Flags.integer({
			helpLabel: '-p, --port',
			helpValue: '<port>',
			description: 'Server port to bind to',
			helpGroup: 'SERVER'
		}),
		serverHost: Flags.string({
			helpLabel: '-h, --host',
			helpValue: '<host>',
			description: 'Server hostname to bind or connect to',
			helpGroup: 'SERVER'
		}),
		memorySize: Flags.integer({
			char: 'm',
			min: 0,
			description:
				'Number of logs to keep in memory. Logs in memory are sent to clients when they connect.',
			helpGroup: 'SERVER'
		}),
		tempConfig: Flags.boolean({
			description: "Use a temporary configuration that doesn't persist after the server is closed",
			default: false,
			helpGroup: 'SERVER'
		}),
		clientPort: Flags.integer({
			helpLabel: '-p, --port',
			helpValue: '<port>',
			description: 'Server port to connect to',
			helpGroup: 'CLIENT'
		}),
		clientHost: Flags.string({
			helpLabel: '-h, --host',
			helpValue: '<host>',
			description: 'Server hostname to connect to',
			helpGroup: 'CLIENT'
		}),
		value: Flags.string({
			char: 'v',
			helpValue: '<value>',
			multiple: true,
			description: 'Value added to logs',
			helpGroup: 'CLIENT'
		}),
		pipeOutput: Flags.boolean({
			char: 'o',
			description: 'Echo logs in addition to sending them to Bulog',
			helpGroup: 'CLIENT'
		})
	};

	async run(): Promise<void> {
		const { args } = await this.parse(Run);

		if (args.bucket) {
			await this.sendInputToServer();
		} else {
			await this.startServer();
		}
	}

	async startServer() {
		const { flags } = await this.parse(Run);
		const { tempConfig } = flags;

		const config = await getServerConfig(tempConfig);

		const host = flags.host ?? config.defaults.hostname;
		const port = flags.port ?? config.defaults.port;
		const memorySize = flags.memorySize ?? config.defaults.memorySize;

		if (tempConfig) {
			await resetTempConfigs();
		} else {
			try {
				await validateConfigs();
			} catch (e: any) {
				this.error(e.message, { exit: 1 });
			}
		}

		const { getServer } = await import('@server/index.js');

		const server = await getServer({ tempConfig, memorySize });

		try {
			await new Promise<void>((resolve, reject) => {
				server.on('error', reject);
				server.listen(port, host, resolve);
			});

			this.log(`Bulog is running at http://${host}:${port}`);
		} catch (err: any) {
			if (err.code === 'EADDRINUSE') {
				this.error(`Port ${port} is already in use`, { exit: 1 });
			} else if (err.code === 'ENOTFOUND' || err.code === 'EADDRNOTAVAIL') {
				this.error(`Cannot listen on hostname ${host}`, {
					code: err.code
				});
			} else {
				this.error(err.message, { exit: 1 });
			}
		}
	}

	async sendInputToServer() {
		const { args, flags } = await this.parse(Run);
		const { bucket } = args;
		const { pipeOutput, value } = flags;

		const config = await getServerConfig(false);

		const defaultHost =
			config.defaults.hostname === '0.0.0.0' ? '127.0.0.1' : config.defaults.hostname;

		const host = flags.host ?? defaultHost;
		const port = flags.port ?? config.defaults.port;

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

		function connect() {
			console.log(`ws://${host}:${port}/api/sockets/in`);
			socket = new WebSocket(`ws://${host}:${port}/api/sockets/in`, {
				handshakeTimeout: 1000
			});

			socket.on('open', () => {
				process.stdin.resume();
			});

			socket.on('error', () => {});

			socket.on('close', () => {
				process.stdin.pause();
				setTimeout(connect, 1000);
			});
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

		connect();
	}
}
