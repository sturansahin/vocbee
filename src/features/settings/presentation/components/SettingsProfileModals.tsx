import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { SettingsScreenController } from '../hooks/useSettingsScreenController';
import { AVATAR_COLUMNS, PROFILE_AVATAR_ROWS } from './settingsScreenConstants';
import { settingsStyles as styles } from './settingsScreenStyles';

interface SettingsProfileModalsProps {
  controller: SettingsScreenController;
}

export function SettingsProfileModals({ controller: c }: SettingsProfileModalsProps) {
  const { colors, isDarkMode, t } = c;
  const modalStyle = { backgroundColor: colors.surface, borderColor: colors.border };
  const neutralBackground = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  return (
    <>
      <Modal
        visible={c.showImagePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => c.setShowImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => c.setShowImagePickerModal(false)}
          />
          <View
            style={[styles.modalContent, styles.imagePickerModalContent, modalStyle]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.changePhotoTitle')}
            </Text>
            <ScrollView
              style={styles.imagePickerScroll}
              contentContainerStyle={styles.imagePickerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <ImagePickerOption
                icon="camera-alt"
                label={t('settings.takePhoto')}
                onPress={() => void c.pickProfileImage('camera')}
                controller={c}
              />
              <ImagePickerOption
                icon="photo-library"
                label={t('settings.chooseFromGallery')}
                onPress={() => void c.pickProfileImage('gallery')}
                controller={c}
              />
              <ImagePickerOption
                icon="face"
                label={t('settings.selectAvatar')}
                onPress={() => {
                  c.setShowImagePickerModal(false);
                  c.setShowAvatarPickerModal(true);
                }}
                controller={c}
              />
              {c.profile.image && (
                <ImagePickerOption
                  icon="delete"
                  label={t('settings.removePhoto')}
                  onPress={() => void c.removeProfileImage()}
                  controller={c}
                  destructive
                  last
                />
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: neutralBackground }]}
              onPress={() => c.setShowImagePickerModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={c.showAvatarPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => c.setShowAvatarPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => c.setShowAvatarPickerModal(false)}
          />
          <View
            style={[styles.modalContent, styles.avatarPickerModalContent, modalStyle]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectAvatar')}
            </Text>
            <View style={styles.avatarGrid}>
              {PROFILE_AVATAR_ROWS.map((row, rowIndex) => (
                <View key={`avatar-row-${rowIndex}`} style={styles.avatarGridRow}>
                  {row.map((avatar, avatarIndex) => {
                    const selected = c.profile.image === avatar.value;
                    const optionNumber = rowIndex * AVATAR_COLUMNS + avatarIndex + 1;
                    return (
                      <TouchableOpacity
                        key={avatar.id}
                        style={styles.avatarBareOption}
                        onPress={() => void c.selectAvatar(avatar)}
                        activeOpacity={0.72}
                        accessibilityRole="button"
                        accessibilityLabel={t('settings.avatarOptionAccessibility', {
                          number: optionNumber,
                          defaultValue: `Avatar ${optionNumber}`,
                        })}
                        accessibilityState={{ selected }}
                      >
                        <Image source={avatar.source} style={styles.avatarBareImage} />
                        {selected && (
                          <MaterialIcons
                            name="check-circle"
                            size={24}
                            color={colors.primary}
                            style={styles.avatarSelectedIcon}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: neutralBackground }]}
              onPress={() => c.setShowAvatarPickerModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={c.showEditProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => c.setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => c.setShowEditProfileModal(false)}
          />
          <View
            style={[styles.modalContent, modalStyle, { width: '90%' }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.editProfileTitle')}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('settings.nameLabel')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: neutralBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={c.tempName}
                onChangeText={c.setTempName}
                placeholder={t('settings.namePlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: neutralBackground }]}
                onPress={() => c.setShowEditProfileModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                  c.tempName === c.profile.name && { opacity: 0.5 },
                ]}
                onPress={() => void c.saveProfile()}
                disabled={c.tempName === c.profile.name}
              >
                <Text style={[styles.modalButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

interface ImagePickerOptionProps {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  controller: SettingsScreenController;
  destructive?: boolean;
  last?: boolean;
}

function ImagePickerOption({
  icon,
  label,
  onPress,
  controller: c,
  destructive = false,
  last = false,
}: ImagePickerOptionProps) {
  const color = destructive ? c.colors.error : c.colors.primary;
  const backgroundColor = destructive
    ? 'rgba(255,59,48,0.1)'
    : c.isDarkMode
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(0,0,0,0.05)';
  return (
    <TouchableOpacity
      style={[
        styles.imagePickerOption,
        { borderBottomColor: c.colors.border },
        last && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.imagePickerIcon, { backgroundColor }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text
        style={[
          styles.imagePickerOptionText,
          { color: destructive ? c.colors.error : c.colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
