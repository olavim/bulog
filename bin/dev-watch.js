const chokidar = await import('chokidar');
const path = await import('path');
const { fileURLToPath } = await import('url');
const { spawn } = await import('child_process');

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(fileURLToPath(import.meta.url));
const watchDirs = [path.resolve(dirname, '../dist/cli/**/*.js'), path.resolve(dirname, 'dev.js')];

let childExitPromise;

const getChild = () => {
	const child = spawn('node', [path.resolve(dirname, 'dev.js'), ...process.argv.slice(2)], {
		stdio: ['inherit', 'inherit', 'inherit', 'ipc']
	});
	childExitPromise = new Promise((resolve) => child.on('exit', resolve));
	return child;
};

let child = getChild();
childExitPromise = new Promise((resolve) => child.on('exit', resolve));

chokidar.watch(watchDirs, { ignoreInitial: true }).on('all', async (event) => {
	if (!['add', 'addDir', 'change'].includes(event)) {
		return;
	}

	console.log('Restarting CLI...');

	// Windows doesn't handle POSIX signals, so we have to use IPC
	child.send('shutdown');
	await childExitPromise;

	child = getChild();
	childExitPromise = new Promise((resolve) => child.on('exit', resolve));
});
