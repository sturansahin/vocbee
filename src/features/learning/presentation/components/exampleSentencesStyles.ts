import { StyleSheet } from 'react-native';
import { FONT_FAMILY } from '@shared/theme';

export const styles = StyleSheet.create({
  titleSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  wordContainer: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wordTouchable: {
    flexShrink: 1,
  },
  wordTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
  },
  pronunciationText: {
    fontSize: 18,
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  translationContainer: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  translationText: {
    flexShrink: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    width: '85%',
    height: 1,
    alignSelf: 'center',
    marginBottom: 32,
  },
  examplesSection: {
    width: '100%',
    gap: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
  },
  examplesList: {
    gap: 16,
  },
  exampleCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  sentenceRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  exampleText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 24,
  },
  exampleDivider: {
    height: 1,
    width: '100%',
  },
  nativeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  aiSection: {
    width: '100%',
    marginTop: 16,
  },
  loadingContainer: {
    minHeight: 220,
  },
  resultContainer: {
    gap: 24,
  },
  analysisSection: {
    gap: 12,
  },
  sectionHeader: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  sectionTitleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    lineHeight: 24,
  },
  analysisCard: {
    borderRadius: 12,
    padding: 16,
  },
  analysisRow: {
    gap: 6,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    lineHeight: 23,
  },
  dividerLine: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
});
