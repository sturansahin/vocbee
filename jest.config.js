module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverage: true,
  // Keep machine-readable output explicit so the feature coverage gate is reproducible in CI.
  coverageReporters: ['json', 'json-summary', 'lcov', 'clover'],
  collectCoverageFrom: [
    'src/app/**/*.{ts,tsx}',
    'src/shared/**/*.{ts,tsx}',
    'src/features/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/index.ts',
    // Firestore integration paths are covered by emulator-backed rules/repository tests.
    '!src/features/**/data/repositories/Firestore*.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/.vercel/'],
  moduleNameMapper: {
    '\\.txt$': '<rootDir>/__mocks__/txtFileMock.js',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
  },
};
