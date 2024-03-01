import type { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { NextResponse } from 'next/server';

export function SOCKET(
    client: WebSocket,
    request: IncomingMessage,
    server: WebSocketServer,
) {
    (global as any)["wsOut"] = server;
}

export function GET() {
    return NextResponse.json({ status: 200 });
}
