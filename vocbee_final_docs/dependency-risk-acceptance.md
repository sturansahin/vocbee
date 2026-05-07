# VocBee Dependency Risk Acceptance

Date: 2026-05-06
Owner: Release owner
Review date: 2026-06-06

## Scope

This document records dependency audit items that remain after running safe, non-forced audit remediation.

Commands run:

- `npm audit fix`
- `npm run audit:prod`
- `npm --prefix functions audit fix`
- `npm --prefix functions audit --omit=dev --audit-level=high`

## Release Gate Result

High and critical production audit gates are green.

- Root `npm run audit:prod`: pass at high threshold.
- Functions `npm --prefix functions audit --omit=dev --audit-level=high`: pass at high threshold.

## Accepted Residual Items

### `postcss`

- Severity: moderate
- Chain: Expo Metro config tooling
- Reachability: build/tooling path, not directly reachable from user-controlled production app requests.
- Why not forced: `npm audit fix --force` proposes an Expo breaking change/downgrade path and must not be applied inside this release phase.
- Mitigation: keep Expo SDK 54-compatible dependency tree, monitor Expo patch releases, rerun audit before store submission.

### `@tootallnate/once`

- Severity: low in current npm audit output
- Chain: `firebase-admin` / Google Cloud storage transitive dependency, also present in functions dependency tree.
- Reachability: server/admin tooling path; no direct public request path in the mobile bundle.
- Why not forced: npm proposes a breaking `firebase-admin` downgrade path.
- Mitigation: keep `firebase-admin@13.6.0`, keep grammar/account-deletion APIs authenticated, rate-limited, and size-limited; review when upstream Google packages release a non-breaking fix.

## Recheck Criteria

Reopen this acceptance if any accepted item becomes high/critical, becomes reachable from app user input, or receives a non-breaking patch in the Expo/Firebase-compatible range.
