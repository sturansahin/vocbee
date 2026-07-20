import type { TypographyTokens } from './types';

export const FONT_FAMILY = 'SpecialGothicExpandedOne_400Regular';
export const HEADER_FONT_FAMILY = 'RubikMonoOne_400Regular';

export const typography: TypographyTokens = Object.freeze({
  display: {
    fontFamily: HEADER_FONT_FAMILY,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  screenTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: 0,
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodyStrong: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0,
  },
  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0,
  },
  input: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0,
  },
  metric: {
    fontFamily: HEADER_FONT_FAMILY,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
    letterSpacing: 0,
  },
});

export const withCustomFont = (style: object = {}) => ({
  ...style,
  fontFamily: FONT_FAMILY,
});
