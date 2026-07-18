import React from 'react';

import { LoginScreen as PresentationLoginScreen } from '../presentation/screens/LoginScreen';
import { SignUpScreen as PresentationSignUpScreen } from '../presentation/screens/SignUpScreen';
import { authPresentationGateway } from './authPresentationGateway';

export function LoginScreen() {
  return <PresentationLoginScreen />;
}

export function SignUpScreen() {
  return <PresentationSignUpScreen gateway={authPresentationGateway} />;
}
