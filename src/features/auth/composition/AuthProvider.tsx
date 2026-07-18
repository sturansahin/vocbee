import React, { type ReactNode } from 'react';

import { AuthStateProvider } from '../presentation/AuthProvider';
import { createAuthFacade } from './createAuthFacade';

const authFacade = createAuthFacade();

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthStateProvider facade={authFacade}>{children}</AuthStateProvider>;
}
