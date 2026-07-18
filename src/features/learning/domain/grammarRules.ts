const MAX_SENTENCE_LENGTH = 280;

export function assertValidGrammarRequest(sentence1: string, sentence2: string): void {
  const first = sentence1.trim();
  const second = sentence2.trim();

  if (!first || !second) {
    throw new Error('Please provide both sentences before requesting grammar help.');
  }

  if (first.length > MAX_SENTENCE_LENGTH || second.length > MAX_SENTENCE_LENGTH) {
    throw new Error('Sentences must be 280 characters or fewer.');
  }
}
