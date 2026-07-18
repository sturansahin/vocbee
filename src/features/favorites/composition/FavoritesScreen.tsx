import React from 'react';

import { DefaultFavoritesScreenFacade } from '../application/FavoritesScreenFacade';
import PresentationFavoritesScreen from '../presentation/screens/FavoritesScreen';
import { getFavorites, removeFromFavorites } from './favoritesService';

const favoritesScreenFacade = new DefaultFavoritesScreenFacade({
  getFavorites,
  removeFromFavorites,
});

export default function FavoritesScreen() {
  return <PresentationFavoritesScreen facade={favoritesScreenFacade} />;
}
