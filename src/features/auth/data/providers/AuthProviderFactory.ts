import type { AuthProviderKind, AuthSignInResult, EmailSignInRequest } from '../../domain/types';

type SignInRequest = EmailSignInRequest | undefined;

export interface AuthSignInProvider {
  signIn(request?: SignInRequest): Promise<AuthSignInResult>;
}

export interface AuthProviderFactoryDependencies {
  email(request: EmailSignInRequest): Promise<AuthSignInResult>;
  google(): Promise<AuthSignInResult>;
  apple(): Promise<AuthSignInResult>;
}

const providerFactories: Record<
  AuthProviderKind,
  (dependencies: AuthProviderFactoryDependencies) => AuthSignInProvider
> = {
  email: (dependencies) => ({
    signIn: async (request) => {
      if (!request) throw new Error('Email sign-in credentials are required.');
      return dependencies.email(request);
    },
  }),
  google: (dependencies) => ({ signIn: async () => dependencies.google() }),
  apple: (dependencies) => ({ signIn: async () => dependencies.apple() }),
};

export function createAuthSignInProvider(
  kind: AuthProviderKind,
  dependencies: AuthProviderFactoryDependencies,
): AuthSignInProvider {
  return providerFactories[kind](dependencies);
}
