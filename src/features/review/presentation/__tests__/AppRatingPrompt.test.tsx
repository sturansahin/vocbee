import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import { AppRatingPrompt } from '../AppRatingPrompt';

function renderPrompt(props: Partial<React.ComponentProps<typeof AppRatingPrompt>> = {}) {
  const onDismiss = jest.fn(async () => undefined);
  const onRateInStore = jest.fn(async () => undefined);
  const onSendFeedback = jest.fn(async () => undefined);
  const screen = render(
    <ThemeProvider forcedMode="light">
      <AppRatingPrompt
        visible
        onDismiss={onDismiss}
        onRateInStore={onRateInStore}
        onSendFeedback={onSendFeedback}
        {...props}
      />
    </ThemeProvider>,
  );
  return { ...screen, onDismiss, onRateInStore, onSendFeedback };
}

describe('AppRatingPrompt', () => {
  it('publishes rating selection and routes high ratings to the store once', async () => {
    let resolveRate: (() => void) | undefined;
    const onRateInStore = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRate = resolve;
        }),
    );
    const screen = renderPrompt({ onRateInStore });

    await act(async () => {
      fireEvent.press(screen.getByText('reviewPrompt.yes'));
    });
    const stars = screen.getAllByLabelText('reviewPrompt.starAccessibilityLabel');
    expect(stars).toHaveLength(5);
    fireEvent.press(stars[4]);
    expect(stars[4].props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));

    const submit = screen.getByText('reviewPrompt.rateInStore');
    fireEvent.press(submit);
    fireEvent.press(submit);
    expect(onRateInStore).toHaveBeenCalledTimes(1);
    expect(onRateInStore).toHaveBeenCalledWith(5);
    await act(async () => {
      resolveRate?.();
    });
  });

  it('routes negative sentiment to feedback and closes from the shared backdrop', async () => {
    const screen = renderPrompt();
    await act(async () => {
      fireEvent.press(screen.getByText('reviewPrompt.notYet'));
    });
    await act(async () => {
      fireEvent.press(screen.getByText('reviewPrompt.sendFeedback'));
    });
    await waitFor(() => expect(screen.onSendFeedback).toHaveBeenCalledWith());

    fireEvent.press(screen.getByTestId('app-modal-backdrop', { includeHiddenElements: true }));
    await waitFor(() => expect(screen.onDismiss).toHaveBeenCalledTimes(1));
  });
});
