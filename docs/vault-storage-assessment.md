# Vault storage feasibility — Obsidian-style local files vs IndexedDB (A138)

**Decision record, 2026-07-01.** Closes backlog **A138** (the prerequisite discussion for A132's
Local/Remote workspace toggle). Question: should Blotterbook offer an Obsidian-style local
**vault** — user-owned plain files in a folder they choose — as the source of truth, instead of
(or beside) the current IndexedDB store?

## Why a vault is attractive

The product's moat is *your data never leaves your browser*. A vault strengthens the same promise
into *your data is not even trapped in a browser*: plain JSON/CSV/Markdown files the user can see,
back up, sync (Dropbox/iCloud/git), grep, and keep after Blotterbook is gone. It also gives us
durable storage that survives "Clear site data", which IndexedDB does not.

## The hard browser constraints (what's actually possible)

| Capability | Chromium (desktop) | Safari / Firefox | Mobile |
| --- | --- | --- | --- |
| **File System Access API** (`showDirectoryPicker`, persistent read/write handles to a user folder) | ✅ full | ❌ not implemented (WebKit/Gecko have declined the directory-write surface) | ❌ |
| Handle persistence across visits | ✅ (handles storable in IndexedDB; permission re-prompt is a single click) | — | — |
| **OPFS** (origin-private FS) | ✅ | ✅ | ✅ | 
| `<input type=file>` / drag-drop read + download-blob write | ✅ | ✅ | ✅ (clunky) |

Three consequences:

1. **A live vault (auto-read/write a user folder) is Chromium-desktop-only.** Safari/Firefox/mobile
   cannot do it as a web app, full stop. Any vault feature must therefore be an *enhancement*, not
   the storage model — otherwise we fork the product by browser.
2. **OPFS is not a vault.** It's origin-private — invisible to the user, wiped with site data. It's
   just a faster/looser IndexedDB. It solves none of the ownership goals, so it's not worth a
   migration on its own.
3. **A desktop/mobile shell (Tauri / Capacitor) removes every limitation** — real filesystem, real
   folder watching, all platforms — but is a separate product investment (packaging, signing,
   updates). If/when a shell ships, a vault becomes the *natural* default there; nothing we do now
   should preclude it.

## Data → file mapping (if/when a vault exists)

The `exportAll()` snapshot already defines the shapes. A legible vault layout:

```
blotterbook-vault/
  trades.csv            # canonical normalized trades (the adapter output shape; CSV for user legibility)
  journal/2026-06.md    # day notes+tags as Markdown, one file per month (front-matter per day)
  trademeta.json        # per-trade tags/notes/screenshot refs, keyed by trade id
  shots/<id>-<n>.png    # screenshots as real image files (today: base64 data URIs in IndexedDB)
  meta.json             # setup, saved filters, layouts
  vault.json            # schemaVersion + device/write-clock bookkeeping for merge
```

Notes: trade ids stay content-hashed (`tradeId`) so files merge/dedupe the same way imports do;
screenshots move from inline base64 to files (big DB-size win); Markdown for journals is the one
place plain-file legibility pays off most.

## Sync & merge

We do NOT build sync — the user's own file-sync (Dropbox/iCloud/Syncthing/git) does transport.
Our job is only *merge-on-load tolerance*: trades merge by content-hash id (existing dedupe
semantics already handle overlap); journal/trademeta merge last-writer-wins per record using the
existing `updated` timestamps; conflicts surface as both-kept duplicates, never data loss. This is
the same trust-boundary path as `importAll` (sanitizers already exist and were hardened in A154).

## The moat

Unchanged and slightly strengthened: a vault is still 100% local (no egress; FSA handles are
permission-gated to one folder), and it makes the "you own your data" story literal. CSP and the
Store-seam guardrail are unaffected. One care point: vault files are an *untrusted input* on read
(same as backup restore) — everything must continue to flow through the `importAll`-class
sanitizers.

## Fit with the Store seam

Clean. `StoreLike` is already the only persistence contract (A4 guardrail), and a `VaultStore`
implements it 1:1: `init()` = pick/re-authorize the directory handle; `addTrades/saveJournal/...`
= read-modify-write the mapped file; `exportAll/importAll` already exist. Two seam notes:
- **`Store.local` (sync, pre-paint)** stays localStorage-backed even in vault mode (layout state
  isn't vault-worthy and FSA is async-only).
- A **write-behind buffer** (IndexedDB as cache, vault as durable copy) is the realistic
  architecture anyway — FSA writes are slow and permission can lapse mid-session; the cache also
  keeps Safari/Firefox on the identical code path (they just never attach a vault).

## Recommendation — phased, no rewrite

**Keep IndexedDB as the working store on every browser. Ship the vault as a progressive layer:**

1. **Phase 1 — "Vault folder" export/import (all browsers, small).** A "Save to folder…" backup
   that writes the legible multi-file layout above (Chromium: directory picker; others: one
   zip-less multi-download or the existing single-file backup), and a "Restore from folder" that
   reads it through `importAll`. This delivers 80% of the ownership value with zero storage-model
   risk, and it forces the file layout + merge semantics to exist.
2. **Phase 2 — Linked vault, Chromium-only enhancement (medium).** Persist a directory handle;
   auto-write the vault on every Store mutation (debounced, write-behind from IndexedDB);
   merge-on-load when files changed externally. Surfaced through A132's workspace toggle as
   **Local (this browser) / Vault (folder) / Remote (coming soon)** — this is what "workspace
   location" should mean there.
3. **Phase 3 — shell-native vault (only if a Tauri/Capacitor shell is ever prioritized).** The
   VaultStore port is then trivial and becomes the default.

**Not recommended:** migrating the primary store to OPFS (no user-facing benefit), or making FSA
the primary store (forks the product by browser and adds permission-lapse failure modes to the
critical path).

## Done-when check (A138)

Feasibility assessed against the real browser matrix, data→file mapping and merge model sketched,
moat and Store-seam fit confirmed, and a phased path recommended (export/import vault first, live
Chromium vault behind A132's toggle later). **A132 is unblocked**: its "remote" slot should read
**Local / Vault / Remote(stub)**, with Phase 1 above as the first implementable slice.
