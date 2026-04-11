import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { GOOGLE_NATIVE_SIGN_IN_CONFIG } from './googleAuthConfig';

const GOOGLE_WEB_UNAVAILABLE_ERROR = 'GOOGLE_SIGN_IN_WEB_UNAVAILABLE';
const GOOGLE_ID_TOKEN_MISSING_ERROR = 'GOOGLE_ID_TOKEN_MISSING';
const DEFAULT_GOOGLE_ERROR_MESSAGE = 'Failed to sign in with Google. Please try again.';

let hasConfiguredNativeGoogleSignIn = false;

export interface NativeGoogleProfile {
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export type NativeGoogleSignInResult =
  | { type: 'cancelled' }
  | {
      type: 'success';
      idToken: string;
      profile: NativeGoogleProfile;
    };

export const configureNativeGoogleSignIn = (): void => {
  if (Platform.OS === 'web' || hasConfiguredNativeGoogleSignIn) {
    return;
  }

  GoogleSignin.configure(GOOGLE_NATIVE_SIGN_IN_CONFIG);
  hasConfiguredNativeGoogleSignIn = true;
};

export const signInWithNativeGoogle = async (): Promise<NativeGoogleSignInResult> => {
  if (Platform.OS === 'web') {
    throw new Error(GOOGLE_WEB_UNAVAILABLE_ERROR);
  }

  configureNativeGoogleSignIn();

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) {
      return { type: 'cancelled' };
    }

    if (!isSuccessResponse(response)) {
      throw new Error(DEFAULT_GOOGLE_ERROR_MESSAGE);
    }

    const { idToken, user } = response.data;
    if (!idToken) {
      throw new Error(GOOGLE_ID_TOKEN_MISSING_ERROR);
    }

    return {
      type: 'success',
      idToken,
      profile: {
        email: user.email,
        displayName: user.name,
        photoURL: user.photo,
      },
    };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { type: 'cancelled' };
    }

    throw error;
  }
};

export const disconnectNativeGoogleSession = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  configureNativeGoogleSignIn();

  try {
    await GoogleSignin.signOut();
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_REQUIRED) {
      return;
    }

    throw error;
  }
};

export const getNativeGoogleSignInErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message === GOOGLE_ID_TOKEN_MISSING_ERROR) {
      return 'No Google ID token received.';
    }

    if (error.message === GOOGLE_WEB_UNAVAILABLE_ERROR) {
      return 'Google Sign-In is only available in the native iOS and Android apps.';
    }
  }

  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.IN_PROGRESS:
        return 'Google Sign-In is already in progress.';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services is unavailable or needs an update on this device.';
      case statusCodes.SIGN_IN_REQUIRED:
        return 'Please choose a Google account to continue.';
      default:
        break;
    }
  }

  return DEFAULT_GOOGLE_ERROR_MESSAGE;
};
