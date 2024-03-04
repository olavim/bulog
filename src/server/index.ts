import http from 'http';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import setupWebSocketServer from './sockets/index.js';

const port = parseFloat(process.env.PORT || '3000');
const host = process.env.HOST || '0.0.0.0';

async function startServer() {
    const app = express();

    const vite = await createViteServer({
        server: { middlewareMode: true },
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        appType: 'spa'
    });

    app.get('/health', (_req, res) => {
        res.status(200).send({ started: true });
    });

    app.use(vite.middlewares);

    const server = http.createServer(app);
    setupWebSocketServer(server);

    server.listen(port, host, () => {
        console.log(`Server running at ${host}:${port}`);
    });
}

startServer();
