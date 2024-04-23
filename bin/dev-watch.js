const chokidar = await import('chokidar');
const path = await import('path');
const { fileURLToPath } = await import('url');
const { spawn } = await import('child_process');
const { onExit } = await import('signal-exit');

const dirname = path.dirname(fileURLToPath(import.meta.url));
const watchDirs = [path.resolve(dirname, '../src/cli'), path.resolve(dirname, 'dev.js')];
const ignored = [path.resolve(dirname, '../src/cli/server/views')];

let childExitPromise;

const getChild = () => {
	const child = spawn(
		'node',
		[
			path.resolve(dirname, '../node_modules/tsx/dist/cli.mjs'),
			path.resolve(dirname, 'dev.js'),
			...process.argv.slice(2)
		],
		{ stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }
	);
	child.on('error', (err) => {
		console.log(err);
		// Ignore errors
	});
	childExitPromise = new Promise((resolve) =>
		child.on('exit', () => {
			console.log('Process exited. Waiting for changes...');
			resolve();
		})
	);
	return child;
};

let child = getChild();
let restarting = false;

chokidar.watch(watchDirs, { ignoreInitial: true, ignored }).on('all', async (event, path) => {
	if (restarting || !['add', 'addDir', 'change'].includes(event)) {
		return;
	}

	restarting = true;
	console.log('Restarting CLI...');

	// Windows doesn't handle POSIX signals, so we have to use IPC
	child.send('shutdown');
	await childExitPromise;

	child = getChild();
	restarting = false;
});

onExit(async () => {
	if (child) {
		console.log('Shutting down CLI...');
		child.send('shutdown');
		try {
			const timeoutPromise = new Promise((_res, rej) => setTimeout(rej, 1000));
			await Promise.race([childExitPromise, timeoutPromise]);
		} catch {
			child.kill();
		}
		process.exit(0);
	}
});
