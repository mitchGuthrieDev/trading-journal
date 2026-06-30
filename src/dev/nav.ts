// The redesign nav config now lives in the app (src/app/lib/nav.ts) since it drives the live staging
// shell; the /dev preview harness + styleguide re-export it so the sidebar structure has one source.
export { navSections, navItems, navLabel } from '../app/lib/nav';
