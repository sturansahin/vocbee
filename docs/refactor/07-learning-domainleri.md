# 07 — Learning / Vocabulary / Progress / Favorites / Streak Domainleri

## Mevcut Durum

- **`services/vocabularyService.ts` (547):** kelime varlıkları dil+seviye başına `.txt` (içi JSON) olarak
  `require` ile yüklenir; per-level AsyncStorage anahtarları (`@vocabulary_` prefix). Şema `version = 2`
  migrasyonu var. `Level = A1|A2|B1|B2|C1`, `UserLevel = beginner|intermediate|advanced`, 21 dil.
- **`services/progressService.ts`:** öğrenme ilerlemesi (`@user_progress`, `@current_level`, `@last_word_id`).
- **`services/streakService.ts` (349):** `StreakState {currentStreak, longestStreak, brokenStreak,
  lastQualifiedDay, lastQualifiedAt}`; yerel-gün-anahtarı mantığı; `@streak` anahtarı.
- **`services/favoritesService.ts` (312):** `FavoriteItem {id, level}`; legacy `number[]` migrasyonu;
  kullanıcıya özel `@favorites_${uid}` anahtarı.
- **UI:** `HomeScreen` (2185) bu domain'lerin hepsini tüketir; `ExampleSentencesScreen` (788),
  `LevelTestScreen` (485), `FavoritesScreen`, `StreakCelebrationOverlay` (465), `utils/streakCelebration.ts`.

## Sorunlar

1. Servisler iyi ayrılmış ama **UI ile sıkı bağlı**; `HomeScreen` orkestrasyon yükünü tek başına taşıyor.
2. **Domain UI'ı dağınık:** streak bileşenleri `components/`, mantık `services/`, yardımcı `utils/`'te.
3. **Vocabulary asset yükleme** (`require` + `.txt`) test ortamında mock'a bağlı (`__mocks__/txtFileMock.js`);
   asset erişimi ile iş mantığı aynı serviste.

## Önerilen Yaklaşım: `learning` feature'ı + alt domain servisleri

Mevcut servisleri **domain sınırlarıyla** feature altına topla; `vocabulary`'de asset erişimini
ayrı bir loader'a çıkar. Veri şekilleri ve AsyncStorage anahtarları **değişmez**.

```
features/learning/
  screens/{HomeScreen,ExampleSentencesScreen,LevelTestScreen}.tsx
  components/{WordCard,WordCardHeader,ProgressBar,...}.tsx
  hooks/{useWordSession,useWordAudio,useHomeProgress,useLevelTest,useExampleSentences}.ts
  vocabulary/
    vocabularyService.ts          # iş mantığı (seçim, shuffle, schema v2 migrasyon)
    assetLoader.ts                # SAF olmayan: dil+seviye -> require('.txt'); tek kapı
    types.ts                      # Level, UserLevel, VocabularyItem
features/progress/
  services/progressService.ts
  hooks/useProgress.ts
features/streak/
  services/streakService.ts
  components/{StreakChip,StreakCelebrationOverlay}.tsx
  hooks/useStreakCelebration.ts   # utils/streakCelebration.ts mantığı
features/favorites/
  services/favoritesService.ts
  screens/FavoritesScreen.tsx
  hooks/useFavorites.ts
features/review/
  services/reviewPromptService.ts      # app launch count, native/store review, feedback email
  components/AppRatingPrompt.tsx
features/grammar/
  services/groqService.ts              # grammar explanation cache + proxy/direct-dev path
  hooks/useGrammarExplanation.ts
```

**Facade:** her feature `index.ts`'i sadece gerekli fonksiyon/hook'ları ihraç eder. Ör.
`features/streak` -> `getStreak`, `recordQualifiedDay`, `useStreakCelebration`, `StreakChip`.
Domain'ler arası çağrı (ör. progress -> streak) facade üzerinden.

**Vocabulary asset sözleşmesi (kritik):** `assetLoader` `Level`+dil -> `require('...txt')` eşleşmesini
tek yerde tutar; mevcut `require` haritası birebir taşınır (metro `.txt` transformer ve
`__mocks__/txtFileMock.js` aynı çalışır). Schema `version = 2` migrasyon kodu korunur.

## Alternatifler ve Neden Elendiler

