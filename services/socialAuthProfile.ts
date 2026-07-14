// Phase 9 removal target: compatibility-only re-export.
export {
  buildStoredProfileFromAuth,
  buildStoredProfileFromFirestore,
} from '@features/profile';
export type {
  AuthProfileInput,
  FirestoreProfileInput,
  StoredProfile,
  StoredProfileLike,
} from '@features/profile';
