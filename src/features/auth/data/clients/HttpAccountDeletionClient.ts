import appConfig from '../../../../../app.json';

import type { AccountDeletionClient } from '../contracts';

const APP_CONFIG_DELETE_ACCOUNT_URL = appConfig.expo.extra?.deleteAccountUrl ?? '';
const DELETE_ACCOUNT_URL = (
  process.env.EXPO_PUBLIC_DELETE_ACCOUNT_URL || (!__DEV__ ? APP_CONFIG_DELETE_ACCOUNT_URL : '')
).trim();

const recentLoginError = (): Error => {
  const error = new Error('Please log out and log in again before deleting your account.');
  (error as Error & { code?: string }).code = 'auth/requires-recent-login';
  return error;
};

export class HttpAccountDeletionClient implements AccountDeletionClient {
  async deleteAccount(getIdToken: () => Promise<string>): Promise<boolean> {
    if (!DELETE_ACCOUNT_URL) {
      if (!__DEV__) throw new Error('Account deletion endpoint is not configured.');
      return false;
    }

    const idToken = await getIdToken();
    const response = await fetch(DELETE_ACCOUNT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) return true;

    let code = 'DELETE_ACCOUNT_FAILED';
    try {
      const body = await response.json();
      code = body?.error?.code || code;
    } catch {
      // Keep the generic error code when the endpoint did not return JSON.
    }
    if (code === 'RECENT_LOGIN_REQUIRED' || code === 'INVALID_AUTH_TOKEN') {
      throw recentLoginError();
    }
    throw new Error('Failed to delete account. Please try again.');
  }
}
