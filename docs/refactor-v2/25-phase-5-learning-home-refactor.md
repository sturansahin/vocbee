# 25 — Phase 5: Learning / Home Refactor

1. **Amaç** — `HomeScreen` (2391) god-screen’ı parçalamak; vocabulary/progress repository ve learning domain rules’ı kurmak (`11`).
2. **Kapsam** — HomeScreen ince, WordCard/Header/Tutorial component’leri, useLesson hook, VocabularyRepository, ProgressRepository v2 tüketimi, kelime seçim/shuffle/level-geçiş domain rules, ExampleSentences + GrammarApiClient.
3. **Kapsam dışı** — Notification/settings/monetization iç bölme.
4. **Ön koşullar** — Phase 3 (progress v2), Phase 4 (auth/sync).
5. **Etkilenecek dosyalar** — `screens/HomeScreen.tsx`, `screens/ExampleSentencesScreen.tsx`, `services/vocabularyService.ts`, `services/progressService.ts`, `services/groqService.ts`, `components/{VocabularyCardHeader,HomeHeader,HomeTutorialOverlay}.tsx`.
6. **Taşınacak/bölünecek dosyalar** — Home → presentation (screen+components+hooks); vocabularyService → VocabularyRepository+adapter; progressService → ProgressService+rules; grammar → GrammarApiClient.
7. **Yeni hedef klasör yapısı** — `features/learning/*`, `features/vocabulary/*`, `features/progress/*` (bkz. `11`).
8. **Adım adım işler** — (a) domain rules (seçim/shuffle/level) saf çıkar; (b) VocabularyRepository+adapter; (c) ProgressService v2; (d) useLesson hook + use-case’ler; (e) HomeScreen’i kompozisyona indir; (f) ExampleSentences ayır; (g) shim’ler.
9. **Kod davranışı korunacak noktalar** — shuffle sırası `@shuffle_order_${level}`; `lastWordIndex`; learnedWords; level geçiş eşiği/sırası; grammar cache; reklam aralıkları.
10. **Firestore/Storage/Auth/Notification etkileri** — Progress yazımı v2 repository (dual-write); vocabulary cache key’leri aynı; bildirim/auth etkilenmez.
11. **Test gereksinimleri** — progress percent/levelCompletion (≥%90); shuffle determinizmi; Word adapter parse; useLesson hook.
12. **Manuel QA checklist** — [ ] kelime öğren→sayı artar [ ] kapat-aç→devam [ ] seviye tamamla→sonraki açılır [ ] offline→online sync [ ] grammar örnekleri [ ] tutorial ilk kez.
13. **Riskler** — R2 (davranış), R9 (test). Azaltma: snapshot/domain testleri + dual-read.
14. **Rollback planı** — Shim ile eski Home/services.
15. **Kabul kriterleri** — `HomeScreen` < 400 satır; domain saf+test; progress birebir.
16. **Sonraki faza geçmeme şartları** — Progress/level QA regresyonu varsa Phase 6’ya geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 5 → PR-5.1 HomeScreen helper/UI (`getTutorialSwipeNextStep`→domain), 5.2 Vocabulary repo+wordAdapter, 5.3 learning domain rules, 5.4 progress entegrasyon, 5.5 useLesson hook, 5.6 HomeScreen ince+shim, 5.7 ExampleSentences+grammar.
- **Repository:** `35` §3 (Progress), §4 (Vocabulary; `.txt`→Word adapter, Firestore YOK).
- **Shim:** `36` §7.1 (`HomeScreen` default+named), §7.7 (progress), §7.8 (vocabulary).
- **Korunan davranış (`03` §4-6,11):** `@shuffle_order_${level}`, `@last_word_id`, learnedWords, level A1→C1 geçişi, `@grammar_cache`, reklam aralıkları.
- **Testler:** `37` §1 (percent ≥%90), §2 (wordAdapter), §6 (hook).
- **Gate:** `HomeScreen` < 400 satır; progress rules coverage ≥%90; progress/level QA regresyonsuz.
