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
        const { bucket, message, extraFields } = JSON.parse(data.toString());
        broadcast(bucket, message, extraFields);
    });
}

export function GET() {
    return NextResponse.json({ status: 200 });
}
