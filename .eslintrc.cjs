// Production architecture guard. Style debt remains warnings; architectural violations are errors.

const publicBoundaryPatterns = [
  {
    group: ['@features/*/*'],
    message: 'Feature imports must use @features/<feature> public index.ts barrels.',
  },
  {
    group: ['@/*'],
    message: 'The transitional root alias is removed; use @shared/@features/@app owners.',
  },
];

const legacyRootZones = ['components', 'config', 'context', 'screens', 'services', 'utils'].map(
  (directory) => ({
    target: './src',
    from: `./${directory}`,
    message: `src -> legacy ${directory}/ import is forbidden; use the owning public module.`,
  }),
);

const sideEffectSdkPattern = {
  group: [
    'firebase',
    'firebase/*',
    '@react-native-async-storage/*',
    'expo-notifications',
    'expo-speech',
    'expo-image-picker',
    'expo-apple-authentication',
    'expo-constants',
    'expo-localization',
    'expo-network',
    'expo-updates',
    '@react-native-google-signin/*',
    'react-native-google-mobile-ads',
    'react-native-purchases',
    'react-native-purchases-ui',
  ],
  message: 'Side-effect SDK access belongs in data/platform adapters.',
};

module.exports = {
  root: true,
  env: { es2021: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    },
  },
  ignorePatterns: [
    'node_modules/',
    'functions/',
    'coverage/',
    'lib/',
    '.expo/',
    'android/',
    'ios/',
    'web-build/',
    'dist/',
    'assets/',
    'locales/',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-undef': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',

    // Prompt 7: architecture rules are blocking while unrelated style debt stays non-blocking.
    'import/no-cycle': ['error', { maxDepth: 1 }],
    'import/no-duplicates': 'error',
    'no-restricted-imports': ['error', { patterns: publicBoundaryPatterns }],
    'import/no-restricted-paths': ['error', { zones: legacyRootZones }],
  },
  overrides: [
    {
      files: ['src/features/*/domain/**/*.{ts,tsx}'],
      excludedFiles: ['**/__tests__/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...publicBoundaryPatterns,
              {
                group: [
                  'firebase',
                  'firebase/*',
                  '@react-native-async-storage/*',
                  'expo',
                  'expo-*',
                  'react',
                  'react-native',
                  'react-native-*',
                  '@react-navigation/*',
                ],
                message: 'Domain modules must remain pure TypeScript.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/features/*/presentation/**/*.{ts,tsx}'],
      excludedFiles: ['**/__tests__/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [...publicBoundaryPatterns, sideEffectSdkPattern],
          },
        ],
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              ...legacyRootZones,
              {
                target: './src/features/*/presentation',
                from: './src/features/*/data',
                message: 'presentation -> data is forbidden; use application contracts/facades.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/features/*/application/**/*.{ts,tsx}'],
      excludedFiles: ['**/__tests__/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [...publicBoundaryPatterns, sideEffectSdkPattern],
          },
        ],
      },
    },
    {
      files: ['src/shared/**/*.{ts,tsx}'],
      excludedFiles: ['**/__tests__/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...publicBoundaryPatterns,
              {
                group: ['@app/*', '@features/*'],
                message: 'shared must remain independent from app and feature modules.',
              },
            ],
          },
        ],
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              ...legacyRootZones,
              {
                target: './src/shared',
                from: './src/app',
                message: 'shared -> app is forbidden.',
              },
              {
                target: './src/shared',
                from: './src/features',
                message: 'shared -> features is forbidden.',
              },
            ],
          },
        ],
      },
    },
  ],
};
