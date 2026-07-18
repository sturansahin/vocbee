// src/features/vocabulary/data/adapters/wordAdapter.ts
// Layer: data (adapter) | Feature: vocabulary. PURE (no SDK) — parses raw vocabulary .txt (JSON) into
// VocabularyWord[]. Handles both the asset shape ({ words: [...] }) and a bare array; skips malformed
// rows without throwing; normalizes pronunciation to string | null (mirrors vocabularyService). docs/refactor-v2/35 §10, /37 §2.

import type { VocabularyWord } from '../../domain/types';

function normalizePronunciation(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseVocabularyTxt(raw: string): VocabularyWord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return []; // malformed JSON -> empty, never throws
  }

  const rows: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { words?: unknown }).words)
      ? (parsed as { words: unknown[] }).words
      : [];

  const out: VocabularyWord[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== 'number' || !Number.isFinite(r.id)) continue;
    if (typeof r.word !== 'string') continue;
    if (typeof r.translation !== 'string') continue;

    out.push({
      id: r.id,
      word: r.word,
      pronunciation: normalizePronunciation(r.pronunciation),
      translation: r.translation,
      sentence1: typeof r.sentence1 === 'string' ? r.sentence1 : '',
      sentence2: typeof r.sentence2 === 'string' ? r.sentence2 : '',
      nativeSentence1: typeof r.nativeSentence1 === 'string' ? r.nativeSentence1 : '',
      nativeSentence2: typeof r.nativeSentence2 === 'string' ? r.nativeSentence2 : '',
    });
  }
  return out;
}
