import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { LANGUAGES, LEVELS } from '@shared/i18n';

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
import { AnimatedSwitch } from './AnimatedSwitch';
import { SettingsHelpModal } from './SettingsHelpModal';
import { SettingsNotificationModals } from './SettingsNotificationModals';
import { SettingsPreferenceModals } from './SettingsPreferenceModals';
import { SettingsProfileModals } from './SettingsProfileModals';
import { scale } from './settingsScreenConstants';
import { settingsStyles as styles } from './settingsScreenStyles';

interface SettingsScreenViewProps {
  controller: SettingsScreenController;
}

export function SettingsScreenView({ controller: c }: SettingsScreenViewProps) {
  const { colors, isDarkMode, t } = c;
  const cardStyle = { backgroundColor: colors.surface, borderColor: colors.border };
  const iconStyle = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { paddingTop: Math.max(c.insets.top, scale(12)) }]}>
        <TouchableOpacity
          onPress={() => c.navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ProfileSettingsSection
          profileName={c.profile.name}
          profileEmail={c.profile.email}
          profileImageSource={c.profileImageSource}
          hasCustomImage={Boolean(c.profile.image)}
          isDarkMode={isDarkMode}
          colors={colors}
          defaultUsernameLabel={t('settings.defaultUsername')}
          editProfileLabel={t('settings.editProfile')}
          onPressAvatar={() => c.setShowImagePickerModal(true)}
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
          onPressLanguageRow={() => c.setShowLanguagePicker(true)}
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
          onPressAutoMarkRow={() => c.setShowAutoMarkPicker(true)}
          enableRemindersLabel={t('settings.enableReminders')}
          reminderEnabled={c.reminderEnabled}
          renderSwitch={() => (
            <AnimatedSwitch
              value={c.reminderEnabled}
              onToggle={() => void c.handleReminderToggle()}
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
          onPressFrequency={() => c.setShowFrequencyPicker(true)}
        />

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.progress')}
        </Text>
        <View style={[styles.sectionCard, cardStyle]}>
          <LanguageProgressRows
            colors={colors}
            isDarkMode={isDarkMode}
            changeLevelLabel={t('settings.changeLevel')}
            currentLevelLabel={t(`level.${c.currentLevel}`)}
            currentLevelRange={LEVELS.find((level) => level.id === c.currentLevel)?.range}
            onPressChangeLevel={() => c.setShowLevelPicker(true)}
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
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.support')}
        </Text>
        <View style={[styles.sectionCard, cardStyle]}>
          <SupportRow
            icon="help"
            label={t('settings.helpFaq')}
            onPress={() => c.setShowHelpModal(true)}
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
        </View>

        <LogoutButton
          colors={colors}
          logoutLabel={t('settings.logout')}
          onPressLogout={c.handleLogout}
        />
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          VocBee v{c.facade.getAppVersion()}
        </Text>
      </ScrollView>

      <SettingsNotificationModals controller={c} />
      <SettingsPreferenceModals controller={c} />
      <SettingsProfileModals controller={c} />
      <SettingsHelpModal controller={c} />
    </SafeAreaView>
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
    <TouchableOpacity
      style={[styles.settingItem, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, iconStyle]}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
        </View>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{label}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}
