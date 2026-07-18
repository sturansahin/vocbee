const mockConfigure = jest.fn();
const mockHasPlayServices = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();

jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'android',
    },
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: mockConfigure,
    hasPlayServices: mockHasPlayServices,
    signIn: mockSignIn,
    signOut: mockSignOut,
  },
  isCancelledResponse: (response: { type?: string }) => response?.type === 'cancelled',
  isSuccessResponse: (response: { type?: string }) => response?.type === 'success',
  isErrorWithCode: (error: { code?: unknown }) => typeof error?.code === 'string',
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  },
}));

describe('nativeGoogleSignIn', () => {
  const loadModule = () => require('../nativeGoogleSignIn');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('configures the native SDK with the web and iOS client IDs', () => {
    const { configureNativeGoogleSignIn } = loadModule();

    configureNativeGoogleSignIn();

    expect(mockConfigure).toHaveBeenCalledWith({
      webClientId: '540292978044-pjka45r8ej0k63564hicngf1prip5ctu.apps.googleusercontent.com',
      iosClientId: '540292978044-695plkaeec13scn3p2s76h302sieti4g.apps.googleusercontent.com',
    });
  });

  it('normalizes a successful Google sign-in response', async () => {
    mockSignIn.mockResolvedValue({
      type: 'success',
      data: {
        idToken: 'google-id-token',
        user: {
          email: 'vocbee@example.com',
          name: 'VocBee User',
          photo: 'https://image.example/avatar.png',
        },
      },
    });

    const { signInWithNativeGoogle } = loadModule();

    await expect(signInWithNativeGoogle()).resolves.toEqual({
      type: 'success',
      idToken: 'google-id-token',
      profile: {
        email: 'vocbee@example.com',
        displayName: 'VocBee User',
        photoURL: 'https://image.example/avatar.png',
      },
    });
    expect(mockHasPlayServices).toHaveBeenCalledWith({ showPlayServicesUpdateDialog: true });
  });

  it('returns a cancelled result when the user dismisses Google sign-in', async () => {
    mockSignIn.mockResolvedValue({
      type: 'cancelled',
      data: null,
    });

    const { signInWithNativeGoogle } = loadModule();

    await expect(signInWithNativeGoogle()).resolves.toEqual({ type: 'cancelled' });
  });

  it('maps native Google errors into user-facing messages', () => {
    const { getNativeGoogleSignInErrorMessage } = loadModule();

    expect(getNativeGoogleSignInErrorMessage({ code: 'IN_PROGRESS' })).toBe(
      'Google Sign-In is already in progress.',
    );
    expect(getNativeGoogleSignInErrorMessage({ code: 'PLAY_SERVICES_NOT_AVAILABLE' })).toBe(
      'Google Play Services is unavailable or needs an update on this device.',
    );
  });

  it('treats missing native Google state as a no-op during sign-out cleanup', async () => {
    mockSignOut.mockRejectedValue({ code: 'SIGN_IN_REQUIRED' });

    const { disconnectNativeGoogleSession } = loadModule();

    await expect(disconnectNativeGoogleSession()).resolves.toBeUndefined();
  });
});
