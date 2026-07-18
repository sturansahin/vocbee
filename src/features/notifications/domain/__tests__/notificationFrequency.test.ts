import { DEFAULT_NOTIFICATION_FREQUENCY_KEY, NOTIFICATION_FREQUENCY_KEYS } from '../constants';
import { getNotificationFrequencyKey, getNotificationFrequencyMinutes } from '../rules';

describe('notificationFrequency', () => {
  it('exposes all supported frequency keys in display order', () => {
    expect(NOTIFICATION_FREQUENCY_KEYS).toEqual([
      'every1hour',
      'every2hours',
      'every3hours',
      'every6hours',
      'onceDaily',
    ]);
  });

  it('maps keys to minutes', () => {
    expect(getNotificationFrequencyMinutes('every1hour')).toBe(60);
    expect(getNotificationFrequencyMinutes('every2hours')).toBe(120);
    expect(getNotificationFrequencyMinutes('every3hours')).toBe(180);
    expect(getNotificationFrequencyMinutes('every6hours')).toBe(360);
    expect(getNotificationFrequencyMinutes('onceDaily')).toBe(1440);
  });

  it('maps minutes back to keys', () => {
    expect(getNotificationFrequencyKey(60)).toBe('every1hour');
    expect(getNotificationFrequencyKey(120)).toBe('every2hours');
    expect(getNotificationFrequencyKey(180)).toBe('every3hours');
    expect(getNotificationFrequencyKey(360)).toBe('every6hours');
    expect(getNotificationFrequencyKey(1440)).toBe('onceDaily');
  });

  it('falls back to the default option for unsupported values', () => {
    expect(getNotificationFrequencyMinutes('unsupported')).toBe(120);
    expect(getNotificationFrequencyKey(999)).toBe(DEFAULT_NOTIFICATION_FREQUENCY_KEY);
  });
});
