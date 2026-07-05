// src/features/home/presentation/components/__tests__/HomeProgressSection.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeProgressSection } from '../HomeProgressSection';

const baseProps = {
    isDarkMode: false,
    textColor: '#000000',
    textSecondaryColor: '#666666',
    primaryColor: '#FFC814',
    surfaceLightColor: '#EEEEEE',
    borderColor: '#E0E0E0',
    initialLoadingPlaceholderColor: 'rgba(0,0,0,0.08)',
    initialLoadingAccentColor: 'rgba(255,200,20,0.28)',
    levelCode: 'A1',
    levelDescription: 'Beginner',
    learnedCount: 3,
    totalCount: 100,
    wordsLabel: 'words',
    progressPercentage: 3,
};

describe('HomeProgressSection', () => {
    it('renders the loading skeleton variant without real data', () => {
        const { getByText, queryByText } = render(
            <HomeProgressSection {...baseProps} isLoading />
        );
        // Loading variant renders only placeholder lines, no level/progress text.
        expect(queryByText('A1')).toBeNull();
        expect(queryByText('3/100 words')).toBeNull();
    });

    it('renders the loaded variant with level and progress text', () => {
        const { getByText } = render(
            <HomeProgressSection {...baseProps} isLoading={false} />
        );
        expect(getByText('A1')).toBeTruthy();
        expect(getByText('Beginner')).toBeTruthy();
        expect(getByText('3/100 words')).toBeTruthy();
    });
});
