// Dev redesign-preview entry (/dev/app.html) — the UI overhaul harness (Phase 2). Mounts the new
// sidebar shell + screen router. Dev-only + noindex; the live /app/ surface is untouched until cutover.
import '../styles/tailwind.css';
import { mount } from 'svelte';
import RedesignApp from './RedesignApp.svelte';

const target = document.getElementById('app')!;
mount(RedesignApp, { target });
