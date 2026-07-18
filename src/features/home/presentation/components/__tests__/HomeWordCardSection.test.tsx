// src/features/home/presentation/components/__tests__/HomeWordCardSection.test.tsx
import React from 'react';
import { Animated } from 'react-native';
import { render } from '@testing-library/react-native';
import { HomeWordCardSection } from '../HomeWordCardSection';

const word = {
  id: 1,
  word: 'Haus',
  pronunciation: '/haʊs/',
  translation: 'House',
  sentence1: 'Das ist ein Haus',
  sentence2: 'This is a house',
  nativeSentence1: 'Bu bir ev',
  nativeSentence2: '',
};

const nextWord = {
  ...word,
  id: 2,
  word: 'Baum',
  translation: 'Tree',
  sentence1: 'Der Baum ist grün',
};

function makePosition() {
  return new Animated.ValueXY({ x: 0, y: 0 });
}

describe('HomeWordCardSection', () => {
  const position = makePosition();
  const rotate = position.x.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const baseProps = {
    colors: {
      text: '#000000',
      textSecondary: '#666666',
      primary: '#FFC814',
      surface: '#F5F5F5',
      border: '#E0E0E0',
    },
    isDarkMode: false,
    t: (key: string) => key,
    currentWord: word,
    nextWord,
    wordsLength: 2,
    showTutorial: false,
    tutorialStep: 1,
    isCurrentWordFavorite: false,
    cardRef: { current: null },
    favoriteRef: { current: null },
    wordRef: { current: null },
    exampleSentenceRef: { current: null },
    moreExampleRef: { current: null },
    position,
    rotate,
    panHandlers: {},
    beePositions: [],
    beesAnimating: false,
    beeStaticAnimation: {},
    beeActiveAnimation: {},
    onToggleFavorite: jest.fn(),
    onWordPress: jest.fn(),
    onExampleSentencePress: jest.fn(),
    onMoreExamplePress: jest.fn(),
  };

  it('renders the current word and background next word without crashing', () => {
    const { getByText } = render(<HomeWordCardSection {...baseProps} />);
    expect(getByText('Haus')).toBeTruthy();
    expect(getByText('Das ist ein Haus')).toBeTruthy();
  });

  it('renders nothing for the top card when there is no current word', () => {
    const { queryByText } = render(<HomeWordCardSection {...baseProps} currentWord={undefined} />);
    expect(queryByText('Haus')).toBeNull();
  });
});
