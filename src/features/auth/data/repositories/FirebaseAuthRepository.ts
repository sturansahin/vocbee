// src/features/auth/data/repositories/FirebaseAuthRepository.ts
// Layer: data (repository impl) | Feature: auth.
//
// ⚠️ PREP / NOT WIRED (Phase 4, docs/refactor-v2/24, /35 §1): not imported by running code, not exported
//    from the barrel (docs/refactor-v2/33 §4), not instantiated. It wraps the EXACT firebase/auth calls
//    currently inlined in context/AuthContext.tsx so the auth flows can be migrated incrementally (with
//    per-provider device QA) in a later step. Pure auth only — profile/sync orchestration stays in use-cases.

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
import { signInWithNativeGoogle } from '../../../../../services/nativeGoogleSignIn';
import type { AuthUser } from '../../domain/types';
import type { AuthRepository } from '../contracts';

const SOCIAL_AUTH_CANCELLED_ERROR = 'AUTH_CANCELLED';

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
}

export class FirebaseAuthRepository implements AuthRepository {
  getCurrentUser(): AuthUser | null {
    return mapUser(auth.currentUser);
  }

  onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, u => cb(mapUser(u)));
  }

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    return mapUser(cred.user)!;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(cred.user)!;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    const googleResult = await signInWithNativeGoogle();
    if (googleResult.type === 'cancelled') throw new Error(SOCIAL_AUTH_CANCELLED_ERROR);
    const credential = GoogleAuthProvider.credential(googleResult.idToken);
    const cred = await signInWithCredential(auth, credential);
    return mapUser(cred.user)!;
  }

  async signInWithApple(): Promise<AuthUser> {
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!appleCredential.identityToken) throw new Error('No identity token.');
    const provider = new OAuthProvider('apple.com');
    const authCredential = provider.credential({ idToken: appleCredential.identityToken });
    const cred = await signInWithCredential(auth, authCredential);
    return mapUser(cred.user)!;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email, {
      url: 'https://vocbee-6fe24.firebaseapp.com',
      handleCodeInApp: false,
    });
  }

  async deleteAuthUser(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No user is currently signed in');
    await deleteUser(user);
  }

  getLastSignInTimeMs(): number | null {
    const t = auth.currentUser?.metadata.lastSignInTime;
    if (!t) return null;
    const parsed = Date.parse(t);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
