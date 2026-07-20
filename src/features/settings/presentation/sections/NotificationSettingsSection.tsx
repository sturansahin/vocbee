// src/features/settings/presentation/sections/NotificationSettingsSection.tsx
// Pure presentational extraction of the notification-related settings rows from
// screens/SettingsScreen.tsx (ADIM 3, UI-only section extraction — docs/architecture.md): the
// "Preferences > Notification action" (auto-mark) row and the full "Daily Reminder" card
// (enable switch + start/end time rows + frequency row). VERBATIM JSX/styles — no logic.
// SettingsScreen still owns all notification state (reminderEnabled, autoMarkLearned, startHour,
// etc.) and handlers (handleReminderToggle, picker-open callbacks) — this component only renders
// them and forwards taps. AnimatedSwitch is passed in as a prop component to avoid duplicating its
// (stateful but purely visual) animation implementation.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY, type ThemeColors } from '@shared/theme';

export interface NotificationSettingsSectionProps {
  colors: Pick<
    ThemeColors,
    'textPrimary' | 'textSecondary' | 'surface' | 'borderDefault' | 'accent'
  >;
  isDarkMode: boolean;
  preferencesSectionTitle: string;
  dailyReminderSectionTitle: string;

  notificationActionLabel: string;
  autoMarkLearned: boolean;
  markAsLearnedLabel: string;
  doNotMarkLabel: string;
  onPressAutoMarkRow: () => void;

  enableRemindersLabel: string;
  reminderEnabled: boolean;
  /** AnimatedSwitch component instance, rendered as-is (owns its own animation state). */
  renderSwitch: () => React.ReactNode;

  startTimeLabel: string;
  startHour: string;
  startMinute: string;
  onPressStartTime: () => void;

  endTimeLabel: string;
  endHour: string;
  endMinute: string;
  onPressEndTime: () => void;

  frequencyLabel: string;
  frequencyValueLabel: string;
  onPressFrequency: () => void;
}

export function NotificationSettingsSection({
  colors,
  isDarkMode,
  preferencesSectionTitle,
  dailyReminderSectionTitle,
  notificationActionLabel,
  autoMarkLearned,
  markAsLearnedLabel,
  doNotMarkLabel,
  onPressAutoMarkRow,
  enableRemindersLabel,
  reminderEnabled,
  renderSwitch,
  startTimeLabel,
  startHour,
  startMinute,
  onPressStartTime,
  endTimeLabel,
  endHour,
  endMinute,
  onPressEndTime,
  frequencyLabel,
  frequencyValueLabel,
  onPressFrequency,
}: NotificationSettingsSectionProps) {
  const settingIconStyle = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  return (
    <>
      {/* Preferences > Notification action (auto-mark) row */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {preferencesSectionTitle}
      </Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.borderDefault },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.settingItem, { borderBottomWidth: 0 }]}
          onPress={onPressAutoMarkRow}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, settingIconStyle]}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                {notificationActionLabel}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                {autoMarkLearned ? markAsLearnedLabel : doNotMarkLabel}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Daily Reminder card */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {dailyReminderSectionTitle}
      </Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.borderDefault },
        ]}
      >
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, settingIconStyle]}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
              {enableRemindersLabel}
            </Text>
          </View>
          {renderSwitch()}
        </View>

        {reminderEnabled && (
          <>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.settingItem}
              onPress={onPressStartTime}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, settingIconStyle]}>
                  <MaterialIcons name="schedule" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                    {startTimeLabel}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {startHour}:{startMinute}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.settingItem}
              onPress={onPressEndTime}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, settingIconStyle]}>
                  <MaterialIcons name="schedule" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                    {endTimeLabel}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {endHour}:{endMinute}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.settingItem, { borderBottomWidth: 0 }]}
              onPress={onPressFrequency}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, settingIconStyle]}>
                  <Feather name="repeat" size={18} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                    {frequencyLabel}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {frequencyValueLabel}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
  },
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
});

export default NotificationSettingsSection;
