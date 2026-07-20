import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '@app/navigation/types';
import type { Level, VocabularyWord } from '@features/vocabulary';
import { useTheme } from '@shared/theme';
import {
  AppHeader,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Screen,
  SettingsRow,
  Surface,
} from '@shared/ui';

import type { FavoritesScreenFacade } from '../../application/FavoritesScreenFacade';

export interface FavoritesScreenProps {
  facade: FavoritesScreenFacade;
}

type Favorite = VocabularyWord & { level: Level };

export default function FavoritesScreen({ facade }: FavoritesScreenProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setFavorites(await facade.list());
    } catch (error) {
      console.error('Error loading favorites:', error);
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [facade]);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  const handleRemoveFavorite = async (wordId: number, level: Level) => {
    setFavorites((current) =>
      current.filter((item) => !(item.id === wordId && item.level === level)),
    );
    await facade.remove(wordId, level);
  };

  const openFavorite = (item: Favorite) => {
    navigation.navigate('ExampleSentences', {
      word: item.word,
      translation: item.translation,
      sentence1: item.sentence1,
      sentence2: item.sentence2,
      nativeSentence1: item.nativeSentence1,
      nativeSentence2: item.nativeSentence2,
    });
  };

  return (
    <Screen contentStyle={styles.screenContent} testID="favorites-screen">
      <AppHeader
        backAccessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        onBack={() => navigation.goBack()}
        title={t('favorites.title')}
      />
      {isLoading ? (
        <LoadingState title={t('common.loading')} />
      ) : loadError ? (
        <ErrorState
          message={loadError}
          onRetry={loadFavorites}
          retryLabel={t('connection.retry')}
          title={t('common.error')}
        />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<Feather color={colors.textSecondary} name="star" size={64} />}
          message={t('favorites.noFavoritesMsg')}
          title={t('favorites.noFavoritesTitle')}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={favorites}
          keyExtractor={(item) => `${item.id}_${item.level}`}
          renderItem={({ item }) => (
            <Surface style={[styles.card, { borderColor: colors.borderDefault }]}>
              <SettingsRow
                description={item.translation}
                label={item.word}
                leading={<MaterialIcons color={colors.accent} name="translate" size={20} />}
                onPress={() => openFavorite(item)}
                testID={`favorite-row-${item.id}-${item.level}`}
                trailing={
                  <IconButton
                    accessibilityLabel={t('favorites.remove', {
                      defaultValue: `Remove ${item.word} from favorites`,
                    })}
                    icon={(color) => <Feather color={color} name="trash-2" size={22} />}
                    onPress={() => void handleRemoveFavorite(item.id, item.level)}
                    testID={`favorite-remove-${item.id}-${item.level}`}
                    variant="destructive"
                  />
                }
              />
            </Surface>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
  },
  listContent: {
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
