// src/features/auth — public barrel (docs/refactor-v2/33 §4).
// Exposes domain types/rules, repository INTERFACE, and use-cases.
// Does NOT export FirebaseAuthRepository (data impl) — bound only at a composition root.

export * from './domain/types';
export * from './domain/rules';
export type { AuthRepository } from './data/contracts';
export { makeSignIn } from './application/useCases/signIn';
export type { AuthFacade, AuthStatePayload, AuthActionResult } from './application/contracts';
export { DefaultAuthFacade } from './application/AuthFacade';
export { AuthProvider } from './composition/AuthProvider';
export { LoginScreen, SignUpScreen } from './composition/AuthScreens';
export { AuthStateProvider, useAuth } from './presentation/AuthProvider';
export { default as ForgotPasswordScreen } from './presentation/screens/ForgotPasswordScreen';
export type { AuthContextType, AuthStateProviderProps } from './presentation/AuthProvider';
