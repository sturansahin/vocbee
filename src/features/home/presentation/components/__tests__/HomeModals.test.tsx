// src/features/home/presentation/components/__tests__/HomeModals.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeModals } from '../HomeModals';

jest.mock('@features/streak', () => ({
    StreakCelebrationOverlay: () => null,
}));
jest.mock('@features/review', () => ({
    AppRatingPrompt: () => null,
}));

describe('HomeModals', () => {
    it('renders without crashing when both overlays are hidden', () => {
        const { toJSON } = render(
            <HomeModals
                streakCelebrationVisible={false}
                streakCelebrationKey={0}
                streakCelebrationCount={0}
                streakCelebrationLabel=""
                streakCelebrationMessage=""
                onStreakCelebrationComplete={jest.fn()}
                reviewPromptVisible={false}
                onReviewPromptDismiss={jest.fn()}
                onReviewRateInStore={jest.fn()}
                onReviewSendFeedback={jest.fn()}
            />
        );
        expect(toJSON()).toBeDefined();
    });

    it('renders without crashing when both overlays are visible', () => {
        const { toJSON } = render(
            <HomeModals
                streakCelebrationVisible
                streakCelebrationKey={1}
                streakCelebrationCount={5}
                streakCelebrationLabel="Streak"
                streakCelebrationMessage="Great job!"
                onStreakCelebrationComplete={jest.fn()}
                reviewPromptVisible
                onReviewPromptDismiss={jest.fn()}
                onReviewRateInStore={jest.fn()}
                onReviewSendFeedback={jest.fn()}
            />
        );
        expect(toJSON()).toBeDefined();
    });
});
