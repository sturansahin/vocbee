import { ImageSourcePropType } from 'react-native';

export const PROFILE_AVATAR_PREFIX = 'vocbee-avatar:' as const;

export const PROFILE_AVATAR_IDS = [
  'avatar1',
  'avatar2',
  'avatar3',
  'avatar4',
  'avatar5',
  'avatar6',
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATAR_IDS)[number];
export type ProfileAvatarValue = `${typeof PROFILE_AVATAR_PREFIX}${ProfileAvatarId}`;

export interface ProfileAvatarOption {
  id: ProfileAvatarId;
  value: ProfileAvatarValue;
  source: ImageSourcePropType;
}

const PROFILE_AVATAR_SOURCES: Record<ProfileAvatarId, ImageSourcePropType> = {
  avatar1: require('../../../assets/icons/avatar1.png'),
  avatar2: require('../../../assets/icons/avatar2.png'),
  avatar3: require('../../../assets/icons/avatar3.png'),
  avatar4: require('../../../assets/icons/avatar4.png'),
  avatar5: require('../../../assets/icons/avatar5.png'),
  avatar6: require('../../../assets/icons/avatar6.png'),
};

export const PROFILE_AVATARS: readonly ProfileAvatarOption[] = PROFILE_AVATAR_IDS.map((id) => ({
  id,
  value: `${PROFILE_AVATAR_PREFIX}${id}` as ProfileAvatarValue,
  source: PROFILE_AVATAR_SOURCES[id],
}));

export function getProfileAvatarByValue(value?: string | null): ProfileAvatarOption | null {
  if (!value?.startsWith(PROFILE_AVATAR_PREFIX)) {
    return null;
  }

  return PROFILE_AVATARS.find((avatar) => avatar.value === value) ?? null;
}

export function getProfileImageSource(
  image: string | null | undefined,
  fallbackSource: ImageSourcePropType,
): ImageSourcePropType {
  if (!image) {
    return fallbackSource;
  }

  const avatar = getProfileAvatarByValue(image);
  if (avatar) {
    return avatar.source;
  }

  if (image.startsWith(PROFILE_AVATAR_PREFIX)) {
    return fallbackSource;
  }

  return { uri: image };
}
