import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import OnboardingScreen from '../OnboardingScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@shared/responsive', () => ({
  useResponsiveLayout: () => ({
    width: 393,
    height: 852,
    orientation: 'portrait',
    sizeClass: 'regular',
    isSmallHeight: false,
    contentMaxWidth: 680,
    horizontalGutter: 24,
    moderateScale: (value: number) => value,
  }),
  useReducedMotion: () => true,
}));

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes selected pagination state and walks first-to-last actions', () => {
    const facade = { complete: jest.fn(async () => undefined) };
    const { getByTestId, queryByTestId } = render(
      <ThemeProvider forcedMode="light">
        <OnboardingScreen facade={facade} />
      </ThemeProvider>,
    );

    expect(getByTestId('onboarding-dot-0')).toHaveProp('accessibilityState', {
      selected: true,
    });
    fireEvent.press(getByTestId('onboarding-next'));
    expect(getByTestId('onboarding-dot-1')).toHaveProp('accessibilityState', {
      selected: true,
    });
    fireEvent.scroll(getByTestId('onboarding-carousel'), {
      nativeEvent: {
        contentOffset: { x: 393 * 3, y: 0 },
        contentSize: { width: 393 * 4, height: 852 },
        layoutMeasurement: { width: 393, height: 852 },
      },
    });
    expect(queryByTestId('onboarding-next')).toBeNull();
    expect(getByTestId('onboarding-start')).toBeTruthy();
  });

  it.each(['onboarding-skip', 'onboarding-start'])(
    'completes once and navigates to Login from %s',
    async (entry) => {
      const facade = { complete: jest.fn(async () => undefined) };
      const screen = render(
        <ThemeProvider forcedMode="dark">
          <OnboardingScreen facade={facade} />
        </ThemeProvider>,
      );

      if (entry === 'onboarding-start') {
        fireEvent.scroll(screen.getByTestId('onboarding-carousel'), {
          nativeEvent: {
            contentOffset: { x: 393 * 3, y: 0 },
            contentSize: { width: 393 * 4, height: 852 },
            layoutMeasurement: { width: 393, height: 852 },
          },
        });
      }

      fireEvent.press(screen.getByTestId(entry));
      fireEvent.press(screen.getByTestId(entry));
      await waitFor(() => expect(facade.complete).toHaveBeenCalledTimes(1));
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    },
  );
});
