import { Server } from 'http';
import { WebSocketServer } from 'ws';
import Comms from '../comms.js';

export default function setupWebSocketServer(server: Server, opts: ServerOptions) {
	const wssIn = new WebSocketServer({ noServer: true });
	const wssOut = new WebSocketServer({ noServer: true });
	const comms = new Comms(wssOut, opts);

	wssIn.on('connection', (ws) => {
		ws.on('message', (data) => {
			const { bucket, message, extraFields } = JSON.parse(data.toString());
			comms.broadcast(bucket, message, extraFields);
		});
	});

	wssOut.on('connection', (ws) => {
		comms.sendQueuedLogs(ws);
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
