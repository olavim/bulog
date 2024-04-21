import { Command, Flags } from '@oclif/core';
import {
	getBackendConfig,
	resetTempConfigs,
	validateBackendConfigs
} from '@cli/utils/backend-config.js';
import { releaseInstance, reserveInstance, saveInstanceConfig } from '@cli/utils/instance.js';
import { SystemSignals } from '@cli/server/system-signals.js';
import { getServer } from '@server/index.js';
import type { Server } from 'http';
import { Socket } from 'net';
import isValidFilename from 'valid-filename';
import { InferredFlags } from '@oclif/core/lib/interfaces';
import { ServerConfig } from '@/types';

export interface BulogEnvironment {
	flags: InferredFlags<typeof Start.flags>;
	config: ServerConfig;
	port: number;
	host: string;
	memorySize: number;
}

export class Start extends Command {
	static description = 'Starts the Bulog server';

	static examples = [
		'Start an instance\n  $ bulog start',
		'Start an instance on port 3000\n  $ bulog start -p 3000',
		'Start an instance with the name "my-instance" on port 7000\n  $ bulog start -p 7000 -i my-instance'
	];

	static flags = {
		port: Flags.integer({
			name: 'jeejee',
			char: 'p',
			helpValue: '<port>',
			description: 'Server port to bind to.'
		}),
		host: Flags.string({
			char: 'h',
			helpValue: '<host>',
			description: 'Server hostname to bind or connect to.'
		}),
		instance: Flags.string({
			char: 'i',
			helpValue: '<name>',
			default: 'default',
			description: 'Server instance name to use. Instances have separate configurations.'
		}),
		['memory-size']: Flags.integer({
			char: 'm',
			min: 0,
			description:
				'Number of logs to keep in memory. Logs in memory are sent to clients when they connect.'
		}),
		['temp-config']: Flags.boolean({
			description: "Use a temporary configuration that doesn't persist after the server is closed.",
			default: false
		}),
		['no-auth']: Flags.boolean({
			description: 'Temporarily disable authentication and make the server publicly accessible.',
			default: false
		})
	};

	async run() {
		const { flags } = await this.parse(Start);

		if (process.env.NODE_ENV === 'development') {
			process.on('message', (msg) => {
				if (msg === 'shutdown') {
					releaseInstance(flags.instance);
					process.exit(0);
				}
			});
		}

		if (!isValidFilename(flags.instance)) {
			this.error('Invalid instance name. Instance name should also be a safe filename.', {
				exit: 1
			});
		}

		try {
			await reserveInstance(flags.instance);
		} catch (err) {
			this.error(`Instance "${flags.instance}" is already running`, { exit: 1 });
		}

		const getEnv = async (): Promise<BulogEnvironment> => {
			const { server: config } = await getBackendConfig(flags.instance, flags.tempConfig);
			return {
				flags,
				config,
				port: flags.port ?? config.defaults.port,
				host: flags.host ?? config.defaults.hostname,
				memorySize: flags['memory-size'] ?? config.defaults.memorySize
			};
		};

		if (flags.tempConfig) {
			await resetTempConfigs();
		} else {
			try {
				await validateBackendConfigs(flags.instance);
			} catch (e: any) {
				this.error(e.message, { exit: 1 });
			}
		}

		const systemSignals = new SystemSignals();

		let server: Server;
		let nextConnectionId = 0;
		const serverConnections: Record<string, Socket> = {};

		const startServer = async () => {
			const env = await getEnv();
			server = await getServer(env, systemSignals);

			server.on('connection', (socket) => {
				const connectionId = nextConnectionId;
				nextConnectionId++;
				serverConnections[connectionId] = socket;

				socket.on('close', () => {
					delete serverConnections[connectionId];
				});
			});

			try {
				await new Promise<void>((resolve, reject) => {
					server.once('error', reject);
					server.listen(env.port, env.host, resolve);
				});

				const url = `https://${env.host}:${env.port}`;
				this.log(`Bulog is running at ${url}`);

				await saveInstanceConfig(flags.instance, url);
			} catch (err: any) {
				if (err.code === 'EADDRINUSE') {
					this.error(`Port ${env.port} is already in use`, { exit: 1 });
				} else if (err.code === 'ENOTFOUND' || err.code === 'EADDRNOTAVAIL') {
					this.error(`Cannot listen on hostname ${env.host}`, {
						code: err.code
					});
				} else {
					this.error(err.message, { exit: 1 });
				}
			}
		};

		systemSignals.onReboot(async () => {
			this.log('Restarting server...');
			const closePromise = new Promise<void>((resolve) => server.close(() => resolve()));

			for (const socketId of Object.keys(serverConnections)) {
				serverConnections[socketId].destroy();
			}

			await closePromise;
			await new Promise((res) => setTimeout(res, 1000));
			this.log('Server closed...');
			startServer();
		});

		await startServer();
	}
}
