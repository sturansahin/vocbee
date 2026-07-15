import type { GrammarResponse } from '../domain/grammarTypes';

export interface GrammarExplanationSource {
  explain(sentence1: string, sentence2: string, outputLanguage?: string): Promise<GrammarResponse>;
}

export interface ExampleSentencesPlatformGateway {
  getNativeLanguage(): Promise<string>;
  speak(text: string): Promise<void>;
}

export interface ExampleSentencesFacade {
  explainGrammar(sentence1: string, sentence2: string): Promise<GrammarResponse>;
  speak(text: string): Promise<void>;
}
