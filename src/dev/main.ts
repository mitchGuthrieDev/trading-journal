// Dev styleguide entry (/dev/components.html) — the live component reference (UI workflow Step 3).
// Standalone Svelte mount, like the app surfaces' main.ts: pull in the Tailwind utility layer, then
// mount the Styleguide. Dev-only + noindex — never linked from the product.
import '../styles/tailwind.css';
import { mount } from 'svelte';
import Styleguide from './Styleguide.svelte';

const target = document.getElementById('app')!;
mount(Styleguide, { target });
