import React from 'react';

import { SetupScreen as PresentationSetupScreen } from '../presentation/screens/SetupScreens';
import { setupFacade } from './setupFacade';

export function SetupScreen() {
  return <PresentationSetupScreen facade={setupFacade} />;
}

export const NativeLanguageScreen = SetupScreen;
