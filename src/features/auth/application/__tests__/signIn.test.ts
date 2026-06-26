// Fake-repository use-case test (Firebase-free, docs/refactor-v2/37 §3).
import { makeSignIn } from '../useCases/signIn';
import type { AuthRepository } from '../../data/contracts';
import type { AuthUser } from '../../domain/types';

function makeFakeAuthRepo(overrides: Partial<AuthRepository> = {}): AuthRepository {
  const user: AuthUser = { uid: 'u1', email: 'a@b.com', displayName: 'A', photoURL: null };
  return {
    getCurrentUser: () => user,
    onAuthStateChanged: () => () => undefined,
    signUpWithEmail: jest.fn(async () => user),
    signInWithEmail: jest.fn(async () => user),
    signInWithGoogle: jest.fn(async () => user),
    signInWithApple: jest.fn(async () => user),
    signOut: jest.fn(async () => undefined),
    sendPasswordReset: jest.fn(async () => undefined),
    deleteAuthUser: jest.fn(async () => undefined),
    getLastSignInTimeMs: () => Date.now(),
    ...overrides,
  };
}

describe('makeSignIn use-case', () => {
  it('delegates to AuthRepository.signInWithEmail and returns the user (no Firebase)', async () => {
    const repo = makeFakeAuthRepo();
    const signIn = makeSignIn(repo);
    const user = await signIn('a@b.com', 'pw');
    expect(repo.signInWithEmail).toHaveBeenCalledWith('a@b.com', 'pw');
    expect(user).toMatchObject({ uid: 'u1', email: 'a@b.com' });
  });

  it('propagates repository errors', async () => {
    const repo = makeFakeAuthRepo({
      signInWithEmail: jest.fn(async () => {
        throw new Error('auth/wrong-password');
      }),
    });
    await expect(makeSignIn(repo)('a@b.com', 'bad')).rejects.toThrow('auth/wrong-password');
  });
});
