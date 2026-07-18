// src/features/profile/application/useCases/loadProfile.ts
// Layer: application | Feature: profile. Depends only on UserProfileRepository (DIP).
// Cache-first: return cached profile (profile_${uid}) if present, else fetch remote and cache it —
// mirrors the cache-first strategy in context/AuthContext.tsx (docs/refactor-v2/03 §3, /10).

import type { UserProfileRepository } from '../../data/contracts';
import type { Profile } from '../../domain/types';

export function makeLoadProfile(repo: UserProfileRepository) {
  return async function loadProfile(uid: string): Promise<Profile | null> {
    const cached = await repo.getCachedProfile(uid);
    if (cached) return cached;
    const remote = await repo.fetchProfileFromRemote(uid);
    if (remote) await repo.cacheProfile(uid, remote);
    return remote;
  };
}
