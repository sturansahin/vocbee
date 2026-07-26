import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { VocabularyWord } from '@features/vocabulary';
import { FavoriteStarIcon } from './FavoriteStarIcon';
import { homeWordCardStyles as styles } from './homeWordCardStyles';
import { VocabularyCardHeader } from './VocabularyCardHeader';

interface VocabularyCardBackgroundProps {
  word?: VocabularyWord;
  wordsLength: number;
  cardStyle: StyleProp<ViewStyle>;
  colors: {
    textPrimary: string;
    textSecondary: string;
    accent: string;
    surface: string;
    borderDefault: string;
  };
  isDarkMode: boolean;
  moreExampleLabel: string;
}

export function VocabularyCardBackground({
  word,
  wordsLength,
  cardStyle,
  colors,
  isDarkMode,
  moreExampleLabel,
}: VocabularyCardBackgroundProps) {
  if (!word || wordsLength <= 1) return null;

  return (
    <View pointerEvents="none" style={[styles.cardContainer, cardStyle, backgroundStyles.offset]}>
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderDefault,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.cardContentAbove}>
          <View style={styles.favoriteButton}>
            <FavoriteStarIcon color={colors.accent} size={24} />
          </View>
          <VocabularyCardHeader
            style={styles.cardUpperSection}
            word={word.word}
            pronunciation={word.pronunciation}
            translation={word.translation}
            wordColor={colors.textPrimary}
            pronunciationColor={colors.textSecondary}
            translationColor={colors.accent}
          />
          <View style={[styles.cardLowerSectionStruct, backgroundStyles.lowerSection]}>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  borderBottomLeftRadius: 32,
                  borderBottomRightRadius: 32,
                },
              ]}
            />
            <View style={styles.exampleSentencesContainer}>
              <View style={styles.exampleSentenceTouchable}>
                <Text
                  style={[styles.cardExampleText, { color: colors.textPrimary }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {word.sentence1}
                </Text>
              </View>
              <View style={[styles.thinDivider, { backgroundColor: colors.borderDefault }]} />
              <Text
                style={[styles.cardTranslationText, { color: colors.textSecondary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {word.nativeSentence1}
              </Text>
            </View>
            <View
              style={[
                styles.fullWidthButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Text style={[styles.fullWidthButtonText, { color: colors.textPrimary }]}>
                {moreExampleLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const backgroundStyles = StyleSheet.create({
  offset: {
    transform: [{ scale: 0.95 }, { translateY: 12 }],
    zIndex: 5,
    opacity: 0.8,
  },
  lowerSection: {
    zIndex: 1,
  },
});
