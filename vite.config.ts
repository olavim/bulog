import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import url from 'url';

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// https://vitejs.dev/config/
export default defineConfig({
	root: 'src/app',
	build: {
		outDir: path.resolve(dirname, 'dist/app'),
		emptyOutDir: true,
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			input: {
				main: path.resolve(dirname, 'src/app/index.html'),
				sandbox: path.resolve(dirname, 'src/app/sandbox/index.html')
			},
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						return 'vendor';
					} else {
						return 'main';
					}
				}
			}
		}
	},
	plugins: [react()],
	resolve: {
		alias: {
			'@/schemas': path.resolve(dirname, 'src/schemas.ts'),
			'@/types': path.resolve(dirname, 'src/types.ts'),
			'@/codes': path.resolve(dirname, 'src/codes.ts'),
			'@app': path.resolve(dirname, 'src/app')
		}
	}
});
