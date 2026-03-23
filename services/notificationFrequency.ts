export const NOTIFICATION_FREQUENCY_OPTIONS = [
    { key: 'every1hour', minutes: 60 },
    { key: 'every2hours', minutes: 120 },
    { key: 'every3hours', minutes: 180 },
    { key: 'every6hours', minutes: 360 },
    { key: 'onceDaily', minutes: 1440 },
] as const;

export type NotificationFrequencyOption = (typeof NOTIFICATION_FREQUENCY_OPTIONS)[number];
export type NotificationFrequencyKey = NotificationFrequencyOption['key'];

export const DEFAULT_NOTIFICATION_FREQUENCY_KEY: NotificationFrequencyKey = 'every2hours';
export const NOTIFICATION_FREQUENCY_KEYS = NOTIFICATION_FREQUENCY_OPTIONS.map(
    option => option.key
) as NotificationFrequencyKey[];

const FREQUENCY_MINUTES_BY_KEY: Record<NotificationFrequencyKey, number> = {
    every1hour: 60,
    every2hours: 120,
    every3hours: 180,
    every6hours: 360,
    onceDaily: 1440,
};

export function getNotificationFrequencyMinutes(key: string): number {
    return FREQUENCY_MINUTES_BY_KEY[key as NotificationFrequencyKey]
        ?? FREQUENCY_MINUTES_BY_KEY[DEFAULT_NOTIFICATION_FREQUENCY_KEY];
}

export function getNotificationFrequencyKey(minutes: number): NotificationFrequencyKey {
    const match = NOTIFICATION_FREQUENCY_OPTIONS.find(option => option.minutes === minutes);
    return match?.key ?? DEFAULT_NOTIFICATION_FREQUENCY_KEY;
}
