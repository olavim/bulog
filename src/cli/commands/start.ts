import { Command, Flags } from '@oclif/core';
import { getServerConfig, resetTempConfigs, validateConfigs } from '@cli/utils/config.js';
import { saveInstanceConfig } from '@cli/utils/instance.js';
import { SystemSignals } from '@cli/server/system-signals.js';
import { getServer } from '@server/index.js';
import type { Server } from 'http';
import { Socket } from 'net';

export class Start extends Command {
	static description = 'Starts the Bulog server';

	static examples = [
		'Start an instance\n  $ bulog start',
		'Start an instance on port 3000\n  $ bulog start -p 3000',
		'Start an instance with the name "my-instance" on port 7000\n  $ bulog start -p 7000 -i my-instance'
	];

	static flags = {
		port: Flags.integer({
			char: 'p',
			helpValue: '<port>',
			description: 'Server port to bind to'
		}),
		host: Flags.string({
			char: 'h',
			helpValue: '<host>',
			description: 'Server hostname to bind or connect to'
		}),
		instance: Flags.string({
			char: 'i',
			helpValue: '<name>',
			default: 'default',
			description: 'Server instance name to use. Instances have separate configurations.'
		}),
		memorySize: Flags.integer({
			char: 'm',
			min: 0,
			description:
				'Number of logs to keep in memory. Logs in memory are sent to clients when they connect.'
		}),
		tempConfig: Flags.boolean({
			description: "Use a temporary configuration that doesn't persist after the server is closed",
			default: false
		})
	};

	async run() {
		const { flags } = await this.parse(Start);
		const { tempConfig } = flags;

		if (tempConfig) {
			await resetTempConfigs();
		} else {
			try {
				await validateConfigs(flags.instance);
			} catch (e: any) {
				this.error(e.message, { exit: 1 });
			}
		}

		const systemSignals = new SystemSignals();

		let server: Server;
		let nextConnectionId = 0;
		const serverConnections: Record<string, Socket> = {};

		const startServer = async () => {
			const config = await getServerConfig(flags.instance, tempConfig);
			const env: BulogEnvironment = {
				host: {
					config: flags.host === undefined,
					value: flags.host ?? config.defaults.hostname
				},
				port: {
					config: flags.host === undefined,
					value: flags.port ?? config.defaults.port
				},
				memorySize: {
					config: flags.memorySize === undefined,
					value: flags.memorySize ?? config.defaults.memorySize
				},
				instance: {
					config: false,
					value: flags.instance
				},
				tempConfig: {
					config: false,
					value: flags.tempConfig
				}
			};

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
					server.listen(env.port.value, env.host.value, resolve);
				});

				const connStr = `${env.host.value}:${env.port.value}`;
				this.log(`Bulog is running at http://${connStr}`);
				await saveInstanceConfig(flags.instance, connStr);
			} catch (err: any) {
				if (err.code === 'EADDRINUSE') {
					this.error(`Port ${env.port.value} is already in use`, { exit: 1 });
				} else if (err.code === 'ENOTFOUND' || err.code === 'EADDRNOTAVAIL') {
					this.error(`Cannot listen on hostname ${env.host.value}`, {
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
