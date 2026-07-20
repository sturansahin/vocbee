import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import {
  AccessibilityCatalogScreen,
  ComponentCatalogScreen,
  MotionCatalogScreen,
  ResponsiveCatalogScreen,
  StateCatalogScreen,
  ThemeCatalogScreen,
} from '../screens/CatalogScreens';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

function renderCatalog(node: React.ReactElement) {
  return render(<ThemeProvider forcedMode="light">{node}</ThemeProvider>);
}

describe('Developer Test Panel catalogs', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  it('presses every interactive component catalog entry without external side effects', () => {
    const { getByTestId, getByText } = renderCatalog(<ComponentCatalogScreen />);

    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'destructive']) {
      fireEvent.press(getByTestId(`catalog-button-${variant}`));
    }
    fireEvent.press(getByTestId('catalog-icon-button'));
    fireEvent(getByTestId('catalog-switch'), 'valueChange', true);
    fireEvent.press(getByTestId('catalog-selection-compact'));
    fireEvent.press(getByTestId('catalog-selection-wide'));
    fireEvent.press(getByTestId('catalog-open-modal'));
    expect(getByText('Catalog modal')).toBeTruthy();
    fireEvent.press(getByTestId('catalog-modal-done'));
    fireEvent.press(getByTestId('devtools-catalog-back-components'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('opens every async state and exercises retry', () => {
    const { getByTestId, getByRole } = renderCatalog(<StateCatalogScreen />);

    for (const state of [
      'empty',
      'offline',
      'home-ready',
      'home-tutorial',
      'settings-free',
      'settings-premium',
      'settings-permission-denied',
      'error',
    ]) {
      fireEvent.press(getByTestId(`catalog-state-${state}`));
    }
    fireEvent.press(getByRole('button', { name: 'Retry' }));
    fireEvent.press(getByTestId('devtools-catalog-back-states'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('renders both themes and the live responsive contract', () => {
    const theme = renderCatalog(<ThemeCatalogScreen />);
    expect(theme.getByTestId('catalog-theme-light')).toBeTruthy();
    expect(theme.getByTestId('catalog-theme-dark')).toBeTruthy();
    fireEvent.press(theme.getByTestId('devtools-catalog-back-theme'));
    theme.unmount();

    const responsive = renderCatalog(<ResponsiveCatalogScreen />);
    expect(responsive.getByText(/Size class:/)).toBeTruthy();
    expect(responsive.getByText(/Orientation:/)).toBeTruthy();
    fireEvent.press(responsive.getByTestId('devtools-catalog-back-responsive'));
    expect(mockGoBack).toHaveBeenCalledTimes(2);
  });

  it('presses accessibility and motion controls', async () => {
    const accessibility = renderCatalog(<AccessibilityCatalogScreen />);
    fireEvent.press(accessibility.getByTestId('catalog-accessibility-action'));
    expect(accessibility.getByText('Accessible action activated')).toBeTruthy();
    fireEvent.press(accessibility.getByTestId('devtools-catalog-back-accessibility'));
    accessibility.unmount();

    const motion = renderCatalog(<MotionCatalogScreen />);
    await waitFor(() => expect(motion.getByText('Platform reduced motion: false')).toBeTruthy());
    fireEvent(motion.getByTestId('catalog-motion-switch'), 'valueChange', true);
    expect(motion.getByText('Static celebration')).toBeTruthy();
    fireEvent.press(motion.getByTestId('devtools-catalog-back-motion'));
    expect(mockGoBack).toHaveBeenCalledTimes(2);
  });
});
