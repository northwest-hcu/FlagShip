import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  server: {
    watch: { usePolling: process.env.FLAGSHIP_WATCH_POLLING === '1' }
  }
});
