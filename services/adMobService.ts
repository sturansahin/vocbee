// services/adMobService.ts — SHIM (Phase 8, docs/refactor-v2/28, /36 §7 desen a).
// Real implementation moved to src/features/monetization/data/repositories/AdMobRepository.ts.
// This file is a re-export bridge only; it must not contain any logic (docs/refactor-v2/36 §8).
// Scheduled for removal in Phase 9 once all imports are updated to @features/monetization.
export * from '../src/features/monetization/data/repositories/AdMobRepository';
