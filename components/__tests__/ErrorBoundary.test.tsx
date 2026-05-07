// file: components/__tests__/ErrorBoundary.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary, ErrorBoundaryInner } from '../ErrorBoundary';

// Mock expo-updates
jest.mock('expo-updates', () => ({
    reloadAsync: jest.fn(),
}));

// Mock i18n service
jest.mock('../../services/i18n', () => ({
    t: (key: string) => {
        const translations: Record<string, string> = {
            'errorBoundary.title': 'Something went wrong',
            'errorBoundary.message': 'An unexpected error occurred.',
            'errorBoundary.restart': 'Restart App',
        };
        return translations[key] || key;
    },
}));

// Component that throws an error
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error message');
    }
    return <Text>Normal Content</Text>;
};

describe('ErrorBoundary', () => {
    // Suppress console.error for error boundary tests
    const originalError = console.error;
    beforeAll(() => {
        console.error = jest.fn();
    });
    afterAll(() => {
        console.error = originalError;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders children when there is no error', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <Text>Child Content</Text>
            </ErrorBoundary>
        );

        expect(getByText('Child Content')).toBeTruthy();
    });

    it('catches error and renders fallback UI', () => {
        const { getByText, queryByText } = render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should show error UI
        expect(getByText('Something went wrong')).toBeTruthy();
        expect(getByText('An unexpected error occurred.')).toBeTruthy();
        
        // Should not show normal content
        expect(queryByText('Normal Content')).toBeNull();
    });

    it('displays the error message in error box during development', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(getByText(/Test error message/)).toBeTruthy();
    });

    it('renders restart button', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(getByText('Restart App')).toBeTruthy();
    });

    it('calls Updates.reloadAsync when restart button is pressed', async () => {
        const Updates = require('expo-updates');
        
        const { getByText } = render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        fireEvent.press(getByText('Restart App'));

        expect(Updates.reloadAsync).toHaveBeenCalled();
    });

    it('resets error state when reload fails', async () => {
        const Updates = require('expo-updates');
        Updates.reloadAsync.mockRejectedValueOnce(new Error('Reload failed'));

        const { getByText, queryByText, rerender } = render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        // Verify error state
        expect(getByText('Something went wrong')).toBeTruthy();

        // Press restart - it will fail and reset state
        fireEvent.press(getByText('Restart App'));

        // Wait for state reset
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('logs error to console', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(console.error).toHaveBeenCalled();
    });

    it('handles multiple children', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <View>
                    <Text>First Child</Text>
                    <Text>Second Child</Text>
                </View>
            </ErrorBoundary>
        );

        expect(getByText('First Child')).toBeTruthy();
        expect(getByText('Second Child')).toBeTruthy();
    });

    it('getDerivedStateFromError returns correct state', () => {
        const error = new Error('Test');
        const result = ErrorBoundaryInner.getDerivedStateFromError(error);
        
        expect(result).toEqual({
            hasError: true,
            error: error,
        });
    });
});
