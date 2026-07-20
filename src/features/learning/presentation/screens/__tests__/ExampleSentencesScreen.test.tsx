import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@shared/theme';
import type { ExampleSentencesFacade } from '../../../application/exampleSentencesContracts';
import ExampleSentencesScreen from '../ExampleSentencesScreen';

const mockGoBack = jest.fn();
const mockRouteParams = {
  id: 1,
  word: 'Haus',
  pronunciation: '/haʊs/',
  translation: 'House',
  sentence1: 'Das ist ein Haus.',
  sentence2: 'Das Haus ist groß.',
  nativeSentence1: 'Bu bir ev.',
  nativeSentence2: 'Ev büyük.',
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderScreen(facade: ExampleSentencesFacade) {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider forcedMode="light">
        <ExampleSentencesScreen facade={facade} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('ExampleSentencesScreen', () => {
  it('supports speech, back navigation, and an idempotent AI explanation request', async () => {
    let resolveExplanation:
      | ((value: {
          sentence1: { structure: string; grammar: string; reason: string };
          sentence2: { structure: string; grammar: string; reason: string };
        }) => void)
      | undefined;
    const facade: ExampleSentencesFacade = {
      speak: jest.fn(async () => undefined),
      explainGrammar: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveExplanation = resolve;
          }),
      ),
    };
    const screen = renderScreen(facade);

    fireEvent.press(screen.getByLabelText('Haus'));
    await waitFor(() => expect(facade.speak).toHaveBeenCalledWith('Haus'));
    const explainButton = screen.getByLabelText('example.explainGrammarBtn');
    fireEvent.press(explainButton);
    fireEvent.press(explainButton);
    expect(facade.explainGrammar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('example.analyzingGrammar')).toBeTruthy();

    await act(async () => {
      resolveExplanation?.({
        sentence1: { structure: 'SVO', grammar: 'Present', reason: 'Statement' },
        sentence2: { structure: 'SVO', grammar: 'Present', reason: 'Description' },
      });
    });
    await waitFor(() => expect(screen.getAllByText('SVO')).toHaveLength(2));

    fireEvent.press(screen.getByLabelText('common.back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('shows a retryable error state when grammar explanation fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const facade: ExampleSentencesFacade = {
      speak: jest.fn(async () => undefined),
      explainGrammar: jest.fn(async () => {
        throw new Error('offline');
      }),
    };
    const screen = renderScreen(facade);

    fireEvent.press(screen.getByText('example.explainGrammarBtn'));
    await waitFor(() => expect(screen.getByText('example.explanationError')).toBeTruthy());
    expect(screen.getByText('example.retry')).toBeTruthy();
    consoleError.mockRestore();
  });
});
