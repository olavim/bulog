const json = require('./1MB.json');
const { WebSocket } = require('ws');
const sleep = require('atomic-sleep');

const socket = new WebSocket(`ws://localhost:3000/api/sockets/in`, { handshakeTimeout: 1000 });
const buckets = parseFloat(process.argv[2] ?? '1');
const sleepTime = parseFloat(process.argv[3] ?? '50');

socket.on('open', () => {
    let bucket = 0;
    for (const message of json.slice(0, 1000)) {
        socket.send(JSON.stringify({ bucket: `test-app-${bucket}`, message }));
        bucket = (bucket + 1) % buckets;
        sleep(sleepTime);
    }

    process.exit(0);
});
