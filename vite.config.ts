import { defineConfig } from 'vite';

export default defineConfig({
    publicDir: process.env.PUBLIC_DIR || 'public',
    build: {
        outDir: process.env.OUT_DIR || 'dist',
        emptyOutDir: true,
        // Optimize for low RAM environments (Render free tier)
        sourcemap: false, // Disable sourcemaps to save memory
        minify: 'esbuild', // Use faster esbuild instead of terser
        rollupOptions: {
            output: {
                manualChunks: undefined // Disable code splitting to reduce memory
            }
        }
    },
    server: {
        open: true, // tự động mở browser
    },
});
