# `src/` — Feature-Based Layered Architecture (refactor-v2)

Production application code lives exclusively in this feature-based layered tree. The Phase 9
cleanup removed the former root compatibility folders (`screens/`, `services/`, `context/`,
`components/`, `utils/`, `config/`).

```
src/
  app/        # application bootstrap (providers, navigation, lifecycle, bootstrap, config) — filled Phase 2
  shared/     # cross-cutting infra (ui, theme, storage, firebase, api, i18n, utils, errors, types)
  features/   # feature modules (presentation/application/domain/data) — filled Phase 2+
```

Supported path aliases are intentionally scoped to architecture owners:
`@app/*`→`src/app/*`, `@shared/*`→`src/shared/*`, `@features/*`→`src/features/*`.

The root `App.tsx` is the only mobile entry adapter retained because Expo's default
`expo/AppEntry.js` resolves that module. It contains no application logic.
