import { DefaultSettingsFacade } from '../application/DefaultSettingsFacade';
import { ExpoAvatarPickerGateway } from '../data/platform/ExpoAvatarPickerGateway';
import { LegacySettingsPlatformGateway } from '../data/platform/LegacySettingsPlatformGateway';
import { LocalSettingsRepository } from '../data/repositories/SettingsRepository';

export const settingsFacade = new DefaultSettingsFacade(
  new LocalSettingsRepository(),
  new ExpoAvatarPickerGateway(),
  new LegacySettingsPlatformGateway(),
);
