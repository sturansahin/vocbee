// src/features/home/presentation/components/__tests__/HomeTutorialSection.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../../../../../context/ThemeContext';
import { HomeTutorialSection } from '../HomeTutorialSection';

const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const word = {
    id: 1,
    word: 'Haus',
    pronunciation: '/haʊs/',
    translation: 'House',
    sentence1: 'Das ist ein Haus',
    sentence2: 'This is a house',
    nativeSentence1: 'Bu bir ev',
    nativeSentence2: '',
};

const layoutRect = { x: 0, y: 0, width: 100, height: 40 };
const layouts = {
    card: layoutRect,
    favoriteButton: layoutRect,
    word: layoutRect,
    exampleSentence: layoutRect,
    moreExample: layoutRect,
};

const baseProps = {
    tutorialLayouts: layouts,
    tutorialStep: 3,
    currentWord: word,
    isCurrentWordFavorite: false,
    colors: { text: '#000000', primary: '#FFC814' },
    isDarkMode: false,
    t: (key: string) => key,
    onToggleFavorite: jest.fn(),
    onWordPress: jest.fn(),
    onExampleSentencePress: jest.fn(),
    onMoreExamplePress: jest.fn(),
    onTutorialComplete: jest.fn(),
    onTutorialNext: jest.fn(),
};

describe('HomeTutorialSection', () => {
    it('renders nothing when showTutorial is false', () => {
        const { queryByText } = render(
            <SafeAreaProvider initialMetrics={initialMetrics}>
                <ThemeProvider>
                    <HomeTutorialSection {...baseProps} showTutorial={false} />
                </ThemeProvider>
            </SafeAreaProvider>
        );
        expect(queryByText('homeTutorial.next')).toBeNull();
    });

    it('renders nothing when tutorialLayouts is null even if showTutorial is true', () => {
        const { queryByText } = render(
            <SafeAreaProvider initialMetrics={initialMetrics}>
                <ThemeProvider>
                    <HomeTutorialSection {...baseProps} showTutorial tutorialLayouts={null} />
                </ThemeProvider>
            </SafeAreaProvider>
        );
        expect(queryByText('homeTutorial.next')).toBeNull();
    });

    it('renders the tutorial overlay when visible with layouts available', () => {
        const { getByText } = render(
            <SafeAreaProvider initialMetrics={initialMetrics}>
                <ThemeProvider>
                    <HomeTutorialSection {...baseProps} showTutorial />
                </ThemeProvider>
            </SafeAreaProvider>
        );
        expect(getByText('homeTutorial.next')).toBeTruthy();
    });
});
