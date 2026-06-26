// Root entry shim — the App component moved to src/app/App.tsx in Phase 2
// (docs/refactor-v2/22, /36). expo/AppEntry.js imports this module's default export.
// Relative re-export (no alias dependency) keeps the native entry resolution bulletproof.
// FONT_FAMILY is preserved for backward compatibility (original App.tsx re-exported it).
// This shim is removed in Phase 9 once the entry points to @app/App directly.
export { default } from './src/app/App';
export { FONT_FAMILY } from './utils/typography';
