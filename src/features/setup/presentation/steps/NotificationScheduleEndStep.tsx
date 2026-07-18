// src/features/setup/presentation/steps/NotificationScheduleEndStep.tsx
// Pure UI extraction of SetupScreens.tsx renderStep6Content (end-time wheel picker).
// No behavior change: same ref-ownership rationale as NotificationScheduleStartStep — the parent
// owns the ScrollView refs and momentum-scroll snapping handlers, passed in as props.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONT_FAMILY } from '@shared/theme';

const ITEM_HEIGHT = 44;

export interface NotificationScheduleEndStepProps {
  colors: { text: string; primary: string; surface: string; border: string };
  hourValues: string[];
  minuteValues: string[];
  hourScrollRef: React.RefObject<any>;
  minuteScrollRef: React.RefObject<any>;
  onHourMomentumScrollEnd: (event: any) => void;
  onMinuteMomentumScrollEnd: (event: any) => void;
}

export const NotificationScheduleEndStep: React.FC<NotificationScheduleEndStepProps> = ({
  colors,
  hourValues,
  minuteValues,
  hourScrollRef,
  minuteScrollRef,
  onHourMomentumScrollEnd,
  onMinuteMomentumScrollEnd,
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.scrollView, { justifyContent: 'center' }]}>
      <View style={styles.scheduleContainer}>
        <View
          style={[
            styles.scheduleSection,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.scheduleLabelRow}>
            <MaterialIcons name="nightlight-round" size={20} color={colors.primary} />
            <Text style={[styles.scheduleLabel, { color: colors.text }]}>{t('setup.endTime')}</Text>
          </View>
          <View style={styles.timePickerRow}>
            {/* Hour */}
            <View style={styles.wheelColumn}>
              <View style={styles.wheelScrollWrapper}>
                <View
                  style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]}
                  pointerEvents="none"
                />
                <ScrollView
                  ref={hourScrollRef}
                  style={styles.wheelScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.wheelScrollContent}
                  decelerationRate="fast"
                  nestedScrollEnabled={true}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={onHourMomentumScrollEnd}
                >
                  {hourValues.map((hour, idx) => (
                    <View key={`eh-${idx}`} style={styles.wheelItem}>
                      <Text style={[styles.wheelItemText, { color: colors.text }]}>{hour}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>
            {/* Minute */}
            <View style={styles.wheelColumn}>
              <View style={styles.wheelScrollWrapper}>
                <View
                  style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]}
                  pointerEvents="none"
                />
                <ScrollView
                  ref={minuteScrollRef}
                  style={styles.wheelScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.wheelScrollContent}
                  decelerationRate="fast"
                  nestedScrollEnabled={true}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={onMinuteMomentumScrollEnd}
                >
                  {minuteValues.map((minute, idx) => (
                    <View key={`em-${idx}`} style={styles.wheelItem}>
                      <Text style={[styles.wheelItemText, { color: colors.text }]}>{minute}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Styles copied VERBATIM from screens/SetupScreens.tsx (scheduleContainer/.../timeSeparator block).
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scheduleContainer: {
    gap: 16,
    paddingBottom: 120,
  },
  scheduleSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  scheduleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  scheduleLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wheelColumn: {
    alignItems: 'center',
  },
  wheelScrollWrapper: {
    height: ITEM_HEIGHT * 3,
    width: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  wheelCenterIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    zIndex: 10,
  },
  wheelScroll: {
    flex: 1,
  },
  wheelScrollContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
  },
  timeSeparator: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
});

export default NotificationScheduleEndStep;
