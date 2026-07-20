import { useState } from 'react';
import type { TFunction } from 'i18next';
import type { Profile } from '@features/profile';
import { useAlert } from '@shared/ui';
import type { ProfileAvatarOption } from '@shared/utils';
import type { AvatarSource, SettingsFacade } from '../../application/contracts';
import type { SettingsModal } from './useSettingsModalState';

interface ProfileControllerOptions {
  facade: SettingsFacade;
  profile: Profile;
  updateProfileData(patch: Partial<Profile>): Promise<void>;
  showAlert: ReturnType<typeof useAlert>['showAlert'];
  t: TFunction;
  openModal(modal: Exclude<SettingsModal, null>): void;
  closeModal(): void;
}

export function useProfileSettingsController({
  facade,
  profile,
  updateProfileData,
  showAlert,
  t,
  openModal,
  closeModal,
}: ProfileControllerOptions) {
  const [tempName, setTempName] = useState('');

  const pickProfileImage = async (source: AvatarSource) => {
    const result = await facade.pickAndUpdateAvatar(source, updateProfileData);
    if (result.status === 'selected') {
      closeModal();
    } else if (result.status === 'permission-denied') {
      showAlert({
        title: t('settings.permissionRequired'),
        message:
          source === 'camera'
            ? t('settings.grantCameraAccess')
            : t('settings.grantPhotoLibraryAccess'),
      });
    } else if (result.status === 'error') {
      console.error('Error selecting profile image:', result.error);
      showAlert({ title: t('common.error'), message: t('settings.profileSaveFailed') });
    }
  };

  const removeProfileImage = async () => {
    await updateProfileData({ image: null });
    closeModal();
  };

  const selectAvatar = async (avatar: ProfileAvatarOption) => {
    await updateProfileData({ image: avatar.value });
    closeModal();
  };

  const openEditProfile = () => {
    setTempName(profile.name);
    openModal('edit-profile');
  };

  const saveProfile = async () => {
    try {
      const result = await facade.updateProfileName(tempName, updateProfileData);
      if (result === 'empty' || result === 'too-short') {
        showAlert({
          title: t('settings.invalidName'),
          message: t(result === 'empty' ? 'settings.nameEmpty' : 'settings.nameTooShort'),
        });
        return;
      }
      closeModal();
      showAlert({ title: t('common.success'), message: t('settings.profileUpdated') });
    } catch (error) {
      console.error('Error saving profile:', error);
      showAlert({ title: t('common.error'), message: t('settings.profileSaveFailed') });
    }
  };

  return {
    tempName,
    setTempName,
    pickProfileImage,
    removeProfileImage,
    selectAvatar,
    openEditProfile,
    saveProfile,
  };
}
