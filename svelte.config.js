// Svelte config (A61 full-TS conversion). vitePreprocess enables `<script lang="ts">` in the
// components — esbuild strips the types at build time (no type *checking* here; that's svelte-check).
// vite-plugin-svelte and svelte-check both read this file, so the two share one preprocess setup.
// No new dependency: vitePreprocess ships with @sveltejs/vite-plugin-svelte (A28-clean).
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
