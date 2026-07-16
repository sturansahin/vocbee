import { canCompleteSetup } from '../domain/rules';
import type {
  SetupCompletionInput,
  SetupFacade,
  SetupPlatformGateway,
} from './setupContracts';

export class DefaultSetupFacade implements SetupFacade {
  constructor(private readonly gateway: SetupPlatformGateway) {}

  getNotificationPermissionGranted(): Promise<boolean> {
    return this.gateway.getNotificationPermissionGranted();
  }

  requestNotificationPermission(): Promise<boolean> {
    return this.gateway.requestNotificationPermission();
  }

  openSystemSettings(): Promise<void> {
    return this.gateway.openSystemSettings();
  }

  async complete(
    input: SetupCompletionInput,
    refreshNotificationSettings: () => Promise<void>
  ): Promise<void> {
    if (!canCompleteSetup(input)) {
      throw new Error('Setup cannot be completed: invalid language/level preferences.');
    }

    await this.gateway.persistCompletion(input);
    await refreshNotificationSettings();
    await this.gateway.prepareLearningContent(input);
  }
}
