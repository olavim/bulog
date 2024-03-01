import { WebSocket } from 'ws';
import { Args, Command, Flags } from '@oclif/core';
import { fork } from 'child_process';
import * as JSON5 from 'json5';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryFetch = async (url: string, retries = 3, retryDelay = 1000) => {
    return new Promise((resolve, reject) => {
        const wrapper = (n: number) => {
            fetch(url)
                .then((res) => resolve(res))
                .catch(async (err) => {
                    if (n > 0) {
                        await delay(retryDelay);
                        wrapper(--n);
                    } else {
                        reject(err);
                    }
                });
        };

        wrapper(retries);
    });
};

export class Run extends Command {
    static args = {
        bucket: Args.string({ description: 'Bucket name. Logs are separated by buckets in Bulog UI.' })
    };

    static description = 'Starts the Bulog server';

    static usage = [
        '\b\b[-p <port>] [-h <host>]',
        '\b\b[BUCKET] [-p <port>] [-h <host>] [-v <value>....] [-o]'
    ];

    static examples = [
        'Start the Bulog server at port 3000\n$ bulog -p 3000',
        'Send stdin to Bulog running at port 3000\n$ bulog my-bucket -p 3000',
        'Send stdin to Bulog with additional log fields\n$ bulog my-bucket -v name:MyApp1 group:MyApps'
    ];

    static flags = {
        port: Flags.integer({ char: 'p', helpValue: '<port>', default: 3100, description: 'Server port to bind or connect to' }),
        host: Flags.string({ char: 'h', helpValue: '<host>', default: '0.0.0.0', description: 'Server hostname to bind or connect to' }),
        value: Flags.string({ char: 'v', helpValue: '<value>', multiple: true, description: 'Value added to logs' }),
        pipeOutput: Flags.boolean({ char: 'o', description: 'Pipe stdin to stdout in addition to sending it to Bulog server' })
    };

    async run(): Promise<void> {
        const { args } = await this.parse(Run);

        if (args.bucket) {
            await this.sendInputToServer();
        } else {
            await this.startServer();
        }
    }

    async startServer() {
        const { flags } = await this.parse(Run);
        const { port, host } = flags;

        fork('dist/server/server.js', {
            stdio: 'ignore',
            env: {
                ...process.env,
                PORT: String(port),
                HOST: host,
                NEXT_PUBLIC_PORT: String(port),
                NEXT_PUBLIC_HOST: host,
                NEXT_MANUAL_SIG_HANDLE: 'true'
            }
        });

        try {
            await retryFetch(`http://${host}:${port}/api/health`, 10);
        } catch (err: any) {
            this.error('Failed to start Bulog server', { exit: 1 });
        }

        this.log(`Bulog is running at ${host}:${port}`);
    }

    async sendInputToServer() {
        const { args, flags } = await this.parse(Run);
        const { bucket } = args;
        const { port, host, pipeOutput } = flags;

        process.stdin.pause();
        process.stdin.setEncoding('utf8');

        let socket: WebSocket;

        function connect() {
            socket = new WebSocket(`ws://${host}:${port}/api/sockets/in`, { handshakeTimeout: 1000 });

            socket.on('open', () => {
                process.stdin.resume();
            });

            socket.on('error', () => { });

            socket.on('close', () => {
                process.stdin.pause();
                setTimeout(connect, 1000);
            });
        }

        let prevChunk = '';

        process.stdin.on("data", data => {
            if (pipeOutput) {
                process.stdout.write(data);
            }

            const lines = data.toString().split('\n');
            lines[0] = prevChunk + lines[0];

            const messages: any[] = [];

            for (let i = 0; i < lines.length - 1; i++) {
                if (lines[i].trim().startsWith('{')) {
                    let jsonChunk = '';
                    let foundJson = false;

                    for (let j = i; j < lines.length - 1; j++) {
                        jsonChunk += lines[j];

                        if (lines[j].trim().endsWith('}')) {
                            try {
                                messages.push(JSON5.parse(jsonChunk));
                                foundJson = true;
                                i = j;
                                break;
                            } catch {
                                // Ignore error
                            }
                        }
                    }

                    if (!foundJson) {
                        messages.push(lines[i]);
                    }
                } else {
                    messages.push(lines[i]);
                }
            }

            for (const message of messages) {
                socket.send(JSON.stringify({ bucket, message }));
            }

            prevChunk = lines[lines.length - 1];
        });

        process.stdin.on("end", () => {
            if (prevChunk) {
                socket.send(JSON.stringify({ bucket, message: prevChunk }));
            }
            process.exit();
        });

        connect();
    }
}
