// file: components/__tests__/OfflineNotice.test.tsx
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OfflineNotice } from '../OfflineNotice';

// Mock expo-network
const mockGetNetworkStateAsync = jest.fn();
jest.mock('expo-network', () => ({
    getNetworkStateAsync: () => mockGetNetworkStateAsync(),
}));

// SafeAreaProvider initial metrics for testing
const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <SafeAreaProvider initialMetrics={initialMetrics}>
            {ui}
        </SafeAreaProvider>
    );
};

describe('OfflineNotice', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns null when connected', async () => {
        mockGetNetworkStateAsync.mockResolvedValue({ isConnected: true });

        const { queryByText } = renderWithProviders(<OfflineNotice />);

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        expect(queryByText('offline.message')).toBeNull();
    });

    it('shows notice when disconnected', async () => {
        mockGetNetworkStateAsync.mockResolvedValue({ isConnected: false });

        const { getByText } = renderWithProviders(<OfflineNotice />);

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        await waitFor(() => {
            expect(getByText('offline.message')).toBeTruthy();
        });
    });

    it('checks connection periodically', async () => {
        mockGetNetworkStateAsync.mockResolvedValue({ isConnected: true });

        renderWithProviders(<OfflineNotice />);

        // Initial check
        await act(async () => {
            jest.advanceTimersByTime(100);
        });
        expect(mockGetNetworkStateAsync).toHaveBeenCalledTimes(1);

        // After 5 seconds
        await act(async () => {
            jest.advanceTimersByTime(5000);
        });
        expect(mockGetNetworkStateAsync).toHaveBeenCalledTimes(2);

        // After another 5 seconds
        await act(async () => {
            jest.advanceTimersByTime(5000);
        });
        expect(mockGetNetworkStateAsync).toHaveBeenCalledTimes(3);
    });

    it('clears interval on unmount', async () => {
        mockGetNetworkStateAsync.mockResolvedValue({ isConnected: true });
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

        const { unmount } = renderWithProviders(<OfflineNotice />);

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalled();
        clearIntervalSpy.mockRestore();
    });

    it('handles connection state changes', async () => {
        // Start connected
        mockGetNetworkStateAsync.mockResolvedValue({ isConnected: true });

        const { queryByText, getByText } = renderWithProviders(<OfflineNotice />);

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        expect(queryByText('offline.message')).toBeNull();

        // Simulate disconnect
        mockGetNetworkStateAsync.mockResolvedValue({ isConnected: false });

        await act(async () => {
            jest.advanceTimersByTime(5000);
        });

        await waitFor(() => {
            expect(getByText('offline.message')).toBeTruthy();
        });
    });

    it('handles undefined connection state', async () => {
        mockGetNetworkStateAsync.mockResolvedValue({ isConnected: undefined });

        const { queryByText } = renderWithProviders(<OfflineNotice />);

        await act(async () => {
            jest.advanceTimersByTime(100);
        });

        // isConnected !== false, so should be treated as connected
        expect(queryByText('offline.message')).toBeNull();
    });
});
