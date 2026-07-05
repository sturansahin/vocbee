// src/features/settings/presentation/sections/index.ts
// Barrel for SettingsScreen's extracted pure UI sections (ADIM 3 — docs/refactor-v2/27 UI-only
// extraction). No business logic; every section here is presentational and receives all data via
// typed props from screens/SettingsScreen.tsx.

export { ProfileSettingsSection } from './ProfileSettingsSection';
export type { ProfileSettingsSectionProps } from './ProfileSettingsSection';

export { PremiumSettingsSection } from './PremiumSettingsSection';
export type { PremiumSettingsSectionProps, PremiumActionKind } from './PremiumSettingsSection';

export { LanguageSettingsSection, LanguageProgressRows } from './LanguageSettingsSection';
export type { LanguageSettingsSectionProps } from './LanguageSettingsSection';

export { NotificationSettingsSection } from './NotificationSettingsSection';
export type { NotificationSettingsSectionProps } from './NotificationSettingsSection';

export { DangerZoneSection, ProgressDangerRows, LogoutButton } from './DangerZoneSection';
export type { DangerZoneSectionProps } from './DangerZoneSection';

export { SyncSettingsSection } from './SyncSettingsSection';
