import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { StreakChip } from '@features/streak';
import { useResponsiveLayout } from '@shared/responsive';
import { HEADER_FONT_FAMILY } from '@shared/theme';
import { IconButton } from '@shared/ui';

interface HomeHeaderProps {
  titleColor: string;
  iconColor: string;
  placeholderColor?: string;
  streakCount: number;
  streakCompletedToday: boolean;
  streakAtRisk: boolean;
  streakTextColor: string;
  streakAccentColor: string;
  streakAccessibilityLabel: string;
  gameAccessibilityLabel?: string;
  favoritesAccessibilityLabel: string;
  settingsAccessibilityLabel: string;
  onPressStreak?: () => void;
  onPressGame?: () => void;
  onPressFavorites?: () => void;
  onPressSettings?: () => void;
  showPlaceholders?: boolean;
}

export function HomeHeader({
  titleColor,
  iconColor,
  placeholderColor = 'rgba(255,255,255,0.12)',
  streakCount,
  streakCompletedToday,
  streakAtRisk,
  streakTextColor,
  streakAccentColor,
  streakAccessibilityLabel,
  gameAccessibilityLabel,
  favoritesAccessibilityLabel,
  settingsAccessibilityLabel,
  onPressStreak,
  onPressGame,
  onPressFavorites,
  onPressSettings,
  showPlaceholders = false,
}: HomeHeaderProps) {
  const { horizontalGutter, moderateScale, sizeClass } = useResponsiveLayout();

  return (
    <View
      style={[
        styles.header,
        { paddingHorizontal: horizontalGutter, paddingVertical: moderateScale(12) },
      ]}
    >
      <View style={styles.headerTitleContainer}>
        <Text
          style={[
            styles.headerTitle,
            {
              color: titleColor,
              fontSize: moderateScale(sizeClass === 'compact' ? 20 : 22),
              letterSpacing: moderateScale(4),
            },
          ]}
        >
          VOCBEE
        </Text>
      </View>
      <View style={styles.headerButtons}>
        {showPlaceholders ? (
          <>
            <View style={[styles.streakPlaceholder, { backgroundColor: placeholderColor }]} />
            <View style={[styles.iconPlaceholder, { backgroundColor: placeholderColor }]} />
            <View style={[styles.iconPlaceholder, { backgroundColor: placeholderColor }]} />
          </>
        ) : (
          <>
            <StreakChip
              count={streakCount}
              completedToday={streakCompletedToday}
              atRisk={streakAtRisk}
              textColor={streakTextColor}
              accentColor={streakAccentColor}
              accessibilityLabel={streakAccessibilityLabel}
              onPress={onPressStreak}
            />
            {gameAccessibilityLabel && onPressGame ? (
              <IconButton
                accessibilityLabel={gameAccessibilityLabel}
                onPress={onPressGame}
                icon={<Feather name="play-circle" size={24} color={iconColor} />}
              />
            ) : null}
            <IconButton
              accessibilityLabel={favoritesAccessibilityLabel}
              onPress={onPressFavorites}
              icon={<Feather name="star" size={24} color={iconColor} />}
            />
            <IconButton
              accessibilityLabel={settingsAccessibilityLabel}
              onPress={onPressSettings}
              icon={<Feather name="settings" size={24} color={iconColor} />}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: HEADER_FONT_FAMILY,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPlaceholder: {
    width: 42,
    height: 32,
    borderRadius: 16,
  },
  iconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
