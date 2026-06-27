#!/usr/bin/env node
/**
 * Post-build step (ADR-001 / A26): copy the verbatim-static files Vite does NOT bundle
 * into the build output (dist/), so the output directory is a complete, servable artifact.
 *
 * Vite (vite.config.mjs) bundles + fingerprints the HTML/JS/CSS entries. It does NOT emit:
 *   - data/*.json        — fetched at runtime by URL (cache-busted via data/manifest.json);
 *                          must stay at /data/<name> verbatim, so build-manifest's hashes match.
 *   - _headers, _redirects — Cloudflare Pages config; must sit at the output-dir root.
 *   - robots.txt, sitemap.xml — served at /robots.txt, /sitemap.xml.
 *   - assets/og-image.png — referenced by an absolute https og:image URL Vite can't rewrite.
 *
 * These sources stay where they are in the repo (no file moves), so the build-manifest /
 * bump-version path assumptions and the README image refs are untouched — only the deploy
 * mechanism changes (Pages now serves dist/). Run after `vite build`; wired into `npm run build`.
 *
 * Uses only Node built-ins — the shipped output gains no dependency from this.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('copy-static: dist/ not found — run `vite build` first.');
  process.exit(1);
}

// [source (relative to repo root), destination (relative to dist/)]
const items = [
  ['data', 'data'], // whole reference-data dir (incl. the generated manifest.json)
  ['_headers', '_headers'],
  ['_redirects', '_redirects'],
  ['robots.txt', 'robots.txt'],
  ['sitemap.xml', 'sitemap.xml'],
  ['assets/og-image.png', 'assets/og-image.png'],
];

let copied = 0;
for (const [src, destRel] of items) {
  const from = join(root, src);
  if (!existsSync(from)) {
    console.warn(`copy-static: skipping missing ${src}`);
    continue;
  }
  const to = join(dist, destRel);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  copied++;
  console.log('copied', src, '->', join('dist', destRel));
}
console.log(`copy-static: ${copied} item(s) copied into dist/`);
