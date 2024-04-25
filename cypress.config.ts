import { defineConfig } from 'cypress';
import { WebSocket } from 'ws';

const host = 'localhost:3400';

export default defineConfig({
	e2e: {
		baseUrl: `http://${host}`,
		experimentalSkipDomainInjection: ['localhost'],
		setupNodeEvents(on) {
			on('task', {
				log(message) {
					console.log(message);
					return null;
				},
				sendLogsToBulog(logs: object[]) {
					const socket = new WebSocket(`ws://${host}/io/logs/write`, {
						handshakeTimeout: 1000
					});
					socket.on('open', async () => {
						console.log('sending logs');
						for (const log of logs) {
							await new Promise((res) => setTimeout(res, 0));
							socket.send(JSON.stringify(log));
						}
					});
					return null;
				}
			});
		}
	}
});
