# `src/` — Feature-Based Layered Architecture

Production application code lives exclusively in this feature-based layered tree. The former root
compatibility folders (`screens/`, `services/`, `context/`, `components/`, `utils`, `config`) are
retired.

```
src/
  app/        # application bootstrap, providers, navigation, lifecycle and composition
  shared/     # cross-cutting infra (ui, theme, storage, firebase, api, i18n, utils, errors, types)
  features/   # feature modules (presentation/application/domain/data/composition)
```

Supported path aliases are intentionally scoped to architecture owners:
`@app/*`→`src/app/*`, `@shared/*`→`src/shared/*`, `@features/*`→`src/features/*`.

The root `App.tsx` is the only mobile entry adapter retained because Expo's default
`expo/AppEntry.js` resolves that module. It contains no application logic.

The current dependency rules, provider contract, protected product behavior and production
verification commands are documented in `docs/architecture.md`.
