import http from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import healthRouter from './api/health.js';
import setupWebSocketServer from './api/sockets.js';

const filename = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(filename), '../../app');

function serveStatic(app: express.Express) {
    app.use(express.static(appRoot));

    app.get('*', (_req, res) => {
        res.sendFile('index.html', { root: appRoot });
    });
}

async function serveVite(app: express.Express) {
    const { createServer: createViteServer } = await import('vite');
    const viteServer = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
    });

    app.use(viteServer.middlewares);
}

export async function getServer() {
    const app = express();

    app.use(healthRouter);

    if (process.env.NODE_ENV === 'production') {
        serveStatic(app);
    } else {
        await serveVite(app);
    }

    const server = http.createServer(app);
    setupWebSocketServer(server);
    return server;
}
