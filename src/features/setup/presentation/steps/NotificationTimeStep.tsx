import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppText, Inline, Surface } from '@shared/ui';
import { useTheme } from '@shared/theme';

const ITEM_HEIGHT = 44;

export interface NotificationTimeStepProps {
  icon: 'wb-sunny' | 'nightlight-round';
  label: string;
  hourValues: readonly string[];
  minuteValues: readonly string[];
  hourScrollRef: React.RefObject<any>;
  minuteScrollRef: React.RefObject<any>;
  onHourMomentumScrollEnd: (event: any) => void;
  onMinuteMomentumScrollEnd: (event: any) => void;
}

function Wheel({
  values,
  scrollRef,
  onMomentumScrollEnd,
  accessibilityLabel,
}: {
  values: readonly string[];
  scrollRef: React.RefObject<any>;
  onMomentumScrollEnd: (event: any) => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wheelWrapper}>
      <View pointerEvents="none" style={[styles.indicator, { borderColor: colors.accent }]} />
      <ScrollView
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
        contentContainerStyle={styles.wheelContent}
        decelerationRate="fast"
        nestedScrollEnabled
        onMomentumScrollEnd={onMomentumScrollEnd}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
      >
        {values.map((value, index) => (
          <View key={`${value}-${index}`} style={styles.wheelItem}>
            <AppText variant="sectionTitle">{value}</AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function NotificationTimeStep({
  icon,
  label,
  hourValues,
  minuteValues,
  hourScrollRef,
  minuteScrollRef,
  onHourMomentumScrollEnd,
  onMinuteMomentumScrollEnd,
}: NotificationTimeStepProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Surface style={[styles.card, { borderColor: colors.borderDefault }]}>
        <Inline>
          <MaterialIcons color={colors.accent} name={icon} size={20} />
          <AppText variant="bodyStrong">{label}</AppText>
        </Inline>
        <Inline justify="center">
          <Wheel
            accessibilityLabel={`${label} hour`}
            onMomentumScrollEnd={onHourMomentumScrollEnd}
            scrollRef={hourScrollRef}
            values={hourValues}
          />
          <AppText variant="sectionTitle">:</AppText>
          <Wheel
            accessibilityLabel={`${label} minute`}
            onMomentumScrollEnd={onMinuteMomentumScrollEnd}
            scrollRef={minuteScrollRef}
            values={minuteValues}
          />
        </Inline>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  wheelWrapper: {
    width: 64,
    height: ITEM_HEIGHT * 3,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    zIndex: 1,
  },
  wheelContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
