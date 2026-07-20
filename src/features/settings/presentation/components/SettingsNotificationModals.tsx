import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NOTIFICATION_FREQUENCY_KEYS } from '@features/notifications';
import { AppButton, AppModal, SelectionRow } from '@shared/ui';
import type { SettingsScreenController } from '../hooks/useSettingsScreenController';
import {
  HOURS,
  HOURS_EXTENDED,
  ITEM_HEIGHT,
  MINUTES,
  MINUTES_EXTENDED,
} from './settingsScreenConstants';
import { settingsStyles as styles } from './settingsScreenStyles';

interface SettingsNotificationModalsProps {
  controller: SettingsScreenController;
}

export function SettingsNotificationModals({ controller: c }: SettingsNotificationModalsProps) {
  const { colors, modal, t } = c;

  useEffect(() => {
    if (modal !== 'time-start' && modal !== 'time-end') return;
    const timeout = setTimeout(() => {
      const hourIndex = HOURS.indexOf(c.tempHour) + HOURS.length;
      const minuteIndex = MINUTES.indexOf(c.tempMinute) + MINUTES.length;
      c.hourScrollRef.current?.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
      c.minuteScrollRef.current?.scrollTo({
        y: minuteIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 100);
    return () => clearTimeout(timeout);
  }, [c.hourScrollRef, c.minuteScrollRef, c.tempHour, c.tempMinute, modal]);

  return (
    <>
      <AppModal
        visible={modal === 'time-start' || modal === 'time-end'}
        title={modal === 'time-start' ? t('settings.selectStartTime') : t('settings.selectEndTime')}
        onRequestClose={c.closeModal}
        actions={
          <AppButton fullWidth={false} label={t('common.confirm')} onPress={c.confirmTime} />
        }
      >
        <View style={styles.wheelPickerContainer}>
          <WheelColumn
            label={t('settings.hour')}
            values={HOURS}
            extendedValues={HOURS_EXTENDED}
            setSelectedValue={c.setTempHour}
            scrollRef={c.hourScrollRef}
            colors={colors}
            itemKey="hour"
          />
          <Text style={[styles.wheelSeparator, { color: colors.textPrimary }]}>:</Text>
          <WheelColumn
            label={t('settings.min')}
            values={MINUTES}
            extendedValues={MINUTES_EXTENDED}
            setSelectedValue={c.setTempMinute}
            scrollRef={c.minuteScrollRef}
            colors={colors}
            itemKey="minute"
          />
        </View>
      </AppModal>

      <AppModal
        visible={modal === 'frequency'}
        title={t('settings.selectFrequency')}
        onRequestClose={c.closeModal}
      >
        <View accessibilityRole="radiogroup" style={localStyles.list}>
          {NOTIFICATION_FREQUENCY_KEYS.map((frequency) => (
            <SelectionRow
              key={frequency}
              label={t(`settings.${frequency}`)}
              selected={c.frequency === frequency}
              onPress={() => c.changeFrequency(frequency)}
            />
          ))}
        </View>
      </AppModal>

      <AppModal
        visible={modal === 'auto-mark'}
        title={t('settings.notificationAction')}
        onRequestClose={c.closeModal}
      >
        <View accessibilityRole="radiogroup" style={localStyles.list}>
          <AutoMarkOption controller={c} enabled />
          <AutoMarkOption controller={c} enabled={false} />
        </View>
      </AppModal>
    </>
  );
}

interface WheelColumnProps {
  label: string;
  values: string[];
  extendedValues: string[];
  setSelectedValue: (value: string) => void;
  scrollRef: SettingsScreenController['hourScrollRef'];
  colors: SettingsScreenController['colors'];
  itemKey: 'hour' | 'minute';
}

function WheelColumn({
  label,
  values,
  extendedValues,
  setSelectedValue,
  scrollRef,
  colors,
  itemKey,
}: WheelColumnProps) {
  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const actualIndex = ((index % values.length) + values.length) % values.length;
    setSelectedValue(values[actualIndex]);
    if (index < values.length || index >= values.length * 2) {
      const middleIndex = actualIndex + values.length;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: middleIndex * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  };

  return (
    <View style={styles.wheelColumn}>
      <Text style={[styles.wheelLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.wheelScrollWrapper}>
        <View
          style={[styles.wheelCenterIndicator, { borderColor: colors.accent }]}
          pointerEvents="none"
        />
        <ScrollView
          ref={scrollRef}
          accessibilityLabel={label}
          style={styles.wheelScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.wheelScrollContent}
          decelerationRate="fast"
          nestedScrollEnabled
          snapToInterval={ITEM_HEIGHT}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          {extendedValues.map((value, index) => (
            <View key={`${itemKey}-${index}`} style={styles.wheelItem}>
              <Text style={[styles.wheelItemText, { color: colors.textPrimary }]}>{value}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function AutoMarkOption({
  controller: c,
  enabled,
}: {
  controller: SettingsScreenController;
  enabled: boolean;
}) {
  return (
    <SelectionRow
      label={c.t(enabled ? 'settings.markasLearned' : 'settings.doNotMark')}
      description={c.t(enabled ? 'settings.autoMarkDesc1' : 'settings.autoMarkDesc2')}
      leading={
        <MaterialCommunityIcons
          name={enabled ? 'check-circle' : 'close-circle-outline'}
          size={24}
          color={c.colors.accent}
        />
      }
      selected={c.autoMarkLearned === enabled}
      onPress={() => c.changeAutoMark(enabled)}
    />
  );
}

const localStyles = StyleSheet.create({
  list: {
    gap: 8,
  },
});
