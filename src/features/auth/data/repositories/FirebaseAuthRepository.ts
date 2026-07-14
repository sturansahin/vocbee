import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  deleteUser,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';

import { auth } from '../../../../../config/firebase';
import type {
  AuthProfilePatch,
  AuthSignInResult,
  AuthUser,
  EmailSignInRequest,
} from '../../domain/types';
import { SOCIAL_AUTH_CANCELLED_ERROR } from '../../domain/types';
import type { AuthRepository } from '../contracts';
import {
  configureNativeGoogleSignIn,
  disconnectNativeGoogleSession,
  signInWithNativeGoogle,
} from '../providers/nativeGoogleSignIn';
import {
  createAuthSignInProvider,
  type AuthProviderFactoryDependencies,
} from '../providers/AuthProviderFactory';

const mapUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
});

export class FirebaseAuthRepository implements AuthRepository {
  private readonly providerDependencies: AuthProviderFactoryDependencies = {
    email: async ({ email, password }: EmailSignInRequest): Promise<AuthSignInResult> => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { user: mapUser(credential.user) };
    },
    google: async (): Promise<AuthSignInResult> => {
      const googleResult = await signInWithNativeGoogle();
      if (googleResult.type === 'cancelled') {
        throw new Error(SOCIAL_AUTH_CANCELLED_ERROR);
      }
      const credential = GoogleAuthProvider.credential(googleResult.idToken);
      const firebaseCredential = await signInWithCredential(auth, credential);
      return {
        user: mapUser(firebaseCredential.user),
        providerProfile: googleResult.profile,
      };
    },
    apple: async (): Promise<AuthSignInResult> => {
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!appleCredential.identityToken) throw new Error('No identity token.');

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: appleCredential.identityToken });
      const firebaseCredential = await signInWithCredential(auth, credential);
      const user = mapUser(firebaseCredential.user);
      const fullName = appleCredential.fullName?.givenName
        ? `${appleCredential.fullName.givenName} ${appleCredential.fullName.familyName || ''}`.trim()
        : null;

      return {
        user,
        providerProfile: {
          email: user.email || appleCredential.email || '',
          displayName: user.displayName || fullName,
          photoURL: user.photoURL,
        },
      };
    },
  };

  configure(): void {
    configureNativeGoogleSignIn();
  }

  getCurrentUser(): AuthUser | null {
    return auth.currentUser ? mapUser(auth.currentUser) : null;
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, user => callback(user ? mapUser(user) : null));
  }

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(credential.user, { displayName });
    return mapUser(credential.user);
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const provider = createAuthSignInProvider('email', this.providerDependencies);
    return (await provider.signIn({ email, password })).user;
  }

  async signInWithGoogle(): Promise<AuthSignInResult> {
    return createAuthSignInProvider('google', this.providerDependencies).signIn();
  }

  async signInWithApple(): Promise<AuthSignInResult> {
    return createAuthSignInProvider('apple', this.providerDependencies).signIn();
  }

  async updateCurrentUserProfile(patch: AuthProfilePatch): Promise<void> {
    if (!auth.currentUser) throw new Error('No user is currently signed in');
    await updateProfile(auth.currentUser, patch);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async disconnectProviderSessions(): Promise<void> {
    await disconnectNativeGoogleSession();
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email, {
      url: 'https://vocbee-6fe24.firebaseapp.com',
      handleCodeInApp: false,
    });
  }

  async deleteAuthUser(): Promise<void> {
    if (!auth.currentUser) throw new Error('No user is currently signed in');
    await deleteUser(auth.currentUser);
  }

  async getIdToken(): Promise<string> {
    if (!auth.currentUser) throw new Error('No user is currently signed in');
    return auth.currentUser.getIdToken();
  }

  getLastSignInTimeMs(): number | null {
    const value = auth.currentUser?.metadata.lastSignInTime;
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
