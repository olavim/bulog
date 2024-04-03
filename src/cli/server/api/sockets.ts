import { Server } from 'http';
import { WebSocketServer } from 'ws';
import Comms from '../comms.js';

export default function setupWebSocketServer(server: Server, comms: Comms) {
	const wssIn = new WebSocketServer({ noServer: true });
	const wssOut = new WebSocketServer({ noServer: true });

	wssIn.on('connection', (ws) => {
		ws.on('message', (data) => {
			const { bucket, message, extraFields } = JSON.parse(data.toString());
			comms.broadcast(bucket, message, extraFields);
		});
	});

	wssOut.on('connection', (ws) => {
		const id = comms.addMessageListener((logs) => {
			ws.send(JSON.stringify(logs));
		});

		ws.on('close', () => {
			comms.removeMessageListener(id);
		});
	});

	server.on('upgrade', (request, socket, head) => {
		if (request.url === '/api/sockets/in') {
			wssIn.handleUpgrade(request, socket, head, (ws) => {
				wssIn.emit('connection', ws, request);
			});
		} else if (request.url === '/api/sockets/out') {
			wssOut.handleUpgrade(request, socket, head, (ws) => {
				wssOut.emit('connection', ws, request);
			});
		} else {
			socket.destroy();
		}
	});
}
