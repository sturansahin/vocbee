import { createAuthSignInProvider } from '../AuthProviderFactory';

const user = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'User',
  photoURL: null,
};

describe('createAuthSignInProvider', () => {
  it.each(['email', 'google', 'apple'] as const)(
    'selects the %s provider adapter',
    async (kind) => {
      const dependencies = {
        email: jest.fn(async () => ({ user })),
        google: jest.fn(async () => ({ user })),
        apple: jest.fn(async () => ({ user })),
      };
      const provider = createAuthSignInProvider(kind, dependencies);

      await provider.signIn(
        kind === 'email' ? { email: 'user@example.com', password: 'secret' } : undefined,
      );

      expect(dependencies[kind]).toHaveBeenCalledTimes(1);
    },
  );
});
