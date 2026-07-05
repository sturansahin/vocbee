// src/features/settings/presentation/sections/SyncSettingsSection.tsx
// PLACEHOLDER (ADIM 3, docs/refactor-v2/27 target structure). The current screens/SettingsScreen.tsx
// has NO visible "sync status" row — `forceSync(user?.uid)` is only called as a side-effect inside
// the "Change Language" and "Reset Progress" destructive confirm handlers (see DangerZoneSection /
// LanguageSettingsSection), never rendered as its own settings UI element.
//
// Per ADIM 3 rules ("Settings behavior değiştirme", "sadece UI section extraction yap" — no new
// features), this component intentionally renders nothing today: fabricating a visible sync-status
// row would be a NEW feature, not an extraction of existing UI. This file exists only to match the
// requested target folder structure (`src/features/settings/presentation/sections/`) so that a
// future, separately-approved task can implement real sync-status UI (e.g. surfacing
// `syncMeta.updatedAt` from Firestore) without needing to create the file for the first time.
//
// No SDK/service import here — this file has zero side effects and is safe to import even though
// it renders null.

export function SyncSettingsSection(): null {
    return null;
}

export default SyncSettingsSection;
