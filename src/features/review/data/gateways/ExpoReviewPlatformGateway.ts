import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

import appConfig from '../../../../../app.json';
import type { ReviewPlatformGateway } from '../../application/contracts';

const IOS_APP_STORE_ID = '6760262917';
const ANDROID_PACKAGE_NAME = 'com.vocbee.app';
const appendQueryParam = (url: string, param: string) => `${url}${url.includes('?') ? '&' : '?'}${param}`;

export class ExpoReviewPlatformGateway implements ReviewPlatformGateway {
  readonly platform = Platform.OS;
  readonly appVersion = Constants.expoConfig?.version ?? appConfig.expo.version ?? 'unknown';

  async isNativeReviewAvailable(): Promise<boolean> {
    const available = await StoreReview.isAvailableAsync();
    const hasAction = await StoreReview.hasAction();
    return available && hasAction;
  }
  requestNativeReview(): Promise<void> { return StoreReview.requestReview(); }
  getStoreReviewUrls(): string[] {
    if (this.platform === 'ios') return [
      `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${IOS_APP_STORE_ID}?action=write-review`,
      appendQueryParam(appConfig.expo.ios.appStoreUrl, 'action=write-review'),
    ];
    if (this.platform === 'android') return [
      `market://details?id=${ANDROID_PACKAGE_NAME}&showAllReviews=true`,
      appendQueryParam(appConfig.expo.android.playStoreUrl, 'showAllReviews=true'),
    ];
    return [];
  }
  canOpenUrl(url: string): Promise<boolean> { return url.startsWith('http') ? Promise.resolve(true) : Linking.canOpenURL(url); }
  openUrl(url: string): Promise<void> { return Linking.openURL(url); }
}
