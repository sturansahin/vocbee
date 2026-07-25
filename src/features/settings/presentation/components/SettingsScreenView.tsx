import React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { LANGUAGES, LEVELS } from '@shared/i18n';
import { useResponsiveLayout } from '@shared/responsive';
import { AppHeader, AppSwitch, AppText, Screen, SectionCard, SettingsRow } from '@shared/ui';

import type { SettingsScreenController } from '../hooks/useSettingsScreenController';
import {
  LanguageProgressRows,
  LanguageSettingsSection,
  LogoutButton,
  NotificationSettingsSection,
  PremiumSettingsSection,
  ProfileSettingsSection,
  ProgressDangerRows,
} from '../sections';
import { SettingsHelpModal } from './SettingsHelpModal';
import { SettingsNotificationModals } from './SettingsNotificationModals';
import { SettingsPreferenceModals } from './SettingsPreferenceModals';
import { SettingsProfileModals } from './SettingsProfileModals';
import { settingsStyles as styles } from './settingsScreenStyles';

interface SettingsScreenViewProps {
  controller: SettingsScreenController;
}

export function SettingsScreenView({ controller: c }: SettingsScreenViewProps) {
  const { colors, isDarkMode, t } = c;
  const { contentMaxWidth, horizontalGutter } = useResponsiveLayout();
  const iconStyle = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  return (
    <Screen constrainWidth={false} contentStyle={styles.container}>
      <AppHeader
        title={t('settings.title')}
        backAccessibilityLabel={t('common.back')}
        onBack={() => c.navigation.goBack()}
        style={{
          width: '100%',
          maxWidth: contentMaxWidth,
          paddingHorizontal: horizontalGutter,
          alignSelf: 'center',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            width: '100%',
            maxWidth: contentMaxWidth,
            paddingHorizontal: horizontalGutter,
            alignSelf: 'center',
          },
        ]}
      >
        <ProfileSettingsSection
          profileName={c.profile.name}
          profileEmail={c.profile.email}
          profileImageSource={c.profileImageSource}
          hasCustomImage={Boolean(c.profile.image)}
          isDarkMode={isDarkMode}
          colors={colors}
          defaultUsernameLabel={t('settings.defaultUsername')}
          editProfileLabel={t('settings.editProfile')}
          onPressAvatar={() => c.openModal('image-picker')}
          onPressEditProfile={c.openEditProfile}
        />

        <PremiumSettingsSection
          isAdFree={c.isAdFree}
          isPremiumLoading={c.isPremiumLoading}
          premiumAction={c.premiumAction}
          adFreeStatusText={c.adFreeStatusText}
          colors={colors}
          isDarkMode={isDarkMode}
          sectionTitle={t('settings.premium')}
          removeAdsActiveLabel={t('settings.adFreeActive')}
          removeAdsLabel={t('settings.removeAds')}
          removeAdsDescription={t('settings.removeAdsDesc')}
          restorePurchasesLabel={t('settings.restorePurchases')}
          restorePurchasesDescription={t('settings.restorePurchasesDesc')}
          manageSubscriptionLabel={t('settings.manageSubscription')}
          manageSubscriptionDescription={t('settings.manageSubscriptionDesc')}
          onPressRemoveAds={c.handleRemoveAds}
          onPressRestorePurchases={c.handleRestorePurchases}
          onPressManageSubscription={c.handleManageSubscription}
        />

        <LanguageSettingsSection
          colors={colors}
          isDarkMode={isDarkMode}
          preferencesSectionTitle={t('settings.preferences')}
          languageRowLabel={t('settings.language')}
          isSystemLanguage={c.isSystemLanguage}
          systemDefaultLabel={t('settings.systemDefault')}
          selectedLanguageFlagIcon={
            LANGUAGES.find((language) => language.code === c.selectedLanguage)?.flagIcon
          }
          selectedLanguageName={
            LANGUAGES.find((language) => language.code === c.selectedLanguage)?.name
          }
          onPressLanguageRow={() => {
            if (Platform.OS === 'ios') {
              void c.facade.openSystemSettings();
              return;
            }
            c.openModal('language');
          }}
        />

        <NotificationSettingsSection
          colors={colors}
          isDarkMode={isDarkMode}
          preferencesSectionTitle={t('settings.preferences')}
          dailyReminderSectionTitle={t('settings.dailyReminder')}
          notificationActionLabel={t('settings.notificationAction')}
          autoMarkLearned={c.autoMarkLearned}
          markAsLearnedLabel={t('settings.markasLearned')}
          doNotMarkLabel={t('settings.doNotMark')}
          onPressAutoMarkRow={() => c.openModal('auto-mark')}
          enableRemindersLabel={t('settings.enableReminders')}
          reminderEnabled={c.reminderEnabled}
          renderSwitch={() => (
            <AppSwitch
              accessibilityLabel={t('settings.enableReminders')}
              value={c.reminderEnabled}
              onValueChange={() => void c.handleReminderToggle()}
            />
          )}
          startTimeLabel={t('settings.startTime')}
          startHour={c.startHour}
          startMinute={c.startMinute}
          onPressStartTime={() => c.openTimePicker('start')}
          endTimeLabel={t('settings.endTime')}
          endHour={c.endHour}
          endMinute={c.endMinute}
          onPressEndTime={() => c.openTimePicker('end')}
          frequencyLabel={t('settings.frequency')}
          frequencyValueLabel={t(`settings.${c.frequency}`)}
          onPressFrequency={() => c.openModal('frequency')}
        />

        <SectionCard
          title={t('settings.progress')}
          titleVariant="bodyStrong"
          style={styles.sectionSpacing}
        >
          <LanguageProgressRows
            colors={colors}
            isDarkMode={isDarkMode}
            changeLevelLabel={t('settings.changeLevel')}
            currentLevelLabel={t(`level.${c.currentLevel}`)}
            currentLevelRange={LEVELS.find((level) => level.id === c.currentLevel)?.range}
            onPressChangeLevel={() => c.openModal('level')}
            changeLanguageLabel={t('settings.changeLanguage')}
            changeLanguageDescription={t('settings.changeLanguageDesc')}
            onPressChangeLanguage={c.handleChangeLanguage}
          />
          <ProgressDangerRows
            colors={colors}
            isDarkMode={isDarkMode}
            resetProgressLabel={t('settings.resetProgress')}
            resetProgressDescription={t('settings.resetProgressDesc')}
            onPressResetProgress={c.handleResetProgress}
            deleteAccountLabel={t('settings.deleteAccount')}
            onPressDeleteAccount={c.handleDeleteAccount}
          />
        </SectionCard>

        <SectionCard
          title={t('settings.support')}
          titleVariant="bodyStrong"
          style={styles.sectionSpacing}
        >
          <SupportRow
            icon="help"
            label={t('settings.helpFaq')}
            onPress={() => c.openModal('help')}
            controller={c}
            iconStyle={iconStyle}
          />
          <SupportRow
            icon="star-outline"
            label={t('settings.rateVocBee', { defaultValue: 'Rate VocBee' })}
            onPress={() => void c.handleRateVocBee()}
            controller={c}
            iconStyle={iconStyle}
          />
          <SupportRow
            icon="security"
            label={t('settings.privacyPolicy')}
            onPress={() => void c.facade.openPrivacyPolicy()}
            controller={c}
            iconStyle={iconStyle}
            last
          />
        </SectionCard>

        <LogoutButton
          colors={colors}
          logoutLabel={t('settings.logout')}
          onPressLogout={c.handleLogout}
        />
        <AppText align="center" color="textSecondary" variant="caption" style={styles.versionText}>
          VocBee v{c.facade.getAppVersion()}
        </AppText>
      </ScrollView>

      <SettingsNotificationModals controller={c} />
      <SettingsPreferenceModals controller={c} />
      <SettingsProfileModals controller={c} />
      <SettingsHelpModal controller={c} />
    </Screen>
  );
}

interface SupportRowProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  controller: SettingsScreenController;
  iconStyle: { backgroundColor: string };
  last?: boolean;
}

function SupportRow({
  icon,
  label,
  onPress,
  controller: { colors },
  iconStyle,
  last = false,
}: SupportRowProps) {
  return (
    <SettingsRow
      label={label}
      leading={
        <View style={[styles.settingIcon, iconStyle]}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.accent} />
        </View>
      }
      onPress={onPress}
      showChevron
      style={last ? { borderBottomWidth: 0 } : undefined}
    />
  );
}
