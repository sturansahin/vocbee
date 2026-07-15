import { DefaultExampleSentencesFacade } from '../DefaultExampleSentencesFacade';
import type {
  ExampleSentencesPlatformGateway,
  GrammarExplanationSource,
} from '../exampleSentencesContracts';
import type { GrammarResponse } from '../../domain/grammarTypes';

const explanation: GrammarResponse = {
  sentence1: { structure: 'S + V', grammar: 'Present', reason: 'Daily use' },
  sentence2: { structure: 'S + be', grammar: 'Be verb', reason: 'State' },
};

function makeFacade() {
  const grammar: GrammarExplanationSource = {
    explain: jest.fn(async () => explanation),
  };
  const platform: ExampleSentencesPlatformGateway = {
    getNativeLanguage: jest.fn(async () => 'Turkish'),
    speak: jest.fn(async () => undefined),
  };
  return { facade: new DefaultExampleSentencesFacade(grammar, platform), grammar, platform };
}

describe('DefaultExampleSentencesFacade', () => {
  it('loads a grammar explanation through the application boundary', async () => {
    const { facade, grammar } = makeFacade();

    await expect(facade.explainGrammar('Sentence one.', 'Sentence two.')).resolves.toEqual(explanation);
    expect(grammar.explain).toHaveBeenCalledWith('Sentence one.', 'Sentence two.', 'Turkish');
  });

  it('preserves grammar generation errors for the presentation error state', async () => {
    const { facade, grammar } = makeFacade();
    jest.mocked(grammar.explain).mockRejectedValueOnce(new Error('network unavailable'));

    await expect(facade.explainGrammar('One.', 'Two.')).rejects.toThrow('network unavailable');
  });

  it('delegates pronunciation to the speech gateway', async () => {
    const { facade, platform } = makeFacade();

    await facade.speak('hello');
    expect(platform.speak).toHaveBeenCalledWith('hello');
  });
});
