import { createUserProfileRepository } from '@features/profile';

import { DefaultSetupFacade } from '../application/DefaultSetupFacade';
import { LegacySetupPlatformGateway } from '../data/LegacySetupPlatformGateway';

export const setupFacade = new DefaultSetupFacade(
  new LegacySetupPlatformGateway(createUserProfileRepository())
);
