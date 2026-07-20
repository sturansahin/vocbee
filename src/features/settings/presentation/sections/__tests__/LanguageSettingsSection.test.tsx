// src/features/settings/presentation/sections/__tests__/LanguageSettingsSection.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { LanguageSettingsSection, LanguageProgressRows } from '../LanguageSettingsSection';

// jest.setup.js globally mocks @expo/vector-icons but does not include MaterialCommunityIcons
// (used by this section for trophy/translate icons) — extend it locally for this suite only.
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Ionicons: 'Ionicons',
}));

const colors = {
  textPrimary: '#000',
  textSecondary: '#666',
  surface: '#F5F5F5',
  borderDefault: '#E0E0E0',
  accent: '#FFC814',
};

describe('LanguageSettingsSection', () => {
  it('shows system default label when isSystemLanguage is true', () => {
    const { getByText, queryByText } = render(
      <LanguageSettingsSection
        colors={colors}
        isDarkMode={false}
        preferencesSectionTitle="Preferences"
        languageRowLabel="Language"
        isSystemLanguage
        systemDefaultLabel="System Default"
        selectedLanguageFlagIcon={undefined}
        selectedLanguageName="Turkish"
        onPressLanguageRow={jest.fn()}
      />,
    );
    expect(getByText('System Default')).toBeTruthy();
    expect(queryByText('Turkish')).toBeNull();
  });

  it('shows selected language name when isSystemLanguage is false', () => {
    const { getByText } = render(
      <LanguageSettingsSection
        colors={colors}
        isDarkMode={false}
        preferencesSectionTitle="Preferences"
        languageRowLabel="Language"
        isSystemLanguage={false}
        systemDefaultLabel="System Default"
        selectedLanguageFlagIcon={undefined}
        selectedLanguageName="Turkish"
        onPressLanguageRow={jest.fn()}
      />,
    );
    expect(getByText('Turkish')).toBeTruthy();
  });

  it('calls onPressLanguageRow when the language row is pressed', () => {
    const onPressLanguageRow = jest.fn();
    const { getByText } = render(
      <LanguageSettingsSection
        colors={colors}
        isDarkMode={false}
        preferencesSectionTitle="Preferences"
        languageRowLabel="Language"
        isSystemLanguage={false}
        systemDefaultLabel="System Default"
        selectedLanguageFlagIcon={undefined}
        selectedLanguageName="Turkish"
        onPressLanguageRow={onPressLanguageRow}
      />,
    );
    fireEvent.press(getByText('Language'));
    expect(onPressLanguageRow).toHaveBeenCalledTimes(1);
  });
});

describe('LanguageProgressRows', () => {
  it('renders change level and change language rows with current level info', () => {
    const { getByText } = render(
      <LanguageProgressRows
        colors={colors}
        isDarkMode={false}
        changeLevelLabel="Change Level"
        currentLevelLabel="Beginner"
        currentLevelRange="A1-A2"
        onPressChangeLevel={jest.fn()}
        changeLanguageLabel="Change Language"
        changeLanguageDescription="Restart with a new language"
        onPressChangeLanguage={jest.fn()}
      />,
    );
    expect(getByText('Change Level')).toBeTruthy();
    expect(getByText('Beginner (A1-A2)')).toBeTruthy();
    expect(getByText('Change Language')).toBeTruthy();
  });

  it('calls onPressChangeLanguage when that row is pressed', () => {
    const onPressChangeLanguage = jest.fn();
    const { getByText } = render(
      <LanguageProgressRows
        colors={colors}
        isDarkMode={false}
        changeLevelLabel="Change Level"
        currentLevelLabel="Beginner"
        currentLevelRange="A1-A2"
        onPressChangeLevel={jest.fn()}
        changeLanguageLabel="Change Language"
        changeLanguageDescription="Restart with a new language"
        onPressChangeLanguage={onPressChangeLanguage}
      />,
    );
    fireEvent.press(getByText('Change Language'));
    expect(onPressChangeLanguage).toHaveBeenCalledTimes(1);
  });
});
