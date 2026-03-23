import appConfig from '../app.json';

export const GOOGLE_WEB_CLIENT_ID =
  '540292978044-pjka45r8ej0k63564hicngf1prip5ctu.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID =
  '540292978044-695plkaeec13scn3p2s76h302sieti4g.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID =
  '540292978044-2c8urh00ip44furlns58hq4ieil3bfno.apps.googleusercontent.com';

export const APP_PRIMARY_SCHEME = Array.isArray(appConfig.expo.scheme)
  ? appConfig.expo.scheme[0]
  : appConfig.expo.scheme ?? 'vocbee';

export const GOOGLE_ANDROID_AUTH_SCHEME =
  appConfig.expo.android?.package ?? 'com.vocbee.app';
export const GOOGLE_IOS_AUTH_SCHEME =
  'com.googleusercontent.apps.540292978044-695plkaeec13scn3p2s76h302sieti4g';

export const GOOGLE_ANDROID_REDIRECT_URI = `${GOOGLE_ANDROID_AUTH_SCHEME}:/oauthredirect`;
export const GOOGLE_IOS_REDIRECT_URI = `${GOOGLE_IOS_AUTH_SCHEME}:/oauthredirect`;
