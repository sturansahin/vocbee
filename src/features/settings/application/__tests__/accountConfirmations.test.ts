import { buildAccountConfirmation } from '../accountConfirmations';

describe('settings account confirmations', () => {
  it.each(['Sign out', 'Delete account'])(
    'runs %s only after destructive confirmation',
    confirmLabel => {
      const onConfirm = jest.fn();
      const alert = buildAccountConfirmation(
        {
          title: 'Confirm',
          message: 'Are you sure?',
          cancelLabel: 'Cancel',
          confirmLabel,
        },
        onConfirm
      );

      expect(alert.buttons[0].style).toBe('cancel');
      expect(onConfirm).not.toHaveBeenCalled();
      alert.buttons[1].onPress?.();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    }
  );
});
