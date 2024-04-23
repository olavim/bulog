import { WebSocket } from 'ws';
import { Args, Command, Flags } from '@oclif/core';
import _ from 'lodash';
import { CLIError } from '@oclif/core/lib/errors/index.js';
import { getInstanceConfig, watchInstanceConfig } from '@cli/utils/instance.js';
import { getLogClientConfig, validateLogClientConfig } from '@cli/utils/log-client-config.js';
import { getAuthConfig } from './get-auth-config.js';
import { getAuthTokenGetter } from './get-auth-token.js';
import { linesToMessages } from './lines-to-messages.js';
import { WebSocketCloseCodes } from '@/codes';

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
		'Send logs to a Bulog instance running at http://localhost:3000\n  $ tail -f logs.txt | bulog fw my-app -u http://localhost:3000',
		'Send logs with additional hard-coded log fields\n  $ tail -f logs.txt | bulog fw my-app -v name:MyApp1 group:MyApps',
		'Send logs to a Bulog instance with name "my-instance"\n  $ tail -f logs.txt | bulog fw my-app -i my-instance'
	];

	static flags = {
		url: Flags.string({
			char: 'u',
			helpValue: '<url>',
			description: 'Bulog instance URL to connect to',
			default: 'http://localhost:3100',
			env: 'BULOG_FW_URL'
		}),
		instance: Flags.string({
			char: 'i',
			helpValue: '<id>',
			description: 'Bulog instance to connect to',
			exclusive: ['url'],
			default: 'default',
			env: 'BULOG_FW_INSTANCE'
		}),
		value: Flags.string({
			char: 'v',
			helpValue: '<value>',
			multiple: true,
			description: 'Value added to logs',
			env: 'BULOG_FW_VALUE'
		}),
		pipeOutput: Flags.boolean({
			char: 'o',
			description: 'Echo logs in addition to sending them to Bulog',
			env: 'BULOG_FW_PIPE_OUTPUT'
		}),
		insecure: Flags.boolean({
			description: 'Allow connections to servers with self-signed certificates',
			default: false,
			env: 'BULOG_FW_INSECURE'
		})
	};

	async run() {
		process.on('SIGINT', () => {
			process.exit();
		});

		process.stdin.pause();
		process.stdin.setEncoding('utf8');

		const { args, flags, raw } = await this.parse(Forward);
		const { bucket } = args;
		const { pipeOutput, value } = flags;

		try {
			await validateLogClientConfig();
		} catch (e: any) {
			this.error(e.message, { exit: 1 });
		}

		const config = await getLogClientConfig(flags.instance);
		const authConfig = getAuthConfig(config);

		const staticConnection = raw.some((arg) => arg.type === 'flag' && arg.flag === 'url');
		const url = staticConnection ? flags.url : await getInstanceConfig(flags.instance);

		const extraFields: any = {};

		for (const val of value ?? []) {
			const [key, value] = val.split(':');
			if (!key || !value) {
				this.error(`Invalid value "${val}". Use --help for more information`, { exit: 1 });
			}
			_.set(extraFields, key, value);
		}

		let socket: WebSocket;
		let socketCloseListener: (code: number, reason: Buffer) => void;
		let socketConnectTimeout: NodeJS.Timeout;

		const getAuthToken = await getAuthTokenGetter({ insecure: flags.insecure, authConfig });

		const connect = async (url: string) => {
			try {
				const authToken = await getAuthToken();

				socketCloseListener = (code, reason) => {
					process.stdin.pause();
					if (code === WebSocketCloseCodes.TOKEN_EXPIRED) {
						// Token expired, try to get new token and reconnect right away
						socketConnectTimeout = setTimeout(() => connect(url), 0);
					} else if (code >= 4000) {
						this.error(reason.toString(), { exit: 1 });
					} else {
						socketConnectTimeout = setTimeout(() => connect(url), 5000);
					}
				};

				const wsProtocol = /^(https|wss):\/\//.test(url) ? 'wss' : 'ws';
				const urlWithoutProtocol = url.replace(/^((http|ws)s?:\/\/)?/, '');

				socket = new WebSocket(`${wsProtocol}://${urlWithoutProtocol}/io/logs/write`, {
					handshakeTimeout: 1000,
					rejectUnauthorized: !flags.insecure,
					headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
				});

				socket.on('open', () => {
					clearTimeout(socketConnectTimeout);
					process.stdin.resume();
				});

				socket.on('error', (err: any) => {
					if (err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
						this.error('Server uses self-signed certificate. Use --insecure to ignore error.', {
							exit: 1
						});
					}

					this.error(err.message, { exit: 1 });
				});
				socket.on('close', socketCloseListener);
			} catch (err: any) {
				if (err instanceof CLIError && (err.oclif.exit as any) === false) {
					socketConnectTimeout = setTimeout(() => connect(url), 5000);
					return;
				} else {
					throw err;
				}
			}
		};

		let prevChunk = '';

		process.stdin.on('data', (data) => {
			if (pipeOutput) {
				process.stdout.write(data);
			}

			const lines = data.toString().split('\n');
			lines[0] = prevChunk + lines[0];

			const messages = linesToMessages(lines.slice(0, -1));

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

		if (url) {
			connect(url);
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
