import {
  getProfileAvatarByValue,
  getProfileImageSource,
  PROFILE_AVATAR_PREFIX,
  PROFILE_AVATARS,
} from '../profileAvatar';

describe('profileAvatar', () => {
  const fallbackSource = { uri: 'fallback-avatar' };

  it('exposes six bundled avatars with stable storage values', () => {
    expect(PROFILE_AVATARS).toHaveLength(6);
    expect(new Set(PROFILE_AVATARS.map(avatar => avatar.value)).size).toBe(6);
    expect(PROFILE_AVATARS[0].value).toBe(`${PROFILE_AVATAR_PREFIX}avatar1`);
  });

  it('resolves stored avatar values to bundled image sources', () => {
    const avatar = PROFILE_AVATARS[0];

    expect(getProfileAvatarByValue(avatar.value)).toEqual(avatar);
    expect(getProfileImageSource(avatar.value, fallbackSource)).toBe(avatar.source);
  });

  it('keeps remote and device image uris unchanged', () => {
    expect(getProfileImageSource('file:///profile/photo.png', fallbackSource)).toEqual({
      uri: 'file:///profile/photo.png',
    });
    expect(getProfileImageSource('https://image.example/profile.png', fallbackSource)).toEqual({
      uri: 'https://image.example/profile.png',
    });
  });

  it('falls back for empty or unknown bundled avatar values', () => {
    expect(getProfileImageSource(null, fallbackSource)).toBe(fallbackSource);
    expect(getProfileImageSource(`${PROFILE_AVATAR_PREFIX}missing`, fallbackSource)).toBe(fallbackSource);
  });
});
