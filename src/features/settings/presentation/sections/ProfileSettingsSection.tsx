// src/features/settings/presentation/sections/ProfileSettingsSection.tsx
// Pure presentational extraction of the profile header block (avatar + name + email + edit
// button) from screens/SettingsScreen.tsx (ADIM 3, UI-only section extraction —
// docs/refactor-v2/27). VERBATIM JSX/styles — no logic. SettingsScreen still owns all profile
// state (profile, image picker modal visibility) and handlers (openEditProfileModal, image press).

import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from '../../../../../utils/typography';

export interface ProfileSettingsSectionProps {
    profileName: string;
    profileEmail: string;
    /** Resolved image source (real photo/avatar or theme-appropriate default), same as
     * getProfileImageSource(profile.image, defaultAvatarSource) in the parent screen. */
    profileImageSource: any;
    hasCustomImage: boolean;
    isDarkMode: boolean;
    colors: {
        text: string;
        textSecondary: string;
        surface: string;
        border: string;
        primary: string;
        background: string;
    };
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
    isDarkMode,
    colors,
    defaultUsernameLabel,
    editProfileLabel,
    onPressAvatar,
    onPressEditProfile,
}: ProfileSettingsSectionProps) {
    return (
        <View style={[styles.profileSection, { paddingTop: 24 }]}>
            <TouchableOpacity style={styles.avatarContainer} onPress={onPressAvatar}>
                <Image
                    source={profileImageSource}
                    style={[styles.avatar, { borderColor: hasCustomImage ? colors.surface : colors.border }]}
                />
                <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                    <MaterialIcons name="camera-alt" size={16} color={isDarkMode ? '#000' : '#fff'} />
                </View>
            </TouchableOpacity>
            <Text style={[styles.profileName, { color: colors.text }]}>{profileName || defaultUsernameLabel}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profileEmail}</Text>

            <TouchableOpacity
                style={[styles.editButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={onPressEditProfile}
            >
                <Text style={[styles.editButtonText, { color: colors.text }]}>{editProfileLabel}</Text>
            </TouchableOpacity>
        </View>
    );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const styles = StyleSheet.create({
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: scale(112),
        height: scale(112),
        borderRadius: scale(56),
        borderWidth: scale(4),
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
        fontSize: moderateScale(24),
    },
    profileEmail: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(14),
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
