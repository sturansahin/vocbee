import { PROFILE_AVATARS } from '@shared/utils';

export const ITEM_HEIGHT = 44;
export const HOURS = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'));
export const HOURS_EXTENDED = [...HOURS, ...HOURS, ...HOURS];
export const MINUTES_EXTENDED = [...MINUTES, ...MINUTES, ...MINUTES];
export const AVATAR_COLUMNS = 3;
export const PROFILE_AVATAR_ROWS = Array.from(
  { length: Math.ceil(PROFILE_AVATARS.length / AVATAR_COLUMNS) },
  (_, rowIndex) =>
    PROFILE_AVATARS.slice(rowIndex * AVATAR_COLUMNS, (rowIndex + 1) * AVATAR_COLUMNS),
);
