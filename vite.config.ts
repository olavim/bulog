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
        sandbox: path.resolve(dirname, 'src/app/sandbox/index.html'),
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(dirname, 'src/app') },
  }
});
