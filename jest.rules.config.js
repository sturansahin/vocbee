// Dedicated Jest config for Firestore security-rules integration tests.
// These tests require the Firestore emulator, so they must not be discovered by the regular
// `test:ci` suite. The explicit match also keeps the established tests/firestoreRules.ts path.
const appConfig = require('./jest.config');

module.exports = {
    ...appConfig,
    collectCoverage: false,
    setupFilesAfterEnv: [],
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/firestoreRules.ts'],
};