- **Kelime asset'lerini uzak API'ye taşı** — Elendi (kapsam dışı): offline-first davranış bozulur; ayrı ürün kararı.
- **Progress/streak/favorites'i tek "learning store"da birleştir** — Elendi: farklı yaşam döngüleri ve
  AsyncStorage anahtarları var; ayrı kalırlarsa test ve sync (bkz. `05`) daha temiz.
- **Servisleri olduğu gibi bırak, sadece UI'ı taşı** — Kısmen kabul: servis iç mantığı zaten iyi; bu yüzden
  servis değişikliği minimum (sadece konum + asset loader ayrımı).

## Migration / Implementasyon Adımları

1. **PR-1:** `streakService`, `progressService`, `favoritesService`, `vocabularyService`'i feature
   klasörlerine `git mv`; eski yollardan re-export shim. Davranış aynı.
   - Komut: `npm run typecheck && npm run test:ci`
2. **PR-2:** `vocabulary/assetLoader.ts`'i çıkar (`require` haritası); `vocabularyService` loader'ı çağırır.
3. **PR-3:** `utils/streakCelebration.ts` -> `features/streak/hooks/useStreakCelebration.ts`; `StreakCelebrationOverlay`
   ve `StreakChip` feature'a taşınır.
4. **PR-4:** `FavoritesScreen`, `ExampleSentencesScreen`, `LevelTestScreen` feature altına taşınır.
5. **PR-5..N:** `HomeScreen` orkestrasyonu hook'lara bölünür (bkz. `04`): `useWordSession`, `useWordAudio`,
   `useHomeProgress`, `useTutorial`. Her PR bir hook.

Her PR sonunda: `npm run typecheck && npm run test:ci`.

## Riskler

- **AsyncStorage anahtar değeri kazara değişirse** kullanıcı ilerlemesi/favorileri kaybolur. Azaltım:
  anahtarlar `shared/storage/storageKeys.ts`'ten gelir; değer değişmez (bkz. `11`).
- **`.txt` asset çözümlemesi** taşıma sonrası metro/jest'te kırılabilir. Azaltım: `assetLoader` izole;
  mevcut `__mocks__/txtFileMock.js` mapping korunur; PR-2 sonrası `test:ci` zorunlu.
- **Schema v2 migrasyon** kodu yanlış taşınırsa eski kullanıcı verisi bozulur. Azaltım: migrasyon testi eklenir.
- **Favorites legacy `number[]` migrasyonu** korunmalı (eski kullanıcılar).
- **Grammar cache (`@grammar_cache`)** ve review prompt state (`@VocBee:appReviewPromptState`) öğrenme
  deneyiminin parçası olarak korunmalı; bu servisler mapping dışında bırakılmamalı.

## Test ve Kabul Kriterleri

- Mevcut `services/__tests__/streakService.test.ts` yeşil kalır.
- Yeni: `vocabularyService` schema-v2 migrasyon testi; `favorites` legacy migrasyon testi.
- `assetLoader` her desteklenen dil+seviye için tanımlı (eksik asset = açık hata) testi.
- `npm run typecheck`, `npm run test:ci` yeşil.

## Etkilenecek Dosyalar

```
services/vocabularyService.ts        -> src/features/learning/vocabulary/vocabularyService.ts (+ assetLoader.ts, types.ts)
services/progressService.ts          -> src/features/progress/services/progressService.ts
services/streakService.ts            -> src/features/streak/services/streakService.ts
services/favoritesService.ts         -> src/features/favorites/services/favoritesService.ts
services/groqService.ts              -> src/features/grammar/services/groqService.ts
services/reviewPromptService.ts      -> src/features/review/services/reviewPromptService.ts
components/AppRatingPrompt.tsx       -> src/features/review/components/AppRatingPrompt.tsx
utils/streakCelebration.ts           -> src/features/streak/hooks/useStreakCelebration.ts
components/StreakCelebrationOverlay.tsx -> src/features/streak/components/StreakCelebrationOverlay.tsx
components/StreakChip.tsx (varsa)    -> src/features/streak/components/StreakChip.tsx
screens/HomeScreen.tsx               -> src/features/learning/screens/HomeScreen.tsx (+ hooks/components)
screens/ExampleSentencesScreen.tsx   -> src/features/learning/screens/ExampleSentencesScreen.tsx
screens/LevelTestScreen.tsx          -> src/features/learning/screens/LevelTestScreen.tsx
screens/FavoritesScreen.tsx          -> src/features/favorites/screens/FavoritesScreen.tsx
```
