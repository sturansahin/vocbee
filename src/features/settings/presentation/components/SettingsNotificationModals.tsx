import React, { useEffect } from 'react';
import {
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { NOTIFICATION_FREQUENCY_KEYS } from '@features/notifications';

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
  const { colors, t } = c;
  const modalStyle = { backgroundColor: colors.surface, borderColor: colors.border };

  useEffect(() => {
    if (!c.showTimePicker) return;
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
  }, [c.showTimePicker]);

  return (
    <>
      <Modal
        visible={c.showTimePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => c.setShowTimePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => c.setShowTimePicker(null)} />
          <View style={[styles.modalContent, modalStyle]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {c.showTimePicker === 'start'
                ? t('settings.selectStartTime')
                : t('settings.selectEndTime')}
            </Text>
            <View style={styles.wheelPickerContainer}>
              <WheelColumn
                label={t('settings.hour')}
                values={HOURS}
                extendedValues={HOURS_EXTENDED}
                selectedValue={c.tempHour}
                setSelectedValue={c.setTempHour}
                scrollRef={c.hourScrollRef}
                colors={colors}
                itemKey="hour"
              />
              <Text style={[styles.wheelSeparator, { color: colors.text }]}>:</Text>
              <WheelColumn
                label={t('settings.min')}
                values={MINUTES}
                extendedValues={MINUTES_EXTENDED}
                selectedValue={c.tempMinute}
                setSelectedValue={c.setTempMinute}
                scrollRef={c.minuteScrollRef}
                colors={colors}
                itemKey="minute"
              />
            </View>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={c.confirmTime}
            >
              <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={c.showFrequencyPicker}
        transparent
        animationType="fade"
        onRequestClose={() => c.setShowFrequencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => c.setShowFrequencyPicker(false)}
          />
          <View style={[styles.modalContent, modalStyle]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectFrequency')}
            </Text>
            {NOTIFICATION_FREQUENCY_KEYS.map((frequency) => {
              const selected = c.frequency === frequency;
              return (
                <TouchableOpacity
                  key={frequency}
                  style={[
                    styles.pickerItem,
                    { borderBottomColor: colors.border },
                    selected && { backgroundColor: `${colors.primary}20` },
                  ]}
                  onPress={() => c.changeFrequency(frequency)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: selected ? colors.primary : colors.text },
                    ]}
                  >
                    {t(`settings.${frequency}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      <Modal
        visible={c.showAutoMarkPicker}
        transparent
        animationType="fade"
        onRequestClose={() => c.setShowAutoMarkPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => c.setShowAutoMarkPicker(false)}
          />
          <View style={[styles.modalContent, modalStyle]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.notificationAction')}
            </Text>
            <AutoMarkOption controller={c} enabled />
            <AutoMarkOption controller={c} enabled={false} />
          </View>
        </View>
      </Modal>
    </>
  );
}

interface WheelColumnProps {
  label: string;
  values: string[];
  extendedValues: string[];
  selectedValue: string;
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
          style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]}
          pointerEvents="none"
        />
        <ScrollView
          ref={scrollRef}
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
              <Text style={[styles.wheelItemText, { color: colors.text }]}>{value}</Text>
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
  const selected = c.autoMarkLearned === enabled;
  return (
    <TouchableOpacity
      style={[
        styles.autoMarkOption,
        { borderBottomColor: c.colors.border },
        !enabled && { borderBottomWidth: 0 },
        selected && { backgroundColor: `${c.colors.primary}20` },
      ]}
      onPress={() => c.changeAutoMark(enabled)}
    >
      <View style={styles.autoMarkOptionContent}>
        <MaterialCommunityIcons
          name={enabled ? 'check-circle' : 'close-circle-outline'}
          size={24}
          color={selected ? c.colors.primary : c.colors.textSecondary}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.autoMarkOptionTitle,
              { color: selected ? c.colors.primary : c.colors.text },
            ]}
          >
            {c.t(enabled ? 'settings.markasLearned' : 'settings.doNotMark')}
          </Text>
          <Text style={[styles.autoMarkOptionDesc, { color: c.colors.textSecondary }]}>
            {c.t(enabled ? 'settings.autoMarkDesc1' : 'settings.autoMarkDesc2')}
          </Text>
        </View>
      </View>
      {selected && <MaterialIcons name="check" size={24} color={c.colors.primary} />}
    </TouchableOpacity>
  );
}
