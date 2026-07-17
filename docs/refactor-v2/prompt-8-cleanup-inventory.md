# Prompt 8 Cleanup Inventory

Audit date: 2026-07-16  
Branch: `refactor`  
Starting HEAD: `4f9474da`

## Removed legacy root modules

The Phase 8 compatibility layer contained 47 logic-free production shims. All consumers and tests now use the
owning `src` public APIs, so the following root trees were removed:

| Root tree | Production shims | Relocated test suites |
|---|---:|---:|
| `components/` | 15 | 6 |
| `context/` | 2 | 1 |
| `screens/` | 10 | 2 |
| `services/` | 15 | 11 |
| `config/` | 1 | 0 |
| `utils/` | 4 | 2 |
| **Total** | **47** | **22** |

The 22 test suites were not deleted. They were relocated under the corresponding `src/app`, `src/features`, or
`src/shared` owner and updated to exercise the real implementation/public API.

## Additional dead code and generated artifacts

- Removed obsolete root support shims: `constants.ts`, `types.ts`.
- Removed empty placeholder barrels: `src/app/config/index.ts`, `src/shared/api/index.ts`,
  `src/shared/types/index.ts`.
- Removed the unused placeholder `SyncSettingsSection` and converted its placeholder test into a Settings
  public-section API regression test.
- Removed 43 tracked generated coverage artifacts under `config/coverage/`. Coverage remains a CI output and is
  no longer treated as source.

## Intentional non-`src` runtime/support paths

- `App.tsx`: required three-line Expo entry adapter; delegates directly to `src/app/App`.
- `assets/` and `locales/`: static application resources.
- `api/`, `functions/`, `proxy/`, `scripts/`: server or repository tooling, not mobile runtime modules.
- `src/devtools/`: development-only tooling. Its root is loaded through a `__DEV__`-guarded require and is absent
  from the production bundle graph.
- Native project directories remain untouched by Prompt 8.

## Final architecture state

- Active mobile TypeScript/TSX implementation lives under `src/app`, `src/features`, and `src/shared`.
- The transitional `@/*` alias was removed from TypeScript, Babel, Jest, and ESLint configuration.
- Navigation and the devtools screen registry import screens only through feature public barrels.
- Architecture tests fail if a removed legacy root tree/module or transitional alias is reintroduced.
- Firestore data, storage keys, payload schemas, native iOS sources, and production data were not changed.

## Security audit status

- The current mobile/server/tool source trees are clean under the repository Gitleaks policy.
- Seven full-history `generic-api-key` findings were verified as CocoaPods SHA-1 checksums or the public
  AppCheckCore example-token comment and are covered by narrow path-and-pattern allowlists.
- One real Groq `gsk_...` token was found in commit `0212d97eb3fb0620d35d3be578aa94ce81402a24`
  (`services/groqService.ts:1`). On 2026-07-17 it returned HTTP 200 before rotation and HTTP 401 after owner
  revocation.
- The replacement Vercel Production/Preview secret is different from the historical value, returned HTTP 200
  from Groq's models and inference endpoints, and is active in the Ready production deployment
  `dpl_BbMAicHuitfhqhtrYNAVa79KV3Df` behind `https://vocbee-proxy.vercel.app`.
- The revoked immutable fingerprint is recorded in `.gitleaksignore`; no secret value is stored in the repository.
  Full-history scanning remains blocking for every other finding.
