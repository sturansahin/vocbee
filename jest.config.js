module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['./jest.setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        'components/**/*.{ts,tsx}',
        'screens/**/*.{ts,tsx}',
        'services/**/*.{ts,tsx}',
        'src/shared/**/*.{ts,tsx}',
        '!**/__tests__/**',
        '!**/coverage/**',
        '!**/node_modules/**',
        '!**/babel.config.js',
        '!**/jest.setup.js',
        // Exclude SDK-heavy / UI-heavy files that are hard to unit test meaningfully
        '!services/adMobService.ts',
        '!services/notificationService.ts',
        '!services/favoritesService.ts',
        '!services/progressService.ts',
        '!services/vocabularyService.ts',
        // Exclude very large screens (>400 lines) - focus on integration tests later
        '!screens/SettingsScreen.tsx',
        '!screens/SetupScreens.tsx',
        '!screens/ExampleSentencesScreen.tsx',
        '!screens/FavoritesScreen.tsx',
        '!screens/ForgotPasswordScreen.tsx',
        '!screens/LevelTestScreen.tsx',
        '!screens/OnboardingScreen.tsx',
        '!screens/SplashScreen.tsx',
        // Exclude component that requires SafeAreaProvider
        '!components/SafeBannerAd.tsx',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '\\.txt$': '<rootDir>/__mocks__/txtFileMock.js',
        '^@app/(.*)$': '<rootDir>/src/app/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@features/(.*)$': '<rootDir>/src/features/$1',
        '^@/(.*)$': '<rootDir>/$1'
    }
};
