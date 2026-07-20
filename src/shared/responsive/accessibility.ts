import type { AccessibilityState, ViewStyle } from 'react-native';

export const MINIMUM_TOUCH_TARGET = 44;

export const touchTargetStyle: Readonly<ViewStyle> = Object.freeze({
  minWidth: MINIMUM_TOUCH_TARGET,
  minHeight: MINIMUM_TOUCH_TARGET,
});

export function selectionAccessibilityState(
  selected: boolean,
  disabled = false,
): AccessibilityState {
  return { selected, disabled };
}

export function checkedAccessibilityState(checked: boolean, disabled = false): AccessibilityState {
  return { checked, disabled };
}

export function busyAccessibilityState(busy: boolean, disabled = false): AccessibilityState {
  return { busy, disabled };
}
