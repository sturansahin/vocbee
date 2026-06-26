# `src/` — Feature-Based Layered Architecture (refactor-v2)

Target structure (see `docs/refactor-v2/02`, `05`, `33`). Introduced in **Phase 1** as a
skeleton + shared-layer foundation. Existing root folders (`screens/`, `services/`,
`context/`, `components/`, `utils/`, `config/`) remain in place behind re-export **shims**
and are migrated gradually in later phases (see `docs/refactor-v2/39`).

```
src/
  app/        # application bootstrap (providers, navigation, lifecycle, bootstrap, config) — filled Phase 2
  shared/     # cross-cutting infra (ui, theme, storage, firebase, api, i18n, utils, errors, types)
  features/   # feature modules (presentation/application/domain/data) — filled Phase 2+
```

Path aliases (transition period — `@/*` preserved):
`@app/*`→`src/app/*`, `@shared/*`→`src/shared/*`, `@features/*`→`src/features/*`.

> Phase 1 only establishes the skeleton, aliases, and the `shared/storage` + `shared/errors`
> modules. No app behavior changes. Empty `index.ts` files are placeholders kept so the
> folders are tracked in git; deeper layers (`presentation/application/domain/data`) open
> only when a feature is actually migrated (avoids empty boilerplate — `docs/refactor-v2/05`/`06`).
