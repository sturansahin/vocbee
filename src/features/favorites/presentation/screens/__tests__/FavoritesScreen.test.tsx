import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import FavoritesScreen from '../FavoritesScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));

const favorite = {
  id: 7,
  level: 'B1' as const,
  word: 'Haus',
  translation: 'Ev',
  sentence1: 'Das ist ein Haus.',
  sentence2: 'Mein Haus ist klein.',
  nativeSentence1: 'Bu bir ev.',
  nativeSentence2: 'Evim küçük.',
};

describe('FavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads, opens and removes a favorite through the facade contract', async () => {
    const facade = {
      list: jest.fn(async () => [favorite]),
      remove: jest.fn(async () => undefined),
    };
    const { getByTestId, queryByTestId } = render(
      <ThemeProvider forcedMode="light">
        <FavoritesScreen facade={facade} />
      </ThemeProvider>,
    );

    await waitFor(() => expect(getByTestId('favorite-row-7-B1')).toBeTruthy());
    fireEvent.press(getByTestId('favorite-row-7-B1'));
    expect(mockNavigate).toHaveBeenCalledWith('ExampleSentences', {
      word: favorite.word,
      translation: favorite.translation,
      sentence1: favorite.sentence1,
      sentence2: favorite.sentence2,
      nativeSentence1: favorite.nativeSentence1,
      nativeSentence2: favorite.nativeSentence2,
    });

    fireEvent.press(getByTestId('favorite-remove-7-B1'));
    await waitFor(() => expect(facade.remove).toHaveBeenCalledWith(7, 'B1'));
    expect(queryByTestId('favorite-row-7-B1')).toBeNull();
  });

  it('renders empty and retryable error states distinctly', async () => {
    const emptyFacade = {
      list: jest.fn(async () => []),
      remove: jest.fn(async () => undefined),
    };
    const empty = render(
      <ThemeProvider forcedMode="dark">
        <FavoritesScreen facade={emptyFacade} />
      </ThemeProvider>,
    );
    await waitFor(() => expect(empty.getByText('favorites.noFavoritesTitle')).toBeTruthy());
    empty.unmount();

    const errorFacade = {
      list: jest
        .fn<Promise<(typeof favorite)[]>, []>()
        .mockRejectedValueOnce(new Error('Favorites unavailable'))
        .mockResolvedValueOnce([]),
      remove: jest.fn(async () => undefined),
    };
    const error = render(
      <ThemeProvider forcedMode="light">
        <FavoritesScreen facade={errorFacade} />
      </ThemeProvider>,
    );
    await waitFor(() => expect(error.getByText('Favorites unavailable')).toBeTruthy());
    fireEvent.press(error.getByRole('button', { name: 'connection.retry' }));
    await waitFor(() => expect(errorFacade.list).toHaveBeenCalledTimes(2));
  });
});
