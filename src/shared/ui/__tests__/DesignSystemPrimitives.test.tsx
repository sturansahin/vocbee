import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import {
  AppAlert,
  AppButton,
  AppInput,
  AppModal,
  AppSwitch,
  EmptyState,
  IconButton,
  LoadingState,
  ProgressBar,
  SelectionRow,
  SettingsRow,
} from '@shared/ui';

function renderWithTheme(node: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(<ThemeProvider forcedMode={mode}>{node}</ThemeProvider>);
}

describe('design-system primitives', () => {
  it.each(['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const)(
    'renders and presses the %s button variant',
    (variant) => {
      const onPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <AppButton label={`${variant} action`} onPress={onPress} variant={variant} />,
      );

      fireEvent.press(getByRole('button', { name: `${variant} action` }));
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('blocks button presses while externally loading or disabled', () => {
    const onPress = jest.fn();
    const { getByRole, rerender } = renderWithTheme(
      <AppButton label="Save" loading onPress={onPress} />,
    );

    const loadingButton = getByRole('button', { name: 'Save' });
    expect(loadingButton).toHaveProp('accessibilityState', { busy: true, disabled: true });
    fireEvent.press(loadingButton);

    rerender(
      <ThemeProvider forcedMode="light">
        <AppButton disabled label="Save" onPress={onPress} />
      </ThemeProvider>,
    );
    fireEvent.press(getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('guards an async button against double submit', async () => {
    let resolve: (() => void) | undefined;
    const onPress = jest.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const { getByRole } = renderWithTheme(<AppButton label="Submit" onPress={onPress} />);
    const button = getByRole('button', { name: 'Submit' });

    fireEvent.press(button);
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);

    resolve?.();
    await waitFor(() => expect(onPress).toHaveBeenCalledTimes(1));
  });

  it.each(['light', 'dark'] as const)('renders semantic button styles in %s theme', (mode) => {
    const { getByRole } = renderWithTheme(
      <AppButton label="Theme action" onPress={jest.fn()} />,
      mode,
    );
    expect(getByRole('button', { name: 'Theme action' })).toBeTruthy();
  });

  it('requires an icon label and preserves a 44-point target', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(
      <IconButton
        accessibilityLabel="Close dialog"
        icon={<Text>×</Text>}
        onPress={onPress}
        size={24}
      />,
    );
    const button = getByRole('button', { name: 'Close dialog' });

    expect(button).toHaveStyle({ width: 44, height: 44 });
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('associates visible input help/error and exposes password visibility', () => {
    const { getByLabelText, getByText, rerender } = renderWithTheme(
      <AppInput helperText="Use your account email" label="Email" />,
    );
    expect(getByLabelText('Email')).toHaveProp('accessibilityHint', 'Use your account email');
    expect(getByText('Use your account email')).toBeTruthy();

    rerender(
      <ThemeProvider forcedMode="dark">
        <AppInput errorText="Required" label="Password" secureTextEntry />
      </ThemeProvider>,
    );
    expect(getByText('Error: Required')).toBeTruthy();
    const password = getByLabelText('Password');
    expect(password).toHaveProp('secureTextEntry', true);
    fireEvent.press(getByRoleByLabel(getByLabelText, 'Show password'));
    expect(password).toHaveProp('secureTextEntry', false);
  });

  it('publishes switch and progress accessibility states', () => {
    const { getByRole } = renderWithTheme(
      <>
        <AppSwitch accessibilityLabel="Daily reminders" onValueChange={jest.fn()} value />
        <ProgressBar accessibilityLabel="Course progress" value={0.42} />
      </>,
    );

    expect(getByRole('switch', { name: 'Daily reminders' })).toHaveProp('accessibilityState', {
      checked: true,
      disabled: false,
    });
    expect(getByRole('progressbar', { name: 'Course progress' })).toHaveProp('accessibilityValue', {
      min: 0,
      max: 100,
      now: 42,
    });
  });

  it('publishes selection and settings row states and interactions', () => {
    const select = jest.fn();
    const open = jest.fn();
    const { getByRole } = renderWithTheme(
      <>
        <SelectionRow label="English" onPress={select} selected />
        <SettingsRow label="Language" onPress={open} showChevron value="English" />
      </>,
    );

    expect(getByRole('radio', { name: 'English' })).toHaveProp('accessibilityState', {
      checked: true,
      disabled: false,
    });
    fireEvent.press(getByRole('radio', { name: 'English' }));
    fireEvent.press(getByRole('button', { name: 'Language' }));
    expect(select).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('honors explicit modal backdrop dismissal behavior', () => {
    const close = jest.fn();
    const { getByTestId, rerender } = renderWithTheme(
      <AppModal onRequestClose={close} title="Edit profile" visible>
        <Text>Body</Text>
      </AppModal>,
    );

    fireEvent.press(getByTestId('app-modal-backdrop', { includeHiddenElements: true }));
    expect(close).toHaveBeenCalledTimes(1);

    rerender(
      <ThemeProvider forcedMode="light">
        <AppModal
          dismissOnBackdropPress={false}
          onRequestClose={close}
          title="Edit profile"
          visible
        />
      </ThemeProvider>,
    );
    fireEvent.press(getByTestId('app-modal-backdrop', { includeHiddenElements: true }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('renders alert actions and distinct loading/empty state semantics', () => {
    const confirm = jest.fn();
    const { getByRole, getByText, rerender } = renderWithTheme(
      <AppAlert
        actions={[{ label: 'Delete', onPress: confirm, variant: 'destructive' }]}
        onRequestClose={jest.fn()}
        title="Delete account?"
        visible
      />,
    );
    fireEvent.press(getByRole('button', { name: 'Delete' }));
    expect(confirm).toHaveBeenCalledTimes(1);

    rerender(
      <ThemeProvider forcedMode="light">
        <LoadingState title="Loading words" />
      </ThemeProvider>,
    );
    expect(getByText('Loading words')).toBeTruthy();

    rerender(
      <ThemeProvider forcedMode="light">
        <EmptyState message="Favorite a word to see it here." title="No favorites" />
      </ThemeProvider>,
    );
    expect(getByText('No favorites')).toBeTruthy();
  });
});

function getByRoleByLabel(
  getByLabelText: ReturnType<typeof render>['getByLabelText'],
  label: string,
) {
  return getByLabelText(label);
}
