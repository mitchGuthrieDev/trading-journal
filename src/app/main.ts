// Blotterbook — staging Svelte 5 entry (ADR-001 / A27).
//
// Side-effect import of format.ts (ex assets/util.js) preserves the S14 `?k=` token strip on load
// (and the version-badge population) exactly as the vanilla surfaces got it. Then mount the Svelte app.
import '../lib/core/format.ts';
import '../styles/tailwind.css'; // A128 — Tailwind utility layer for the app surfaces (app/demo/staging)
import { mount } from 'svelte';
import { PAGE_MODE } from '../lib/core/core.ts';
import App from './App.svelte';

const target = document.getElementById('app')!; // the mount point exists in every app/*.html shell

// UI redesign cutover (Phase 3): the staging surface mounts the new sidebar shell (StagingApp); the
// live app + demo keep the current App.svelte until the redesign is promoted off staging. StagingApp is
// DYNAMICALLY imported so the redesign shell + its deps code-split into a staging-only chunk and stay
// out of the shared app/demo bundle the /app/ size budget measures (A96).
if (PAGE_MODE === 'staging') {
  void import('./StagingApp.svelte').then(({ default: StagingApp }) => mount(StagingApp, { target }));
} else {
  mount(App, { target });
}
