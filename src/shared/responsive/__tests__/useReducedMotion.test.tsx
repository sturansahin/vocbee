import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { useReducedMotion } from '../useReducedMotion';

function Probe() {
  const reduced = useReducedMotion();
  return <Text testID="reduced-motion">{String(reduced)}</Text>;
}

describe('useReducedMotion', () => {
  it('reads the platform preference and reacts to changes', async () => {
    let listener: ((enabled: boolean) => void) | undefined;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
      _: string,
      callback: (enabled: boolean) => void,
    ) => {
      listener = callback;
      return { remove: jest.fn() };
    }) as unknown as typeof AccessibilityInfo.addEventListener);

    const { getByTestId } = render(<Probe />);
    await waitFor(() => expect(getByTestId('reduced-motion')).toHaveTextContent('true'));

    act(() => listener?.(false));
    expect(getByTestId('reduced-motion')).toHaveTextContent('false');
  });
});
