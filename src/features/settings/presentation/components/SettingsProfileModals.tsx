import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppButton, AppInput, AppModal } from '@shared/ui';
import type { SettingsScreenController } from '../hooks/useSettingsScreenController';
import { AVATAR_COLUMNS, PROFILE_AVATAR_ROWS } from './settingsScreenConstants';
import { settingsStyles as styles } from './settingsScreenStyles';

interface SettingsProfileModalsProps {
  controller: SettingsScreenController;
}

export function SettingsProfileModals({ controller: c }: SettingsProfileModalsProps) {
  const { colors, t } = c;

  return (
    <>
      <AppModal
        visible={c.modal === 'image-picker'}
        title={t('settings.changePhotoTitle')}
        onRequestClose={c.closeModal}
        contentStyle={styles.imagePickerModalContent}
      >
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
            onPress={() => c.openModal('avatar-picker')}
            controller={c}
          />
          {c.profile.image ? (
            <ImagePickerOption
              icon="delete"
              label={t('settings.removePhoto')}
              onPress={() => void c.removeProfileImage()}
              controller={c}
              destructive
              last
            />
          ) : null}
        </ScrollView>
        <AppButton label={t('common.cancel')} onPress={c.closeModal} variant="secondary" />
      </AppModal>

      <AppModal
        visible={c.modal === 'avatar-picker'}
        title={t('settings.selectAvatar')}
        onRequestClose={c.closeModal}
        contentStyle={styles.avatarPickerModalContent}
      >
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
                    {selected ? (
                      <MaterialIcons
                        name="check-circle"
                        size={24}
                        color={colors.accent}
                        style={styles.avatarSelectedIcon}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        <AppButton label={t('common.cancel')} onPress={c.closeModal} variant="secondary" />
      </AppModal>

      <AppModal
        visible={c.modal === 'edit-profile'}
        title={t('settings.editProfileTitle')}
        onRequestClose={c.closeModal}
      >
        <AppInput
          label={t('settings.nameLabel')}
          value={c.tempName}
          onChangeText={c.setTempName}
          placeholder={t('settings.namePlaceholder')}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="done"
          onSubmitEditing={() => void c.saveProfile()}
        />
        <View style={localStyles.actions}>
          <AppButton
            fullWidth={false}
            label={t('common.cancel')}
            onPress={c.closeModal}
            variant="secondary"
            style={localStyles.action}
          />
          <AppButton
            disabled={c.tempName === c.profile.name}
            fullWidth={false}
            label={t('common.save')}
            onPress={() => c.saveProfile()}
            style={localStyles.action}
          />
        </View>
      </AppModal>
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
  const color = destructive ? c.colors.danger : c.colors.accent;
  const backgroundColor = destructive ? c.colors.dangerSoft : c.colors.surfaceMuted;

  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      style={[
        styles.imagePickerOption,
        { borderBottomColor: c.colors.borderDefault },
        last && localStyles.last,
      ]}
      onPress={onPress}
    >
      <View style={[styles.imagePickerIcon, { backgroundColor }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text
        style={[
          styles.imagePickerOptionText,
          { color: destructive ? c.colors.danger : c.colors.textPrimary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const localStyles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  action: {
    flex: 1,
  },
  last: {
    borderBottomWidth: 0,
  },
});
