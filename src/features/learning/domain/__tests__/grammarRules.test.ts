import { assertValidGrammarRequest } from '../grammarRules';

describe('grammar request rules', () => {
  it('accepts two non-empty sentences', () => {
    expect(() => assertValidGrammarRequest('One.', 'Two.')).not.toThrow();
  });

  it('rejects empty and oversized sentence input with the legacy messages', () => {
    expect(() => assertValidGrammarRequest(' ', 'Two.')).toThrow(
      'Please provide both sentences before requesting grammar help.',
    );
    expect(() => assertValidGrammarRequest('a'.repeat(281), 'Two.')).toThrow(
      'Sentences must be 280 characters or fewer.',
    );
  });
});
