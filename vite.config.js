import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A relative base ("./") makes every built asset URL relative to index.html,
// so the same build works at the domain root, at a GitHub Pages repository
// subpath (https://<user>.github.io/<repo>/) or opened from any folder.
// Set VITE_BASE (e.g. "/OrbitLab/") to force an absolute base if preferred.
export default defineConfig({
  base: process.env.VITE_BASE || './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
