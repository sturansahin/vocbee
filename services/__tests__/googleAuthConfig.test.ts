import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_ANDROID_REDIRECT_URI,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_IOS_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
} from '../googleAuthConfig';

describe('googleAuthConfig', () => {
  it('uses distinct native and web client IDs', () => {
    expect(GOOGLE_IOS_CLIENT_ID).not.toBe(GOOGLE_WEB_CLIENT_ID);
    expect(GOOGLE_ANDROID_CLIENT_ID).not.toBe(GOOGLE_WEB_CLIENT_ID);
  });

  it('builds native redirect URIs for installed app flows', () => {
    expect(GOOGLE_IOS_REDIRECT_URI).toBe(
      'com.googleusercontent.apps.540292978044-695plkaeec13scn3p2s76h302sieti4g:/oauthredirect'
    );
    expect(GOOGLE_ANDROID_REDIRECT_URI).toBe('com.vocbee.app:/oauthredirect');
  });
});
