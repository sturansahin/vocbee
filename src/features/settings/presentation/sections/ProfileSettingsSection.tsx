// src/features/settings/presentation/sections/ProfileSettingsSection.tsx
// Pure presentational extraction of the profile header block (avatar + name + email + edit
// button) from screens/SettingsScreen.tsx (ADIM 3, UI-only section extraction —
// docs/architecture.md). VERBATIM JSX/styles — no logic. SettingsScreen still owns all profile
// state (profile, image picker modal visibility) and handlers (openEditProfileModal, image press).

import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY, type ThemeColors } from '@shared/theme';

export interface ProfileSettingsSectionProps {
  profileName: string;
  profileEmail: string;
  /** Resolved image source (real photo/avatar or theme-appropriate default), same as
   * getProfileImageSource(profile.image, defaultAvatarSource) in the parent screen. */
  profileImageSource: any;
  hasCustomImage: boolean;
  isDarkMode: boolean;
  colors: Pick<
    ThemeColors,
    | 'textPrimary'
    | 'textSecondary'
    | 'surface'
    | 'borderDefault'
    | 'accent'
    | 'background'
    | 'onAccent'
  >;
  defaultUsernameLabel: string;
  editProfileLabel: string;
  onPressAvatar: () => void;
  onPressEditProfile: () => void;
}

export function ProfileSettingsSection({
  profileName,
  profileEmail,
  profileImageSource,
  hasCustomImage,
  colors,
  defaultUsernameLabel,
  editProfileLabel,
  onPressAvatar,
  onPressEditProfile,
}: ProfileSettingsSectionProps) {
  return (
    <View style={[styles.profileSection, { paddingTop: 16 }]}>
      <TouchableOpacity
        accessibilityLabel={editProfileLabel}
        accessibilityRole="button"
        style={styles.avatarContainer}
        onPress={onPressAvatar}
      >
        <Image
          source={profileImageSource}
          style={[
            styles.avatar,
            {
              borderColor: hasCustomImage ? colors.surface : colors.borderDefault,
            },
          ]}
        />
        <View
          style={[
            styles.editBadge,
            { backgroundColor: colors.accent, borderColor: colors.background },
          ]}
        >
          <MaterialIcons name="camera-alt" size={16} color={colors.onAccent} />
        </View>
      </TouchableOpacity>
      <Text style={[styles.profileName, { color: colors.textPrimary }]}>
        {profileName || defaultUsernameLabel}
      </Text>
      <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profileEmail}</Text>

      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.editButton,
          {
            borderColor: colors.borderDefault,
            backgroundColor: colors.surface,
          },
        ]}
        onPress={onPressEditProfile}
      >
        <Text style={[styles.editButtonText, { color: colors.textPrimary }]}>
          {editProfileLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 6,
    borderRadius: 12,
    borderWidth: 4,
  },
  profileName: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    lineHeight: 30,
  },
  profileEmail: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProfileSettingsSection;
