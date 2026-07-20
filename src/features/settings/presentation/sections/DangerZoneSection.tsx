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
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from '@shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export interface DangerZoneSectionProps {
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    border: string;
    error: string;
  };
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
      <TouchableOpacity style={styles.settingItem} onPress={onPressResetProgress}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, settingIconStyle]}>
            <MaterialIcons name="refresh" size={24} color={colors.error} />
          </View>
          <View>
            <Text style={[styles.settingTitle, { color: colors.error }]}>{resetProgressLabel}</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {resetProgressDescription}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomWidth: 0 }]}
        onPress={onPressDeleteAccount}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, settingIconStyle]}>
            <MaterialIcons name="delete-outline" size={24} color={colors.error} />
          </View>
          <View>
            <Text style={[styles.settingTitle, { color: colors.error }]}>{deleteAccountLabel}</Text>
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
    <TouchableOpacity style={styles.logoutButton} onPress={onPressLogout}>
      <MaterialIcons name="logout" size={20} color={colors.error} />
      <Text style={[styles.logoutButtonText, { color: colors.error }]}>{logoutLabel}</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  settingSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 24,
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
