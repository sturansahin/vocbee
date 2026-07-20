import { useCallback, useReducer } from 'react';

export type SettingsModal =
  | 'time-start'
  | 'time-end'
  | 'frequency'
  | 'language'
  | 'help'
  | 'level'
  | 'auto-mark'
  | 'edit-profile'
  | 'image-picker'
  | 'avatar-picker'
  | null;

type ModalAction = { type: 'open'; modal: Exclude<SettingsModal, null> } | { type: 'close' };

export function settingsModalReducer(_state: SettingsModal, action: ModalAction): SettingsModal {
  return action.type === 'open' ? action.modal : null;
}

export function useSettingsModalState() {
  const [modal, dispatch] = useReducer(settingsModalReducer, null);
  const openModal = useCallback(
    (next: Exclude<SettingsModal, null>) => dispatch({ type: 'open', modal: next }),
    [],
  );
  const closeModal = useCallback(() => dispatch({ type: 'close' }), []);

  return { modal, openModal, closeModal };
}
