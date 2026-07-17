import {
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_NATIVE_SIGN_IN_CONFIG,
  GOOGLE_WEB_CLIENT_ID,
} from '../googleAuthConfig';

describe('googleAuthConfig', () => {
  it('uses distinct native and web client IDs', () => {
    expect(GOOGLE_IOS_CLIENT_ID).not.toBe(GOOGLE_WEB_CLIENT_ID);
  });

  it('exposes the native sign-in configuration used by the Google SDK', () => {
    expect(GOOGLE_NATIVE_SIGN_IN_CONFIG).toEqual({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
  });
});
