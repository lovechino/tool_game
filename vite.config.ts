import { defineConfig } from 'vite';

export default defineConfig({
    publicDir: process.env.PUBLIC_DIR || 'public',
    build: {
        outDir: process.env.OUT_DIR || 'dist',
        emptyOutDir: true
    },
    server: {
        open: true, // tự động mở browser
    },
});
