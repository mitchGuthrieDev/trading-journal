// Motion helpers (A146). One switch for the Svelte-transition side of reduced motion: durations
// collapse to 0 when the user asks for reduced motion, so enter/exit effects become instant
// without branching at every call site. The CSS-animation side (tw-animate-css on the shadcn
// primitives) is flattened by the matching @media rule in src/styles/tailwind.css.
export const REDUCED_MOTION = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A transition duration honoring prefers-reduced-motion. */
export const dur = (ms: number) => (REDUCED_MOTION ? 0 : ms);
