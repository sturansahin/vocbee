// Cache-first profile load test with a fake UserProfileRepository (docs/refactor-v2/35 §2.6, /37 §3).
import { makeLoadProfile } from '../useCases/loadProfile';
import type { UserProfileRepository } from '../../data/contracts';
import type { Profile } from '../../domain/types';

function makeFakeProfileRepo(overrides: Partial<UserProfileRepository> = {}): UserProfileRepository {
  return {
    getCachedProfile: jest.fn(async () => null),
    cacheProfile: jest.fn(async () => undefined),
    fetchProfileFromRemote: jest.fn(async () => null),
    saveProfile: jest.fn(async () => undefined),
    createUserDocument: jest.fn(async () => undefined),
    deleteUserDocument: jest.fn(async () => undefined),
    ...overrides,
  };
}

const remoteProfile: Profile = { name: 'Remote', image: null, email: 'r@b.com' };
const cachedProfile: Profile = { name: 'Cached', image: null, email: 'c@b.com' };

describe('makeLoadProfile (cache-first)', () => {
  it('returns cached profile WITHOUT hitting remote', async () => {
    const repo = makeFakeProfileRepo({ getCachedProfile: jest.fn(async () => cachedProfile) });
    const result = await makeLoadProfile(repo)('u1');
    expect(result).toEqual(cachedProfile);
    expect(repo.fetchProfileFromRemote).not.toHaveBeenCalled();
  });

  it('falls back to remote and caches it when no cache', async () => {
    const repo = makeFakeProfileRepo({ fetchProfileFromRemote: jest.fn(async () => remoteProfile) });
    const result = await makeLoadProfile(repo)('u1');
    expect(result).toEqual(remoteProfile);
    expect(repo.getCachedProfile).toHaveBeenCalledWith('u1');
    expect(repo.fetchProfileFromRemote).toHaveBeenCalledWith('u1');
    expect(repo.cacheProfile).toHaveBeenCalledWith('u1', remoteProfile);
  });

  it('returns null when neither cache nor remote has data', async () => {
    const repo = makeFakeProfileRepo();
    expect(await makeLoadProfile(repo)('u1')).toBeNull();
    expect(repo.cacheProfile).not.toHaveBeenCalled();
  });
});
