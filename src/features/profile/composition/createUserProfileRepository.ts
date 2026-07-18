import type { UserProfileRepository } from '../data/contracts';

/** Feature-owned composition factory: consumers receive only the repository contract. */
export const createUserProfileRepository = (): UserProfileRepository => {
  // Keep the SDK-heavy implementation out of consumers that only import profile domain rules.
  // The require executes only at the application composition boundary.
  const { FirestoreUserProfileRepository } =
    require('../data/repositories/FirestoreUserProfileRepository') as typeof import('../data/repositories/FirestoreUserProfileRepository');
  return new FirestoreUserProfileRepository();
};
