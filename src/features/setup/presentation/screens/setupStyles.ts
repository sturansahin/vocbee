import { StyleSheet } from 'react-native';

import { COLORS, FONT_FAMILY } from '@shared/theme';

export const setupStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrapper: { flex: 1, alignItems: 'center' },
  progressBg: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  headerSpacer: { width: 44 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  titleWhite: { fontFamily: FONT_FAMILY, color: '#fff', fontSize: 28 },
  titleGreen: {
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  bottomButton: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  beeContainer: {
    width: 120,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  lottieAnimation: { width: 120, height: 112, marginLeft: 12 },
});
