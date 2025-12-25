// Typography utility for consistent font usage across the app
// The font family is loaded in App.tsx

export const FONT_FAMILY = 'SpecialGothicExpandedOne_400Regular';
export const HEADER_FONT_FAMILY = 'RubikMonoOne_400Regular';

// Use this for all text styles that should use the custom font
export const typography = {
    fontFamily: FONT_FAMILY,
};

// Helper function to apply custom font to style object
export const withCustomFont = (style: object = {}) => ({
    ...style,
    fontFamily: FONT_FAMILY,
});
