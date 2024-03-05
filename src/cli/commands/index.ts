import { WebSocket } from 'ws';
import { Args, Command, Flags } from '@oclif/core';
import JSON5 from 'json5';
import _ from 'lodash';
import { validateConfigs } from '../config.js';

export class Run extends Command {
    static args = {
        bucket: Args.string({ description: 'Bucket name. Logs are separated by buckets in the Web UI.' })
    };

    static description = 'Starts the Bulog server or sends logs to it';

    static usage = [
        '\b[-p <port>] [-h <host>]',
        '\b[BUCKET] [-p <port>] [-h <host>] [-v <value>....] [-o]'
    ];

    static examples = [
        'Start the Bulog server at port 3000\n$ bulog -p 3000',
        'Send logs to Bulog running at port 3000\n  $ echo "example" | bulog my-app -p 3000',
        'Send logs to Bulog with additional log fields\n  $ echo "example" | bulog my-app -v name:MyApp1 group:MyApps'
    ];

    static flags = {
        port: Flags.integer({ char: 'p', helpValue: '<port>', default: 3100, description: 'Server port to bind or connect to' }),
        host: Flags.string({ char: 'h', helpValue: '<host>', default: 'localhost', description: 'Server hostname to bind or connect to' }),
        value: Flags.string({ char: 'v', helpValue: '<value>', multiple: true, description: 'Value added to logs' }),
        pipeOutput: Flags.boolean({ char: 'o', description: 'Echo logs in addition to sending them to Bulog server' })
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
        try {
            await validateConfigs();
        } catch (e: any) {
            this.error(e.message, { exit: 1 });
        }

        const { getServer } = await import('../server/index.js');
        const { flags } = await this.parse(Run);
        const { port, host } = flags;

        const server = await getServer();
        server.listen(port, host, () => {
            this.log(`Bulog is running at http://${host}:${port}`);
        });
    }

    async sendInputToServer() {
        const { args, flags } = await this.parse(Run);
        const { bucket } = args;
        const { port, host, pipeOutput, value } = flags;

        const extraFields: any = {};

        for (const val of value ?? []) {
            const [key, value] = val.split(':');
            if (!key || !value) {
                this.error(`Invalid value "${val}". Use --help for more information`, { exit: 1 });
            }
            _.set(extraFields, key, value);
        }

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
                socket.send(JSON.stringify({ bucket, message, extraFields }));
            }

            prevChunk = lines[lines.length - 1];
        });

        process.stdin.on("end", () => {
            if (prevChunk) {
                socket.send(JSON.stringify({ bucket, message: prevChunk, extraFields }));
            }
            process.exit();
        });

        connect();
    }
}
