export interface SentenceAnalysis {
  structure: string;
  grammar: string;
  reason: string;
}

export interface GrammarResponse {
  sentence1: SentenceAnalysis;
  sentence2: SentenceAnalysis;
}
