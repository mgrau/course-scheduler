import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base so the built site works at any GitHub Pages sub-path.
  base: './',
  plugins: [svelte(), tailwindcss()],
});
