import { Command, Flags } from '@oclif/core';
import { getServerConfig, resetTempConfigs, validateConfigs } from '@cli/utils/config.js';
import { releaseInstance, reserveInstance, saveInstanceConfig } from '@cli/utils/instance.js';
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

		if (process.env.NODE_ENV === 'development') {
			process.on('message', (msg) => {
				if (msg === 'shutdown') {
					releaseInstance(flags.instance);
					process.exit(0);
				}
			});
		}

		try {
			await reserveInstance(flags.instance);
		} catch (err) {
			this.error(`Instance "${flags.instance}" is already running`, { exit: 1 });
		}

		const getEnv = async (): Promise<BulogEnvironment> => {
			const config = await getServerConfig(flags.instance, flags.tempConfig);
			return {
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
		};

		// const existingInstance = await getInstanceConfig(flags.instance);
		// if (existingInstance) {
		// 	let runningInstanceName: string | null = null;
		// 	try {
		// 		const res = await fetch(
		// 			`http://${existingInstance.replace('0.0.0.0:', '127.0.0.1:')}/api/health`
		// 		);
		// 		runningInstanceName = (await res.json()).instance;
		// 	} catch (err: any) {
		// 		// All good
		// 	}

		// 	if (runningInstanceName) {
		// 		this.error(
		// 			runningInstanceName === flags.instance
		// 				? `Instance "${runningInstanceName}" is already running on port ${existingInstance.split(':')[1]}`
		// 				: `Port ${existingInstance.split(':')[1]} is already in use`,
		// 			{ exit: 1 }
		// 		);
		// 	}
		// }

		if (flags.tempConfig) {
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
