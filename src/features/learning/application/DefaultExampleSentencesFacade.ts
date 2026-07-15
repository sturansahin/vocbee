import type {
  ExampleSentencesFacade,
  ExampleSentencesPlatformGateway,
  GrammarExplanationSource,
} from './exampleSentencesContracts';

export class DefaultExampleSentencesFacade implements ExampleSentencesFacade {
  constructor(
    private readonly grammar: GrammarExplanationSource,
    private readonly platform: ExampleSentencesPlatformGateway,
  ) {}

  async explainGrammar(sentence1: string, sentence2: string) {
    const outputLanguage = await this.platform.getNativeLanguage();
    return this.grammar.explain(sentence1, sentence2, outputLanguage);
  }

  speak(text: string) {
    return this.platform.speak(text);
  }
}
