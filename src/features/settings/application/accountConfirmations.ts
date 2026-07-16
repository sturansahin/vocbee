export interface ConfirmationButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface ConfirmationAlert {
  title: string;
  message: string;
  buttons: ConfirmationButton[];
}

interface ConfirmationCopy {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
}

export function buildAccountConfirmation(
  copy: ConfirmationCopy,
  onConfirm: () => void
): ConfirmationAlert {
  return {
    title: copy.title,
    message: copy.message,
    buttons: [
      { text: copy.cancelLabel, style: 'cancel' },
      { text: copy.confirmLabel, style: 'destructive', onPress: onConfirm },
    ],
  };
}
