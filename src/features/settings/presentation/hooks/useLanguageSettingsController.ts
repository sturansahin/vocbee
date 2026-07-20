import { useEffect, useState } from 'react';
import type { UserLevel } from '@features/vocabulary';
import type { SettingsFacade } from '../../application/contracts';

export function useLanguageSettingsController(facade: SettingsFacade) {
  const [selectedLanguage, setSelectedLanguage] = useState(facade.getSelectedLanguage());
  const [isSystemLanguage, setIsSystemLanguage] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<UserLevel>('beginner');

  useEffect(() => {
    void facade
      .loadUserLevel()
      .then(setCurrentLevel)
      .catch((error) => console.error('Error loading level:', error));
    void facade.isUsingSystemLanguage().then(setIsSystemLanguage);
  }, [facade]);

  return {
    selectedLanguage,
    setSelectedLanguage,
    isSystemLanguage,
    setIsSystemLanguage,
    currentLevel,
    setCurrentLevel,
  };
}
