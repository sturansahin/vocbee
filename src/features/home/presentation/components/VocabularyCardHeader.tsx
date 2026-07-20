import React, { memo, Ref } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsiveLayout } from '@shared/responsive';
import { FONT_FAMILY } from '@shared/theme';

const CARD_HORIZONTAL_MARGIN = 40;
const CONTENT_HORIZONTAL_PADDING = 72;
const CARD_HEADER_SIDE_PADDING = 24;
const MIN_CONTENT_WIDTH = 220;
const MAX_CONTENT_WIDTH = 500;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizePronunciation(pronunciation?: string | null): string | null {
  if (typeof pronunciation !== 'string') {
    return null;
  }

  const trimmed = pronunciation.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface VocabularyCardHeaderProps {
  word: string;
  pronunciation?: string | null;
  translation: string;
  wordColor: string;
  pronunciationColor: string;
  translationColor: string;
  style?: StyleProp<ViewStyle>;
  wordContainerRef?: Ref<View>;
  wordContainerStyle?: StyleProp<ViewStyle>;
  onPressWord?: () => void;
}

export const VocabularyCardHeader = memo(function VocabularyCardHeader({
  word,
  pronunciation,
  translation,
  wordColor,
  pronunciationColor,
  translationColor,
  style,
  wordContainerRef,
  wordContainerStyle,
  onPressWord,
}: VocabularyCardHeaderProps) {
  const { width } = useWindowDimensions();
  const { moderateScale } = useResponsiveLayout();
  const contentWidth = clamp(
    width - CARD_HORIZONTAL_MARGIN - CONTENT_HORIZONTAL_PADDING,
    MIN_CONTENT_WIDTH,
    MAX_CONTENT_WIDTH,
  );
  const wordFontSize = clamp(moderateScale(36), 34, 52);
  const pronunciationFontSize = clamp(moderateScale(18), 17, 26);
  const translationFontSize = clamp(moderateScale(24), 22, 36);
  const translationIconSize = clamp(moderateScale(22), 20, 26);
  const favoriteIconCenterX = moderateScale(36);
  const translationIconLeft = Math.max(
    0,
    favoriteIconCenterX - CARD_HEADER_SIDE_PADDING - translationIconSize / 2,
  );
  const translationTextHorizontalPadding = clamp(
    Math.max(moderateScale(40), translationIconLeft + translationIconSize + 12),
    40,
    96,
  );
  const wordBottomSpacing = clamp(moderateScale(8), 6, 10);
  const pronunciationBottomSpacing = clamp(moderateScale(12), 10, 16);
  const translationBottomSpacing = clamp(moderateScale(24), 18, 30);
  const displayPronunciation = normalizePronunciation(pronunciation);

  const wordText = (
    <Text
      style={[
        styles.wordTitle,
        {
          color: wordColor,
          width: contentWidth,
          fontSize: wordFontSize,
          lineHeight: Math.round(wordFontSize + 6),
          marginBottom: wordBottomSpacing,
        },
      ]}
      adjustsFontSizeToFit
      minimumFontScale={0.58}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {word}
    </Text>
  );

  return (
    <View style={[styles.root, style]}>
      <View ref={wordContainerRef} collapsable={false} style={wordContainerStyle}>
        {onPressWord ? (
          <TouchableOpacity
            onPress={onPressWord}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={word}
          >
            {wordText}
          </TouchableOpacity>
        ) : (
          wordText
        )}
      </View>

      {displayPronunciation ? (
        <Text
          style={[
            styles.pronunciationText,
            {
              color: pronunciationColor,
              width: contentWidth,
              fontSize: pronunciationFontSize,
              lineHeight: Math.round(pronunciationFontSize + 6),
              marginBottom: pronunciationBottomSpacing,
            },
          ]}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayPronunciation}
        </Text>
      ) : null}

      <View
        style={[
          styles.translationRow,
          {
            marginBottom: translationBottomSpacing,
          },
        ]}
      >
        <View
          style={[
            styles.translationAccessory,
            {
              left: translationIconLeft,
              width: translationIconSize,
            },
          ]}
        >
          <MaterialIcons name="translate" size={translationIconSize} color={translationColor} />
        </View>
        <Text
          style={[
            styles.translationText,
            {
              color: translationColor,
              fontSize: translationFontSize,
              lineHeight: Math.round(translationFontSize + 6),
              paddingHorizontal: translationTextHorizontalPadding,
            },
          ]}
          adjustsFontSizeToFit
          minimumFontScale={0.68}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {translation}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
  },
  wordTitle: {
    fontFamily: FONT_FAMILY,
    letterSpacing: 1,
    textAlign: 'center',
  },
  pronunciationText: {
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  translationRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  translationAccessory: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationText: {
    width: '100%',
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
    textAlign: 'center',
  },
});
