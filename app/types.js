// @ts-check
/* Blotterbook · shared JSDoc type definitions (CH33).
 *
 * DEV-ONLY: these `@typedef`s give editors + the `npm run typecheck` (tsc --checkJs)
 * step real types WITHOUT TypeScript or any runtime/shipped dependency — this file is
 * comments + an empty export, so it ships as nothing meaningful. Reference a type from
 * another module with `import('./types.js').Trade`.
 *
 * Typecheck coverage is opt-in per file via a top `// @ts-check` line; the data shapes
 * here are the anchor (the normalized trade, metrics, and cost model that flow through
 * the whole pipeline: adapters → compute → costModel → render).
 */

/**
 * One normalized, closed trade — the single internal shape every platform adapter emits,
 * so compute()/costModel() never branch on platform (see app/adapters.js).
 * @typedef {Object} Trade
 * @property {string}  time              Canonical `YYYY-MM-DD HH:MM:SS`.
 * @property {string}  date              `YYYY-MM-DD` (the close day).
 * @property {number}  pnl               Realized PnL for the trade.
 * @property {string}  symbol            Raw instrument symbol as exported.
 * @property {string}  root              Sanitized root ticker (e.g. `MES`).
 * @property {string}  side              `'long'` | `'short'` | `''`.
 * @property {number}  [qty]             Contracts (fills/MotiveWave); absent ⇒ 1.
 * @property {string}  [entryTime]       Round-trip entry timestamp (fills exports).
 * @property {string}  [exitTime]        Round-trip exit timestamp (fills exports).
 * @property {number}  [holdMs]          Hold time in ms (fills exports).
 * @property {string}  [id]              Stable dedupe id once persisted (Store.tradeId).
 */

/**
 * A single execution fed to the FIFO round-trip matcher (pairFills).
 * @typedef {Object} Fill
 * @property {string}  time
 * @property {string}  symbol
 * @property {'buy'|'sell'} side
 * @property {number}  qty
 * @property {number}  price
 * @property {number}  [realized]        Per-row realized PnL when the export provides it (IBKR).
 * @property {number}  [_seq]            Execution-order tiebreak within a same-second batch.
 */

/**
 * Result of Adapters.parse(): either ok with normalized trades, or an error.
 * @typedef {Object} ParseResult
 * @property {boolean} ok
 * @property {Trade[]} [trades]
 * @property {string}  [platform]
 * @property {string}  [label]
 * @property {boolean} [beta]
 * @property {string}  [kind]            `'closed'` | `'fills'`.
 * @property {string|null} [detected]
 * @property {string}  [error]
 */

/**
 * Per-symbol commission breakdown row (costModel().bySym entries).
 * @typedef {Object} SymCost
 * @property {string}  root
 * @property {number}  count
 * @property {number}  qty
 * @property {number}  rate
 * @property {boolean} known
 * @property {number}  total
 */

/**
 * costModel() output — commissions, subscriptions, tax, take-home over the active metrics.
 * @typedef {Object} CostModel
 * @property {string}  broker
 * @property {number}  platform
 * @property {number}  data
 * @property {number}  fixedMo
 * @property {number}  totalComm
 * @property {number}  months
 * @property {number}  fixedPeriod
 * @property {number}  gross
 * @property {number}  netPreTax
 * @property {number}  tEff
 * @property {number}  tax
 * @property {number}  afterTax
 * @property {number}  pfGP
 * @property {number}  pfGL
 * @property {number}  pf
 * @property {number}  n
 * @property {number}  contracts
 * @property {number}  bePer
 * @property {SymCost[]} bySym
 */

/**
 * Persisted setup selections (Store meta key `setup`).
 * @typedef {Object} Setup
 * @property {string} broker
 * @property {string} feed
 * @property {string} state
 * @property {string} platform
 */

/**
 * A per-day journal annotation (Store `journal`) — also the per-trade meta shape (`trademeta`).
 * @typedef {Object} Annotation
 * @property {string}   [text]
 * @property {string[]} [tags]
 * @property {string[]} [shots]   data: image URLs (validated by SHOT_RE).
 */

export {};
