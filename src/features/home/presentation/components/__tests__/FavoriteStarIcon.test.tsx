// src/features/home/presentation/components/__tests__/FavoriteStarIcon.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { FavoriteStarIcon } from '../FavoriteStarIcon';

describe('FavoriteStarIcon', () => {
  it('renders without crashing (unfilled)', () => {
    const { toJSON } = render(<FavoriteStarIcon color="#FFC814" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without crashing (filled)', () => {
    const { toJSON } = render(<FavoriteStarIcon color="#FFC814" filled size={32} />);
    expect(toJSON()).toBeTruthy();
  });
});
