# 11 — Learning / Progress / Vocabulary Planı

## Mevcut durum
- `screens/HomeScreen.tsx` (2391): kelime akışı, progress, streak, favorites, shuffle cache, reklam, tutorial — god-screen.
- `services/vocabularyService.ts` (547): asset registry (`assets/vocabulary/*.txt`), merge, `VOCABULARY_SCHEMA_VERSION=2`, cache.
- `services/progressService.ts` (301): seviye bazlı yüzde/learnedCount, `lastWordIndex`.
- `screens/ExampleSentencesScreen.tsx` (854) + `services/groqService.ts` (292): grammar örnekleri.

## Problem
- Home god-screen; kelime seçim/shuffle/level-geçiş mantığı UI içinde, test edilemez.
- vocabulary service hem asset hem storage hem schema-migration karışık.

## Hedef yapı
```
features/learning/
  presentation/ screens/(HomeScreen ince), components/(WordCard, HomeHeader, TutorialOverlay), hooks/(useLesson, useWordCard)
  application/  useCases/(startLesson, completeWord, nextWord, loadGrammarExamples), LearningFacade
  domain/       rules(wordSelection, shuffle, levelTransition), constants(CEFR, thresholds)
  data/         GrammarApiClient(groqService), shuffleCacheRepository
features/vocabulary/
  data/ VocabularyRepository(asset registry + cache), adapters/(txt JSON → Word)
  domain/ types(Word), constants(VOCABULARY_SCHEMA_VERSION)
features/progress/
  application/ ProgressService
  data/ ProgressRepository(progressByLevel — 07/08)
  domain/ rules(percent, learnedCount, levelCompletion)  # saf, yüksek coverage hedefi
```
- Kelime seçim/shuffle/level-geçiş **Strategy** ile (`06`). Vocabulary `.txt` → `Word` **Adapter**.

## Davranış korunacak noktalar
- Shuffle sırası `@shuffle_order_${level}`; `lastWordIndex` ile devam; `learnedWords[level]` mantığı.
- Level geçiş eşiği ve sırası (A1→A2→B1→B2→C1) aynen.
- Grammar cache `@grammar_cache`; Groq proxy davranışı.

## Test gereksinimleri
- progress percent / levelCompletion (saf, kritik).
- local vocabulary seçim + shuffle determinizmi (seed).
- Word adapter (`.txt` → Word) parse testleri.
- progressByLevel migration dönüşümü (`08`).

## Manuel QA
- A1’de kelime öğren → sayı artar → uygulamayı kapat-aç → kaldığı yer korunur.
- Seviye tamamlama → sonraki seviye açılır.
- Offline öğren → online olunca sync.

## Riskler / rollback
- Risk: kelime sayısı/percent regresyonu → snapshot testleri + dual-read.
- Rollback: shim + dual-read; eski ProgressService korunur.

## Kabul kriterleri
- `HomeScreen` < 400 satır; domain saf; progress rules coverage ≥ %90.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Repository sözleşmeleri:** `35-repository-adapter-contracts.md` §3 `ProgressRepository` (dual-read + local-first ayna), §4 `VocabularyRepository` (asset + `.txt`→Word adapter; Firestore YOK).
- **Domain tipleri:** `34` §2 `LevelProgress`/`ProgressSummary` (saf). Gerçek `VocabularyWord { id, word, pronunciation?, translation, sentence1, sentence2, nativeSentence1, nativeSentence2 }`; `Level='A1'|'A2'|'B1'|'B2'|'C1'`.
- **Çıkarılacak saf kurallar:** `getTutorialSwipeNextStep` (zaten `HomeScreen.test.tsx` test ediyor) → `learning/domain/rules`; percent (`calcLevelPercent`), level geçiş, shuffle (seed'li determinizm).
- **Testler:** `37` §1 (percent ≥%90), §2 (wordAdapter parse), §6 (useLesson hook).
- **PR kırılımı:** `39` Phase 5 (PR-5.1 HomeScreen helper/UI → 5.2 Vocabulary repo → 5.3 domain rules → 5.4 progress entegrasyon → 5.5 hook → 5.6 HomeScreen ince+shim → 5.7 ExampleSentences/grammar).
