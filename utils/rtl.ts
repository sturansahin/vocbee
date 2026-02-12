/**
 * RTL (Right-to-Left) Utility
 * 
 * Provides helper functions for RTL-aware layout in languages
 * such as Arabic, Persian (Farsi), and Urdu.
 */

import { I18nManager } from 'react-native';

/** Language codes that use right-to-left script */
const RTL_LANGUAGES = new Set(['ar', 'fa', 'ur', 'he']);

/**
 * Check whether the given language code is an RTL language.
 * Falls back to current I18nManager state when no code is provided.
 */
export function isRTLLanguage(languageCode?: string): boolean {
    if (languageCode) {
        return RTL_LANGUAGES.has(languageCode);
    }
    return I18nManager.isRTL;
}

/**
 * Returns 'row-reverse' for RTL or 'row' for LTR.
 * Use in `flexDirection` to flip horizontal layout automatically.
 */
export function getFlexDirection(languageCode?: string): 'row' | 'row-reverse' {
    return isRTLLanguage(languageCode) ? 'row-reverse' : 'row';
}

/**
 * Returns the appropriate chevron icon name for navigation arrows
 * that should mirror in RTL (e.g. "next" arrow).
 */
export function getChevronIcon(direction: 'forward' | 'back' = 'forward', languageCode?: string): 'chevron-left' | 'chevron-right' {
    const rtl = isRTLLanguage(languageCode);
    if (direction === 'forward') {
        return rtl ? 'chevron-left' : 'chevron-right';
    }
    return rtl ? 'chevron-right' : 'chevron-left';
}

/**
 * Returns `textAlign` value appropriate for the current layout direction.
 */
export function getTextAlign(languageCode?: string): 'left' | 'right' {
    return isRTLLanguage(languageCode) ? 'right' : 'left';
}

/**
 * Apply RTL layout based on language code.
 * Should be called when the app language changes.
 * Note: In Expo managed workflow, `I18nManager.forceRTL` requires
 * a reload to take full effect via `Updates.reloadAsync()`.
 */
export function applyRTLLayout(languageCode: string): boolean {
    const shouldBeRTL = isRTLLanguage(languageCode);
    const currentlyRTL = I18nManager.isRTL;

    if (shouldBeRTL !== currentlyRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        return true; // Layout changed — caller should reload
    }
    return false; // No change needed
}
