import { defineConfig } from 'cypress';
import { WebSocket } from 'ws';

const host = 'localhost:3000';

export default defineConfig({
	e2e: {
		baseUrl: `http://${host}`,
		setupNodeEvents(on) {
			on('task', {
				log(message) {
					console.log(message);
					return null;
				},
				sendLogs(logs: object[]) {
					const socket = new WebSocket(`ws://${host}/api/sockets/in`, {
						handshakeTimeout: 1000
					});
					socket.on('open', () => {
						for (const log of logs) {
							socket.send(JSON.stringify(log));
						}
					});
					return null;
				}
			});
		}
	}
});
