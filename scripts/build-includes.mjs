#!/usr/bin/env node
/* Blotterbook static-include prebuild — single-sources the shared nav + footer.

   Edit partials/nav.html and partials/footer.html, then run:
       node scripts/build-includes.mjs
   to sync them into every root .html page that carries the include markers.
   Idempotent and safe to re-run.

   Markers in a page:
       <!-- include:nav active=changelog --> ...replaced... <!-- /include:nav -->
       <!-- include:footer --> ...replaced... <!-- /include:footer -->
   active=KEY (optional) highlights the matching `data-nav="KEY"` nav link.

   The output is plain static HTML, so the committed pages already contain the
   rendered partials — the deploy works with or without running this. It can also
   be wired up as the Cloudflare Pages build command for belt-and-suspenders sync.

   NOTE: only the four info pages (changelog/roadmap/legal/howto) use these
   partials. The homepage and admin keep their own bespoke nav/footer by design;
   they still share colors via tokens.css. */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nav = readFileSync(join(root, 'partials/nav.html'), 'utf8').trim();
const footer = readFileSync(join(root, 'partials/footer.html'), 'utf8').trim();

// Replace everything between <!-- include:NAME ... --> and <!-- /include:NAME -->
function fill(html, name, render) {
  const re = new RegExp(
    `(<!--\\s*include:${name}\\b([^>]*?)-->)[\\s\\S]*?(<!--\\s*/include:${name}\\s*-->)`, 'g'
  );
  return html.replace(re, (_m, open, attrs, close) => `${open}\n  ${render((attrs || '').trim())}\n  ${close}`);
}

let changed = 0;
for (const file of readdirSync(root).filter(f => f.endsWith('.html'))) {
  const path = join(root, file);
  const src = readFileSync(path, 'utf8');
  if (!src.includes('<!-- include:')) continue;

  let out = fill(src, 'nav', attrs => {
    const m = /active=([A-Za-z0-9_-]+)/.exec(attrs);
    return m ? nav.replace(`<a data-nav="${m[1]}"`, `<a data-nav="${m[1]}" class="active"`) : nav;
  });
  out = fill(out, 'footer', () => footer);

  if (out !== src) { writeFileSync(path, out); changed++; console.log('updated', file); }
}
console.log(`build-includes: ${changed} file(s) updated`);
