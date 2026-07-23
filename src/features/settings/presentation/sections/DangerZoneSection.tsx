// src/features/settings/presentation/sections/DangerZoneSection.tsx
// Pure presentational extraction of the destructive-action rows from screens/SettingsScreen.tsx
// (ADIM 3, UI-only section extraction — docs/architecture.md): "Progress > Reset Progress",
// "Progress > Delete Account", and the standalone Logout button. VERBATIM JSX/styles — no logic.
// SettingsScreen still owns the confirm-dialog flows (showAlert with destructive buttons) and the
// actual resetProgress/deleteAccount/signOut calls — these components only render the rows and
// forward onPress to the parent's handlers, which are responsible for showing the confirmation
// alert before performing any destructive action (unchanged from the original implementation).
//
// Split into two exports because the original layout renders Reset Progress / Delete Account
// INSIDE the "Progress" sectionCard, while Logout is a separate standalone button rendered after
// the Support card — there is no single shared container for all three in the original UI.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY, type ThemeColors } from '@shared/theme';

export interface DangerZoneSectionProps {
  colors: Pick<ThemeColors, 'textSecondary' | 'danger'>;
  isDarkMode: boolean;

  resetProgressLabel: string;
  resetProgressDescription: string;
  onPressResetProgress: () => void;

  deleteAccountLabel: string;
  onPressDeleteAccount: () => void;

  logoutLabel: string;
  onPressLogout: () => void;
}

/** Reset Progress + Delete Account rows — rendered by the caller INSIDE its own Progress sectionCard. */
export function ProgressDangerRows({
  colors,
  isDarkMode,
  resetProgressLabel,
  resetProgressDescription,
  onPressResetProgress,
  deleteAccountLabel,
  onPressDeleteAccount,
}: Pick<
  DangerZoneSectionProps,
  | 'colors'
  | 'isDarkMode'
  | 'resetProgressLabel'
  | 'resetProgressDescription'
  | 'onPressResetProgress'
  | 'deleteAccountLabel'
  | 'onPressDeleteAccount'
>) {
  const settingIconStyle = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.settingItem}
        onPress={onPressResetProgress}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, settingIconStyle]}>
            <MaterialIcons name="refresh" size={24} color={colors.danger} />
          </View>
          <View>
            <Text style={[styles.settingTitle, { color: colors.danger }]}>
              {resetProgressLabel}
            </Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {resetProgressDescription}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.settingItem, { borderBottomWidth: 0 }]}
        onPress={onPressDeleteAccount}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, settingIconStyle]}>
            <MaterialIcons name="delete-outline" size={24} color={colors.danger} />
          </View>
          <View>
            <Text style={[styles.settingTitle, { color: colors.danger }]}>
              {deleteAccountLabel}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </>
  );
}

/** Standalone Logout button — rendered by the caller below the Support card (outside any sectionCard). */
export function LogoutButton({
  colors,
  logoutLabel,
  onPressLogout,
}: Pick<DangerZoneSectionProps, 'colors' | 'logoutLabel' | 'onPressLogout'>) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={styles.logoutButton}
      onPress={onPressLogout}
    >
      <MaterialIcons name="logout" size={20} color={colors.danger} />
      <Text style={[styles.logoutButtonText, { color: colors.danger }]}>{logoutLabel}</Text>
    </TouchableOpacity>
  );
}

/**
 * Convenience composition of both pieces for callers that want the full "danger zone" (reset +
 * delete + logout) in one import. SettingsScreen renders `ProgressDangerRows` and `LogoutButton`
 * separately to preserve the exact original layout (see module doc comment above); this default
 * export exists for completeness / future callers that don't need the split.
 */
export function DangerZoneSection(props: DangerZoneSectionProps) {
  return (
    <>
      <ProgressDangerRows {...props} />
      <LogoutButton {...props} />
    </>
  );
}

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    padding: 12,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DangerZoneSection;
