import type { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { NextResponse } from 'next/server';
import { broadcast } from '../broadcast';

export function SOCKET(
    client: WebSocket,
    request: IncomingMessage,
    server: WebSocketServer,
) {
    client.on('message', data => {
        const { bucket, message } = JSON.parse(data.toString());
        broadcast(bucket, message);
    });
}

export function GET() {
    return NextResponse.json({ status: 200 });
}
