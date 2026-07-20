import { settingsModalReducer } from '../useSettingsModalState';

describe('settingsModalReducer', () => {
  it('keeps exactly one modal active and supports atomic modal transitions', () => {
    expect(settingsModalReducer(null, { type: 'open', modal: 'image-picker' })).toBe(
      'image-picker',
    );
    expect(settingsModalReducer('image-picker', { type: 'open', modal: 'avatar-picker' })).toBe(
      'avatar-picker',
    );
    expect(settingsModalReducer('avatar-picker', { type: 'close' })).toBeNull();
  });

  it.each([
    'time-start',
    'time-end',
    'frequency',
    'language',
    'help',
    'level',
    'auto-mark',
    'edit-profile',
    'image-picker',
    'avatar-picker',
  ] as const)('opens and closes the %s modal through the shared state contract', (modal) => {
    const opened = settingsModalReducer(null, { type: 'open', modal });
    expect(opened).toBe(modal);
    expect(settingsModalReducer(opened, { type: 'close' })).toBeNull();
  });
});
