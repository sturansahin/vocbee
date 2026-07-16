import React from 'react';

import { DefaultOnboardingFacade } from '../application/DefaultOnboardingFacade';
import { AsyncStorageOnboardingRepository } from '../data/AsyncStorageOnboardingRepository';
import PresentationOnboardingScreen from '../presentation/screens/OnboardingScreen';

const onboardingFacade = new DefaultOnboardingFacade(new AsyncStorageOnboardingRepository());

export default function OnboardingScreen() {
  return <PresentationOnboardingScreen facade={onboardingFacade} />;
}
