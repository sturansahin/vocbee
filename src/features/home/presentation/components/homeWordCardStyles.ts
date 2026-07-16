import { Dimensions, StyleSheet } from 'react-native';
import { FONT_FAMILY } from '@shared/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;

export const homeWordCardStyles = StyleSheet.create({
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardStackContainer: { width: SCREEN_WIDTH - 40, height: SCREEN_HEIGHT * 0.55, position: 'relative' },
  cardContainer: { position: 'absolute', width: SCREEN_WIDTH - 40, height: SCREEN_HEIGHT * 0.55 },
  heroCard: { flex: 1, borderRadius: 32, padding: 0, justifyContent: 'center', overflow: 'hidden' },
  cardContentAbove: { flex: 1, width: '100%', justifyContent: 'space-between', zIndex: 200 },
  favoriteButton: {
    position: 'absolute', top: scale(16), left: scale(16), width: scale(40), height: scale(40),
    borderRadius: scale(20), alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  swipeOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  swipeLabelContainer: { alignItems: 'center', gap: 8 },
  skipText: { fontFamily: FONT_FAMILY, color: '#ea8484ff', fontSize: 20, letterSpacing: 4 },
  learnedText: { fontFamily: FONT_FAMILY, color: '#35de5dff', fontSize: 20, letterSpacing: 4 },
  cardUpperSection: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
    paddingTop: 10, paddingBottom: 10,
  },
  cardLowerSectionStruct: { width: '100%', paddingTop: 20, paddingHorizontal: 0, alignItems: 'center' },
  exampleSentencesContainer: { width: '100%', paddingHorizontal: 20, paddingBottom: 12, alignItems: 'center' },
  exampleSentenceTouchable: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  cardExampleText: {
    fontFamily: FONT_FAMILY, fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 40,
  },
  thinDivider: { height: 1, width: '100%', marginVertical: 10, opacity: 0.5 },
  cardTranslationText: {
    fontFamily: FONT_FAMILY, fontSize: 14, fontStyle: 'italic', lineHeight: 20,
    textAlign: 'center', paddingHorizontal: 40,
  },
  fullWidthButton: {
    width: '100%', paddingVertical: 18, paddingHorizontal: 0, alignItems: 'center',
    justifyContent: 'center', marginTop: 8, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  fullWidthButtonText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  bee: { position: 'absolute', width: 50, height: 50, zIndex: 300 },
  beeAnim: { width: 50, height: 50 },
});
