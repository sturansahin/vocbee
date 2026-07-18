import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { VocabularyCardHeader } from '../VocabularyCardHeader';

describe('VocabularyCardHeader', () => {
  it('renders all headline fields on a single line', () => {
    const { getByText } = render(
      <VocabularyCardHeader
        word="Haus"
        pronunciation=" /haʊs/ "
        translation="House"
        wordColor="#111111"
        pronunciationColor="#444444"
        translationColor="#ff9900"
      />,
    );

    expect(getByText('Haus').props.numberOfLines).toBe(1);
    expect(getByText('/haʊs/').props.numberOfLines).toBe(1);
    expect(getByText('House').props.numberOfLines).toBe(1);
  });

  it('hides blank pronunciation and keeps the word pressable', () => {
    const onPressWord = jest.fn();
    const { getByText, queryByText } = render(
      <VocabularyCardHeader
        word="Haus"
        pronunciation="   "
        translation="House"
        wordColor="#111111"
        pronunciationColor="#444444"
        translationColor="#ff9900"
        onPressWord={onPressWord}
      />,
    );

    expect(queryByText('/haʊs/')).toBeNull();

    fireEvent.press(getByText('Haus'));
    expect(onPressWord).toHaveBeenCalledTimes(1);
  });
});
