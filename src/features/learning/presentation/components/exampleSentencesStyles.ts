import { Dimensions, StyleSheet } from 'react-native';

import { FONT_FAMILY } from '../../../../../utils/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;

export const scale = (size: number): number => (SCREEN_WIDTH / BASE_WIDTH) * size;

export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;

export const HORIZONTAL_PADDING = scale(20);
export const ICON_CONTAINER_SIZE = scale(44);
export const BACK_BUTTON_LEFT = scale(20);

export const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: scale(40) },
  backButton: {
    position: 'absolute',
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: ICON_CONTAINER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleSection: {
    alignItems: 'center',
    paddingTop: scale(8),
    paddingBottom: scale(24),
  },
  wordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(12),
    minHeight: ICON_CONTAINER_SIZE,
  },
  iconButton: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTouchable: { maxWidth: '70%' },
  wordTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(32),
    textAlign: 'center',
  },
  pronunciationText: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(24),
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
    maxWidth: '75%',
    marginBottom: scale(12),
  },
  translationContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ICON_CONTAINER_SIZE,
  },
  translationText: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(28),
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '70%',
  },
  divider: {
    width: '85%',
    height: 1,
    alignSelf: 'center',
    marginBottom: scale(32),
  },
  examplesSection: { marginBottom: scale(16) },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(20),
    marginBottom: scale(16),
  },
  examplesList: { gap: scale(16) },
  exampleCard: {
    padding: scale(20),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12),
  },
  exampleText: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    flex: 1,
  },
  exampleDivider: {
    height: 1,
    width: '100%',
    marginVertical: scale(12),
  },
  nativeText: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(15),
    fontStyle: 'italic',
    lineHeight: moderateScale(22),
  },
  aiSection: { marginTop: scale(16) },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(14),
    borderRadius: scale(12),
    gap: scale(8),
  },
  aiButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: scale(24),
    paddingBottom: scale(40),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  modalTitle: { fontFamily: FONT_FAMILY, fontSize: moderateScale(20) },
  aiIconSmall: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: { padding: scale(4) },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingBottom: scale(20) },
  loadingContainer: {
    padding: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(16),
  },
  loadingText: { fontFamily: FONT_FAMILY, fontSize: moderateScale(16) },
  loadingSubText: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(13),
    marginTop: scale(8),
  },
  errorContainer: {
    padding: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(20),
  },
  errorText: {
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    fontSize: moderateScale(15),
  },
  retryButton: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(20),
  },
  retryText: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  resultContainer: { gap: scale(24) },
  analysisSection: { gap: scale(12) },
  sectionHeader: { borderLeftWidth: 3, paddingLeft: scale(12) },
  sectionTitleText: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(18),
    letterSpacing: 0.5,
  },
  analysisCard: { borderRadius: scale(16), padding: scale(16) },
  analysisRow: { gap: scale(6) },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(12),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
  },
  dividerLine: {
    height: 1,
    width: '100%',
    marginVertical: scale(12),
    opacity: 0.1,
  },
});
