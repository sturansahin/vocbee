// src/features/monetization/application/monetizationFacade.instance.ts
// Composition root for the monetization feature (docs/refactor-v2/02, /33 §4): wires the concrete
// RevenueCat/AdMob repositories into a single MonetizationFacade instance. Presentation imports this
// instance (never the concrete repositories directly), preserving the presentation -> application ->
// data import direction.

import { revenueCatRepository } from '../data/repositories/RevenueCatRepository';
import { adMobRepository } from '../data/repositories/AdMobRepository';
import { MonetizationFacade } from './MonetizationFacade';

export const monetizationFacade = new MonetizationFacade({
  revenueCatRepository,
  adMobRepository,
});
