// file: screens/__tests__/HomeScreen.test.tsx
import React, { ReactNode } from 'react';
import { render, waitFor, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from '../HomeScreen';

// Mock expo-network
jest.mock('expo-network', () => ({
    getNetworkStateAsync: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Mock SafeBannerAd component
jest.mock('../../components/SafeBannerAd', () => ({
    SafeBannerAd: () => null,
}));

// Mock additional services for Home
jest.mock('../../services/vocabularyService', () => ({
    LEVELS: ['A1', 'A2', 'B1', 'B2', 'C1'],
    getStoredVocabulary: jest.fn(() => Promise.resolve([
        {
            id: 1,
            word: 'Haus',
            translation: 'House',
            sentence1: 'Das ist ein Haus',
            sentence2: 'This is a house',
            nativeSentence1: '',
            nativeSentence2: ''
        }
    ])),
    getCurrentLevel: jest.fn(() => Promise.resolve('A1')),
    getLearnedWords: jest.fn(() => Promise.resolve([])),
    isVocabularyGenerated: jest.fn(() => Promise.resolve(true)),
    getLastWordId: jest.fn(() => Promise.resolve(null)),
    shuffleArray: (arr: any[]) => arr, // Simple pass through
    getLevelDisplay: jest.fn(() => ({ code: 'A1', description: 'Beginner' })),
    generateVocabulary: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../services/progressService', () => ({
    getLearnedCount: jest.fn(() => Promise.resolve(0)),
    getTotalWords: jest.fn(() => Promise.resolve(100)),
    getLearnedWords: jest.fn(() => Promise.resolve([])),
    getCurrentLevel: jest.fn(() => Promise.resolve('A1')),
    markWordAsLearned: jest.fn(() => Promise.resolve()),
    checkAndAdvanceLevel: jest.fn(() => Promise.resolve('A1')),
    saveLastWordId: jest.fn(() => Promise.resolve()),
    getLastWordId: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../services/favoritesService', () => ({
    isFavorite: jest.fn(() => Promise.resolve(false)),
    addToFavorites: jest.fn(() => Promise.resolve()),
    removeFromFavorites: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../services/notificationService', () => ({
    getPendingNotificationWord: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../services/adMobService', () => ({
    loadInterstitial: jest.fn(),
    showInterstitial: jest.fn(),
    getBannerAdSize: jest.fn(),
    AD_IDS: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
}));

jest.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            background: '#FFFFFF',
            text: '#000000',
            primary: '#FFC814',
            primaryDark: '#FFA500',
            border: '#E0E0E0',
            surface: '#F5F5F5',
            surfaceLight: '#EEEEEE',
            textSecondary: '#666666',
            error: '#FF0000',
        },
        isDarkMode: false
    }),
}));

jest.mock('../../components/CustomAlert', () => ({
    useAlert: () => ({
        showAlert: jest.fn(),
    }),
}));

// SafeAreaProvider initial metrics for testing
const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// Custom render function with SafeAreaProvider wrapper
const renderWithProviders = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <SafeAreaProvider initialMetrics={initialMetrics}>
            {children}
        </SafeAreaProvider>
    );
    return render(ui, { wrapper: Wrapper, ...options });
};

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly and loads data', async () => {
        // We assume navigation provided by global mock
        const { getByText } = renderWithProviders(<HomeScreen />);

        // It starts loading, then shows word
        // Wait for word to appear
        await waitFor(() => {
            expect(getByText('Haus')).toBeTruthy();
            expect(getByText('House')).toBeTruthy();
        });
    });

    it('shows level indicator', async () => {
        const { getByText } = renderWithProviders(<HomeScreen />);
        await waitFor(() => {
            // "level.beginner" is the translation key we expect if not translated in test setup
            // In setup we mocked t: key => key.
            // Home uses getLevelDisplay which uses t('level.beginner').
            expect(getByText('level.beginner')).toBeTruthy();
        });
    });
});
