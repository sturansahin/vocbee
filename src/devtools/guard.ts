// src/devtools/guard.ts
// Single source of truth for "is the Developer Test Panel allowed to exist at all".
//
// SAFETY CONTRACT (binding):
// - `isDevToolsEnabled` is TRUE only when `__DEV__` is true (Metro/Expo dev bundle, never a
//   production release build — release builds have `__DEV__ === false` baked in at bundle time).
// - The optional `EXPO_PUBLIC_ENABLE_DEVTOOLS` env flag can only NARROW (force-disable) access
//   during development (e.g. to test the "disabled" UI path locally); it can NEVER widen access
//   into a production build. Setting it to "true" in a production `.env`/EAS profile has NO effect,
//   because the `__DEV__` check is applied first and is not env-controlled.
// - Nothing in `src/devtools/**` may be imported by production-guarded code paths outside of the
//   single `__DEV__`-gated mount point in `src/app/App.tsx`.
export const isDevToolsEnabled: boolean = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEVTOOLS !== 'false';
