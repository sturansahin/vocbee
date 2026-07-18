import { createUserProfileRepository } from '@features/profile';
import {
  autoSync,
  createUserDocument,
  fetchAndSaveUserData,
  forceSync,
  getActiveDeviceIdFromFirebase,
  shouldSync,
  syncAuthProfileToFirestore,
  syncNotificationSettingsToFirestore,
  syncToFirestore,
  type SyncOrchestrator,
} from '@features/sync';

import { DefaultAuthFacade } from '../application/AuthFacade';
import type { AuthFacade } from '../application/contracts';
import { HttpAccountDeletionClient } from '../data/clients/HttpAccountDeletionClient';
import { LegacyAuthSideEffectsGateway } from '../data/gateways/LegacyAuthSideEffectsGateway';
import { SharedAuthLocalStore } from '../data/gateways/SharedAuthLocalStore';
import { getNativeGoogleSignInErrorMessage } from '../data/providers/nativeGoogleSignIn';
import { FirebaseAuthRepository } from '../data/repositories/FirebaseAuthRepository';

const sync: SyncOrchestrator = {
  shouldSync,
  syncAll: syncToFirestore,
  forceSync,
  autoSync,
  getActiveDeviceId: getActiveDeviceIdFromFirebase,
  createUserDocument,
  fetchAndSaveUserData,
  syncNotificationSettings: syncNotificationSettingsToFirestore,
  syncAuthProfile: syncAuthProfileToFirestore,
};

export function createAuthFacade(): AuthFacade {
  const sideEffects = new LegacyAuthSideEffectsGateway();
  return new DefaultAuthFacade({
    authRepository: new FirebaseAuthRepository(),
    profileRepository: createUserProfileRepository(),
    sync,
    localStore: new SharedAuthLocalStore(),
    notifications: sideEffects,
    progress: sideEffects,
    accountDeletion: new HttpAccountDeletionClient(),
    getGoogleErrorMessage: getNativeGoogleSignInErrorMessage,
  });
}
