const esbuild = await import('esbuild');
const chokidar = await import('chokidar');
const path = await import('path');
const fs = await import('fs');
const { nodeExternalsPlugin } = await import('esbuild-node-externals');
const { fileURLToPath } = await import('url');

const dirname = path.dirname(fileURLToPath(import.meta.url));

const watchDirs = [path.resolve(dirname, '../src/cli'), path.resolve(dirname, '../src/*.ts')];
const tsconfig = path.resolve(dirname, '../tsconfig.cli.json');

const config = {
	entryPoints: [
		path.resolve(dirname, '../src/cli/index.ts'),
		path.resolve(dirname, '../src/cli/help.ts')
	],
	entryNames: '[dir]/[name]',
	platform: 'node',
	format: 'esm',
	bundle: true,
	tsconfig,
	outdir: path.resolve(dirname, '../dist/cli'),
	sourcemap: true,
	splitting: true,
	plugins: [nodeExternalsPlugin()]
};

if (process.argv.includes('--watch')) {
	const ctx = await esbuild.context(config);
	const distExists = fs.existsSync(config.outdir);
	chokidar.watch(watchDirs, { ignoreInitial: distExists }).on('all', async () => {
		await ctx.rebuild();
	});
} else {
	await esbuild.build(config);
}
