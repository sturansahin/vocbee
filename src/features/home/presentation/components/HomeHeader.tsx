import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Svg, { Path } from 'react-native-svg';
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
                icon={<GamePlayIcon color={iconColor} />}
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

function GamePlayIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 750 750" fill="none">
      <Path
        d="M486 517.5C410 400 438.5 322.5 526.5 256.5L650.5 332.5C719.5 376.5 719.5 374.5 650.5 416.5L486 517.5Z"
        fill={color}
        stroke={color}
      />
      <Path
        d="M151.5 26.5L513.5 248.5C364.3 275.7 197.5 214.667 131.5 184C61.0998 156.8 59.5 97.6667 57.5 68C57.5002 5.49996 99.1667 -10.5 151.5 26.5Z"
        fill={color}
        stroke={color}
      />
      <Path
        d="M100.5 199.5L287.5 258L141 306.5C45 306.5 32.4998 219 100.5 199.5Z"
        fill={color}
        stroke={color}
      />
      <Path
        d="M465.5 530C383.5 415.5 426 308.901 486.5 263.5L392 271.099C216 335.099 231 538.5 326 615.5L465.5 530Z"
        fill={color}
        stroke={color}
      />
      <Path
        d="M305 628.5C181.5 500 225 326.099 342.5 271.099C37.0001 281.099 52 660 61.5 688C81.3955 746.639 110.167 748.5 128 737L305 628.5Z"
        fill={color}
        stroke={color}
      />
    </Svg>
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
    gap: 4,
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
