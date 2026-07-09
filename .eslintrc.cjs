// .eslintrc.cjs — Root ESLint config (ADIM 8, docs/refactor-v2/33 §5, /38 §5, /40 §5).
//
// GOAL: enforce the layer-boundary import rules from docs/refactor-v2/33 (domain/application/data/
// presentation) WITHOUT breaking the existing, un-migrated legacy code (screens/, services/, context/,
// components/, config/). Per docs/refactor-v2/40 §5's own plan: rules start in WARN mode, CI runs lint
// non-blocking (continue-on-error) until the legacy backlog is cleaned up in a later phase. Nothing here
// is auto-fixed; this file only adds detection, no code was changed to satisfy it.
//
// Scope: only `src/features/**` is held to the strict layer-boundary rules for now, because that is the
// ONLY part of the codebase that already has the target domain/application/data/presentation structure
// (docs/refactor-v2/05). Legacy `screens/`, `services/`, `context/`, `components/`, `config/` do not have
// this structure yet and are intentionally NOT covered by the path-based zone rules — see the
// "legacy allowlist" override block below for the (narrower) rules that DO apply to them.

module.exports = {
  root: true,
  env: { es2021: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    // No `project` (no type-aware linting) — keeps this fast and avoids requiring every tsconfig
    // project to resolve every linted file (jest configs, scripts, etc. use different tsconfigs).
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    },
  },
  ignorePatterns: [
    'node_modules/',
    'functions/',       // has its own .eslintrc.js + lint script
    'coverage/',
    'lib/',
    '.expo/',
    'android/',
    'ios/',
    'web-build/',
    'dist/',
    'assets/',
    'locales/',          // generated locale data, not hand-written logic
  ],
  rules: {
    // Baseline TS ergonomics — kept lenient on purpose (this is an import-boundary lint, not a full
    // style/strictness pass; tightening these is a separate, later decision).
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-unused-vars': 'off', // superseded by the TS-aware version above
    '@typescript-eslint/no-var-requires': 'off', // some legacy files still use require()
    'no-undef': 'off', // TS handles this; avoids false positives on ambient/global types
    // Pre-existing legacy pattern (config/firebase.ts, services/vocabularyService.ts) — not part of the
    // architecture-boundary scope of this pass; downgraded to warn so `npm run lint` doesn't turn the
    // whole repo red on day one (docs/refactor-v2/40 §5: "kurallar önce warn").
    '@typescript-eslint/ban-ts-comment': 'warn',

    // ─── Architecture guard (docs/refactor-v2/33 §5) — WARN mode repo-wide for now ───
    'import/no-cycle': ['warn', { maxDepth: 1 }],
  },
  overrides: [
    // ─────────────────────────────────────────────────────────────────────────────────────────────
    // 1) src/features/*/domain — the strictest zone: pure TypeScript only. No React, no RN, no
    //    Firebase, no AsyncStorage, no Expo SDK, no fetch (docs/refactor-v2/33 §1 domain row).
    //    WARN (not error) for this pass — see docs/refactor-v2/40 §5 ("Phase 0: kurallar önce warn").
    // ─────────────────────────────────────────────────────────────────────────────────────────────
    {
      files: ['src/features/*/domain/**/*.{ts,tsx}'],
      excludedFiles: ['**/__tests__/**'],
      rules: {
        'no-restricted-imports': [
          'warn',
          {
            patterns: [
              'firebase', 'firebase/*',
              '@react-native-async-storage/*',
              'expo', 'expo-*',
              'react', 'react-native', 'react-native-*',
              '@react-navigation/*',
            ],
          },
        ],
      },
    },

    // ─────────────────────────────────────────────────────────────────────────────────────────────
    // 2) src/features/*/presentation — must not import Firestore/AsyncStorage/Expo-notifications
    //    directly, and must not reach into another layer's `data/*` internals (docs/refactor-v2/33
    //    presentation row: "Firebase, AsyncStorage, Expo SDK, fetch, data/* doğrudan" are forbidden).
    // ─────────────────────────────────────────────────────────────────────────────────────────────
    {
      files: ['src/features/*/presentation/**/*.{ts,tsx}'],
      excludedFiles: ['**/__tests__/**'],
      rules: {
        'no-restricted-imports': [
          'warn',
          {
            patterns: ['firebase/firestore', '@react-native-async-storage/*', 'expo-notifications'],
          },
        ],
        'import/no-restricted-paths': [
          'warn',
          {
            zones: [
              {
                target: './src/features/*/presentation',
                from: './src/features/*/data',
                message: 'presentation → data YASAK (docs/refactor-v2/33 §2) — application/hook üzerinden erişin.',
              },
            ],
          },
        ],
      },
    },

    // ─────────────────────────────────────────────────────────────────────────────────────────────
    // 3) src/features/*/application — orchestration only: may depend on domain + repository
    //    INTERFACES, but not on concrete SDK calls directly (docs/refactor-v2/33 §1 application row).
    // ─────────────────────────────────────────────────────────────────────────────────────────────
    {
      files: ['src/features/*/application/**/*.{ts,tsx}'],
      excludedFiles: ['**/__tests__/**'],
      rules: {
        'no-restricted-imports': [
          'warn',
          {
            patterns: ['firebase/firestore', 'firebase/auth', '@react-native-async-storage/*', 'expo-notifications'],
          },
        ],
      },
    },

    // ─────────────────────────────────────────────────────────────────────────────────────────────
    // 4) Legacy allowlist — screens/, services/, context/, components/, config/ still contain the
    //    ACTIVE production Firebase/AsyncStorage/Expo calls (this is the current, working
    //    architecture pre-migration). These are INTENTIONALLY not held to the src/features/* zone
    //    rules above. Only a narrow, non-blocking warning is added here (docs/refactor-v2/33 §6:
    //    "screens → firebase/firestore import uyarı", "screens → AsyncStorage import uyarı") so future
    //    contributors get a nudge without breaking CI today. See docs/refactor-v2/41-eslint-lint-policy.md
    //    for the full legacy-allowlist rationale and the planned removal criteria.
    // ─────────────────────────────────────────────────────────────────────────────────────────────
    {
      files: ['screens/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'warn',
          {
            paths: [
              { name: 'firebase/firestore', message: 'Legacy allowlist (docs/41): screens should not grow new direct Firestore imports; prefer a feature repository.' },
              { name: '@react-native-async-storage/async-storage', message: 'Legacy allowlist (docs/41): screens should not grow new direct AsyncStorage imports; prefer a feature repository/service.' },
            ],
          },
        ],
      },
    },
  ],
};
