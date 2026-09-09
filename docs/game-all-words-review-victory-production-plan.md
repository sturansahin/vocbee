# VocBee Game — Gömülü Kelime Kataloğu Production Planı

Durum: **Phase 3 uygulandı ve kendi gate'i geçti; Phase 0 release blockerları hâlâ açık**

Son güncelleme: 2026-09-09

Kapsam: React Native/Expo host, Android/iOS Unity bridge ve Unity oyun runtime'ı

## 1. Amaç

Normal uygulamada kullanılan 21 dil × 5 seviye vocabulary verisinin oyun için gerekli küçük
parçası Unity build'ine gömülecektir. Host uygulama Unity'ye kelime veya hazırlanmış round
göndermeyecektir.

Host yalnız şu oyun girdilerini gönderir:

- ana dil;
- hedef dil;
- aktif seviye;
- aktif seviyedeki learned word ID listesi.

Schema, catalog uyumluluğu, session kimliği, tema ve erişilebilirlik gibi küçük operasyonel
metadata korunabilir; bunlar kelime verisi değildir ve payload büyüklüğü problemi oluşturmaz.

Unity seçili dil/seviye kataloglarını ID üzerinden birleştirir:

```text
validIds       = nativeCatalogIds ∩ targetCatalogIds
reviewTargets  = validIds ∩ learnedWordIds
newTargets     = validIds - learnedWordIds
```

Kullanıcı Unity içindeki mevcut başlangıç ekranında:

- **Yeni Kelimeler Öğren** seçerse `newTargets`;
- **Öğrendiklerini Tekrarla** seçerse `reviewTargets`

ile oyuna başlar.

Bu mimaride kelime metinleri ve üç seçenekli roundlar bridge'den geçmediği için 64 KiB sınırı
pratik olarak ortadan kalkar. En büyük seviye olan B2'de 1.424 ID içeren session yaklaşık 6–8 KiB
olur.

## 2. Kesin ürün davranışı

### 2.1 Yeni kelimeler modu

- Session açılışındaki bütün geçerli öğrenilmemiş ID'ler ilk cycle'a alınır.
- Her target ilk cycle'da tam bir kez sorulur.
- İlk cycle bittiğinde deste yeniden karıştırılır ve oyun mevcut sonsuz-run davranışıyla devam
  eder.
- Doğru cevap bu çalışma kapsamında kelimeyi otomatik learned yapmaz.
- Host progress, level, favorites, notifications veya sync state'i değişmez.

### 2.2 Review modu

- Session açılışındaki bütün geçerli learned ID'ler finite review destesini oluşturur.
- Her review targetı tam bir kez sorulur.
- Yanlış cevap mevcut loss davranışını çalıştırır; review zaferi ve streak ödülü oluşmaz.
- Son benzersiz target doğru cevaplandığında review zaferi bir kez oluşur.
- Zafer sırasında inferno efekti oynar ve ardından victory result ekranı gösterilir.
- Review zaferi günlük `recordDailyStudyAction()` çağrısı üretir.
- Aynı gün ikinci review zaferi streak'i tekrar artırmaz.
- Play Again yeni run state'i oluşturur; speed, score, combo, deck index ve completion flag
  sıfırlanır.

### 2.3 Az kelimeli havuzlar

- Bir veya iki learned/unlearned target bulunması modu kapatmaz.
- Distractorlar seçili seviyenin bütün target-language catalogundan alınabilir.
- Toplam catalogda üç ayırt edilebilir seçenek yoksa ilgili mod placeholder olur.
- Distractor ID'leri target completion sayacına dahil edilmez.

### 2.4 Uzun review kabulü

B2'de 1.424 kelimelik review uzun sürebilir. Bu owner tarafından istenen ürün davranışıdır ve bu
plan kelimeleri bölmez, kırpmaz veya checkpoint'e ayırmaz. Uzun-run senaryosu gerçek zamanlı
otomasyonla değil, Unity EditMode'da timersız hızlı simulation ile doğrulanır.

## 3. Doğrulanmış baseline

### 3.1 Vocabulary

| Seviye | Kelime sayısı |
| --- | ---: |
| A1 | 898 |
| A2 | 867 |
| B1 | 805 |
| B2 | 1.424 |
| C1 | 1.298 |

- 105 vocabulary dosyasının seviye bazlı ID kümeleri bugün birebir eşittir.
- Mevcut pretty JSON vocabulary toplamı 28.300.619 byte'tır.
- Yalnız `{id, word}` içeren minified compact kataloglar 3.637.397 byte'tır.
- Unity build sıkıştırması ayrıca AAB ve iOS archive üzerinde ölçülmelidir; gzip tahmini release
  kriteri değildir.

### 3.2 Host

- `src/features/game/domain/gameSession.ts` schema 4 katalog metadata ve learned ID snapshotı üretir.
- Host artık vocabulary, prompt, choice, round veya new/review deck üretmez.
- Session kırpılmaz; 32 KiB iç bütçe aşılırsa launch açık hatayla durur.
- `modules/vocbee-unity/index.ts` direct JSON için 64 KiB hard limit uygular.
- Native event listener `openGame()` çağrısından önce kurulur ve aktif sessionın `finished`
  eventinde temizlenir; `reviewCompleted` consumerı Phase 4 kapsamındadır.
- Home focus/AppState active olduğunda streak summary'yi zaten yeniler; Home için yeni refresh
  mekanizması yazılmayacaktır.

### 3.3 Unity source/artifact durumu

- Otoriter checkout `vocbee-game-2026-07-28_17-23-42`, `main` branch ve
  `2ed0e5ef0b494dc28df3ceaa2c98d6079bf4122f` commitidir.
- Checkout ve iki checked-in artifact Unity `6000.3.14f1 (d68c3f99a318)` kullanır.
- Gerçek build scene'i `Assets/VocBee/Scenes/VocbeeRunner.unity`; gerçek runtime akışında
  `VocbeeRunner`, looping `RoundDeck`, gate schedule ve ortak immutable `TrackSpeed` vardır.
- Host ve test edilmiş Phase 3 Unity working tree bugün schema 4'tür. Checked-in Android AAR
  içindeki IL2CPP metadata `GameSessionV1`, iOS XCFramework ise `GameSessionV3` içerir.
- Android AAR yerel eski exportla byte-for-byte eşleşir; iOS artifactin en yakın source adayı
  `7188d3c834d9adac3bb3579f871c7b8a7cdc019c` commitidir. Hiçbir artifact source commitini
  gömmediği için bu eşlemeler production provenance sayılmaz.

Android ve iOS aynı pinned source revisiondan yeniden üretilip artifact hashleri kaydedilmeden
Phase 0 geçmez.

### 3.4 Inferno

Kullanılacak inferno asseti workspace'te yoktur. Implementasyondan önce asset path, GUID, tür,
URP/mobil uyumluluğu ve ticari lisansı doğrulanmalıdır.

## 4. Production mimarisi

```text
assets/vocabulary/*.txt
        |
        | generateGameVocabulary.cjs
        v
Unity Resources/Vocabulary/*.bytes + catalog-manifest.json
        ^
        |
Host session: language pair + level + learned IDs + catalog metadata
        |
        v
Unity loads exactly two catalogs
        |
        +--> learned intersection --> Review finite deck
        |
        +--> learned difference ----> New looping deck
```

### 4.1 Veri otoritesi

- Vocabulary'nin tek içerik kaynağı mevcut normal uygulama vocabulary girdileridir.
- Unity katalogları elle düzenlenmez.
- Normal uygulamanın full vocabulary assetleri ve `DefaultVocabularyService` davranışı korunur.
- Unity çıktısına sentence, pronunciation, native sentence veya başka öğrenme alanı alınmaz.
- Generator yalnız `id + word` üretir.

### 4.2 Stable ID kuralı

Production identity:

```text
level + wordId
```

- Aynı ID bütün dillerde aynı kavramı temsil etmelidir.
- Aynı `level + wordId` sonraki catalog sürümünde başka kelimeye atanamaz.
- Mevcut `scripts/generateVocabulary.js` ID'yi satır numarasından ürettiği için canonical
  kaynaklara açık ID eklenmeli veya eşdeğer immutable ID lock uygulanmalıdır.
- Duplicate, negatif, unsafe integer veya boş word build'i durdurmalıdır.
- ID seti değişiyorsa eski learned progress için explicit migration kararı gerekir.
- `catalogVersion`, ID'nin parçası değildir; host/Unity içerik uyumluluğunu belirtir.

### 4.3 Compact catalog formatı

Her dosya yalnız bir dil ve seviye içerir:

```json
{
  "words": [
    { "id": 1, "word": "house" },
    { "id": 2, "word": "car" }
  ]
}
```

Önerilen Unity yolları:

```text
Assets/VocBee/Resources/Vocabulary/english_A1.bytes
Assets/VocBee/Resources/Vocabulary/turkish_A1.bytes
Assets/VocBee/Resources/Vocabulary/catalog-manifest.json
```

`Resources.Load<TextAsset>` extension olmadan çağrılır. Tüm 105 katalog build'e gömülür ancak
runtime'da yalnız seçili iki catalog load/parse edilir.

### 4.4 Catalog manifest

Manifest generator çıktısıdır:

```text
manifestSchemaVersion
catalogVersion
catalogHash
languages[]
levels[]
files[path] = { sha256, wordCount, byteLength }
```

- Dil, seviye ve kayıtlar sabit sırada işlenir.
- Kayıt property sırası `id`, sonra `word` olur.
- Aynı input byte-for-byte aynı catalog ve hash üretir.
- Host sessiondaki version/hash, Unity'nin gömülü manifestiyle eşleşmeden oyun menüsü aktif
  olmaz.
- Aynı version altında hash değişmesi CI hatasıdır.

## 5. Session sözleşmesi

### 5.1 GameSession V4

Kelime/round taşımayan minimum payload:

```text
schemaVersion: 4
bridgeVersion: 1
vocabularySchemaVersion: 2
catalogVersion: positive safe integer
catalogHash: lowercase SHA-256
sessionId: UUID
level: A1 | A2 | B1 | B2 | C1
nativeLanguage: supported language key
targetLanguage: supported language key
learnedWordIds: unique safe integer[]
```

Mevcut küçük presentation metadata korunabilir:

```text
theme
reducedMotion
uiLanguage
isRtl
uiText
```

Bu alanlar 64 KiB probleminin nedeni değildir. Round, prompt, choice ve vocabulary text sessiona
konmayacaktır.

### 5.2 Validasyon

Host ve Unity aynı kuralları uygular:

- JSON tek object olmalı ve UTF-8 olarak 64 KiB'ı aşmamalıdır.
- `sessionId` gerçek UUID olmalıdır.
- Language key ve level allowlistten gelmelidir.
- `catalogHash` 64 karakter lowercase hex olmalıdır.
- Learned ID'ler unique, non-negative safe integer olmalıdır.
- Unity catalogunda bulunmayan learned ID sessionı fail-closed reddetmelidir.
- Native ve target diller aynı seçilmişse product kuralına göre launch reddedilmeli veya mevcut
  setup davranışı korunmalıdır; sessiz fallback yapılmaz.
- Payload hiçbir koşulda kırpılmaz.

CI'da en büyük B2 fixture için 32 KiB iç bütçe, native wrapper'da 64 KiB hard limit korunur.

## 6. Unity oyun akışı

### 6.1 Session load

1. V4 session parse ve validate edilir.
2. Embedded catalog manifest version/hash kontrol edilir.
3. Yalnız `{nativeLanguage}_{level}` ve `{targetLanguage}_{level}` load edilir.
4. Her catalog `Dictionary<int, string>` haline getirilir.
5. İki catalogun ID kümeleri eşitliği doğrulanır.
6. Learned set oluşturulur ve new/review target listeleri ayrılır.
7. Mod butonları ilgili target sayılarıyla aktif/pasif hale getirilir.
8. Kullanıcı mod seçince yalnız seçili modun deck'i oluşturulur.

Catalog parse edildikten sonra `TextAsset`ler `Resources.UnloadAsset` ile bırakılır; dictionary'ler
session boyunca tutulur ve Unity kapanırken referansları temizlenir.

### 6.2 Round üretimi

Roundlar hostta veya bütün deck için upfront oluşturulmaz. Unity current target için gerektiğinde:

- promptu native-language dictionary'den;
- doğru cevabı target-language dictionary'den;
- iki distractoru target-language full-level catalogundan

üretir.

Distractor kuralı:

```text
candidate.id != target.id
normalize(targetWord(candidate)) != normalize(targetWord(target))
normalize(nativeWord(candidate)) != normalize(nativeWord(target))
```

Son koşul `suçlamak → accuse/blame` gibi aynı native prompta sahip iki semantik doğru cevabın
aynı roundda görünmesini engeller.

- Üç choice ID'si benzersizdir.
- Üç normalized display label benzersizdir.
- Tam bir choice `correctWordId` taşır.
- Normalization tek helper'da `NFKC + invariant case` kullanır.
- Correct lane dağılımı dengeli ve deterministic test edilebilir olur.

### 6.3 Deck politikası

Mevcut deck/schedule yapısı tahmin edilmeden Phase 0'da gerçek source üzerinden uyarlanır.
Gerekli davranış:

```text
New mode:    Looping
Review mode: Finite
```

API'nin minimum ihtiyacı:

```text
TryNext(out targetId) -> bool
Count
DrawnCount
Reset()
```

- Looping deck cycle bitince shuffle eder.
- Finite deck son targettan sonra `false` döndürür.
- Review zaferi yalnız deck bitişine değil benzersiz doğru target sayısına da bakar.

### 6.4 Review zafer state'i

```text
Playing
  -> wrong ----------------------> LossResult
  -> correct, target kaldı ------> Playing
  -> correct, son target --------> VictoryCelebration -> VictoryResult
```

Run başlangıcında resetlenen state:

- mode;
- target count;
- doğru bilinen review ID seti;
- completion sent flag;
- score/combo;
- correct answer count;
- current world speed.

Son doğru review targetında:

1. Skor/combo güncellenir.
2. ID benzersiz doğru setine eklenir.
3. Set count target counta eşitse input ve gate spawn durur.
4. `reviewCompleted` eventi bir kez gönderilir.
5. Inferno ve zafer sesi oynar.
6. Yaklaşık 2,4 saniye sonra victory result açılır.

VFX hatası completion eventini veya victory state'i engellemez.

### 6.5 Hız

`Time.timeScale` değiştirilmez. Yalnız gate ve pistin ortak world speed değeri güncellenir:

```text
speed(correctCount) = baseSpeed * (1 + 0.45 * (1 - exp(-correctCount / 20)))
```

Default:

```text
baseSpeed = 9
maxMultiplier = 1.45
curveAnswers = 20
theoretical cap = 13.05
```

- Her doğru cevap current speed'i artırır.
- Gate ve track aynı speed kaynağını kullanır.
- Retry, Play Again ve yeni mode speed'i base değere döndürür.
- Pause/resume current speed'i korur.
- Tuning alanları Inspector'da kalır.

### 6.6 Inferno

Asset doğrulandıktan sonra minimum entegrasyon yapılır:

- Prefab `VocbeeRunner` üzerinde serialized reference olur.
- Scene referansı build'e dahil etmek için yeterlidir; prefab ayrıca `Resources` altına konmaz.
- Basit Particle System/Animator doğrudan runner tarafından play/reset edilir.
- Ayrı VFX controller yalnız asset yaşam döngüsü gerçekten gerektirirse eklenir.
- `reducedMotion=true` durumunda camera shake yoktur; düşük emisyon veya statik glow/fade
  kullanılır.
- Null/broken prefab yalnız warning üretir.

## 7. Host ve native sorumlulukları

### 7.1 Host dosyaları

| Dosya | Değişiklik |
| --- | --- |
| `scripts/generateGameVocabulary.cjs` | 105 compact catalog, manifest, `--check`, `--sync-unity` |
| `src/features/game/generated/catalog-manifest.json` | Hostun version/hash kaynağı |
| `src/features/game/generated/catalog-ids.json` | Hostun level bazlı learned ID allowlisti |
| `src/features/game/domain/gameSession.ts` | V4 type/validator; hazır round ve 15/30 limitlerini kaldır |
| `src/features/game/composition/gameSession.ts` | Level/language/learned snapshot; silent trim'i kaldır; V4 launch |
| `src/features/game/composition/gameEventCoordinator.ts` | Aktif session event validation ve streak çağrısı |
| `modules/vocbee-unity/index.ts` | Typed `reviewCompleted` event union |

Tek implementasyon için repository interface, cache transport veya yeni dependency eklenmez.

### 7.2 Event coordinator

Coordinator:

- native listener'ı `openGame` çağrısından önce kurar;
- aktif `sessionId` değerini bellekte tutar;
- event JSON'unu typed/fail-closed parse eder;
- yalnız aktif sessiona ait ilk `reviewCompleted` eventini işler;
- `recordDailyStudyAction()` çağırır;
- `finished` sonrası listener ve aktif sessionı temizler.

Önerilen minimum event:

```text
type: reviewCompleted
eventVersion: 1
bridgeVersion: 1
sessionId: UUID
level: A1 | A2 | B1 | B2 | C1
targetCount: positive integer
```

`score`, `bestCombo`, persistent completion ledger veya analytics bu özellik için kullanılmıyorsa
evente eklenmez.

### 7.3 Native Android/iOS

Mevcut native modüller bütün geçerli Unity eventlerini JS'e iletiyor ve yalnız `finished` eventinde
Unity'yi kapatıyor. Bu nedenle yeni native transport veya storage katmanı gerekmez.

Yalnız regresyon doğrulanır:

- V4 JSON Unity'ye byte değişmeden ulaşır.
- `reviewCompleted` Unity Activity/View'i kapatmaz.
- `finished` mevcut unload davranışını korur.
- Invalid JSON 64 KiB hard limitte reddedilir.

Kod zaten bu davranışı sağlıyorsa Kotlin/Swift dosyaları değiştirilmez.

### 7.4 Normal uygulama izolasyonu

Game launch yalnız read-only çağrılar yapar:

```text
getCurrentLevel()
getLanguagePair()
getLearnedWords(level)
generated catalog manifest
```

Launch sırasında çağrılmaz:

- `generateVocabulary()`;
- `markWordAsLearned()`;
- `checkAndAdvanceLevel()`;
- favorite/notification mutationları;
- vocabulary clear/migration;
- Firestore write.

Review victory yalnız mevcut streak servisini çağırır. Home zaten focus/AppState dönüşünde streak'i
yeniden okur; HomeScreen'e yeni refresh kodu eklenmez.

## 8. OTA ve release compatibility

Bu release `expo-updates`ı etkinleştirmez. Mevcut iOS config disabled'dır ve app configte aktif EAS
Update channel/runtimeVersion bulunmamaktadır.

- Catalog değişikliği yeni Android/iOS Unity artifacti ve yeni store binary gerektirir.
- Host/Unity catalog hash mismatch runtime'da oyunu fail-closed kapatır.
- EAS Update gelecekte etkinleştirilirse native catalog compatibility için ayrı runtimeVersion ve
  release policy hazırlanır.
- OTA çalışması bu feature'ın scope'una eklenmez.

## 9. Uygulama phase'leri

### Phase 0 — Kaynak ve contract doğrulaması

İşler:

- Otoriter Unity repo/branch/commit bulunur.
- Gerçek scene, deck/schedule ve world speed akışı okunur.
- Tarihsel host schema 3 ile checked-in Android Unity schema 1 mismatch'i reproduce edilir.
- Android/iOS export provenance kaydedilir.
- Inferno asset, lisans ve URP/mobil uyumluluğu doğrulanır.
- GameSession V4 fixture'ı host ve Unity için sabitlenir.

Production gate:

```text
npm run game:phase0:check
```

Canonical fixture `docs/artifacts/game-session-v4.fixture.json`, hash/provenance ve blocker kaydı
`docs/artifacts/game-phase0-provenance.json` dosyasındadır. Gate source remote/branch/commit ve
Unity sürümünü, gerçek scene/deck/schedule/speed markerlarını, fixture hash/şeklini ve artifact
hashlerini doğrular; aşağıdaki çıkış şartlarından biri eksikse non-zero döner.

`d13f3d73706c5a080095568ec053be86ec17895e` commitinde Unity `6000.3.14f1` batchmode ile
`Vocbee.Game.Tests` EditMode filtresi 33/33 başarılıdır.

Çıkış kapısı:

- Unity project aynı version ile açılıyor ve test/export yapılabiliyor.
- Android/iOS aynı source revisiondan üretilecek.
- Contract fixture iki tarafta kabul ediliyor.
- Inferno bilgileri eksiksiz.

### Phase 1 — Compact catalog generator

İşler:

- Canonical stable-ID kuralını uygula.
- `generateGameVocabulary.cjs` ve manifest üretimini ekle.
- `--check` ve kontrollü `--sync-unity <project-root>` uygula.
- Package/CI scriptlerini ekle.

Uygulanan production sözleşmesi:

- Tek kaynak `assets/vocabulary/*.txt`; çıktı yalnız sıralı `id + word` alanlarını içerir.
- `scripts/gameVocabularyLock.json`, bütün `21 × 5 × id × normalize(word)` kimliklerini ve
  `catalogVersion + catalogHash` çiftini kilitler. Aynı version altında içerik değişikliği veya
  herhangi bir dilde ID anlamı kayması fail-closed durur.
- Host manifesti ve ID allowlisti `src/features/game/generated`, Unity çıktısı
  `Assets/VocBee/Resources/Vocabulary` altındadır. Unity `.meta` GUID'leri de deterministiktir.
- `catalogVersion=1`, `catalogHash=6d0cff7d0b611c0ebf96e6f0534fa73b2443875e1e4681ac29b3817ba0de3985`.
- 105 compact katalog toplamı `3.637.397` byte'tır.
- CI `game:vocabulary:check` ve `test:game-vocabulary` komutlarını blocking çalıştırır.

Çıkış kapısı:

- 21 dil × 5 seviye eksiksiz.
- ID parity, duplicate/empty/unsafe ID ve deterministic hash testleri geçiyor.
- Unity output elle değiştirildiğinde `--check` fail ediyor.
- Compact toplam boyut raporlanıyor.

### Phase 2 — Host GameSession V4

İşler:

- Round/new/review content payloadlarını kaldır.
- Language pair, level ve learned ID snapshotını taşı.
- Catalog metadata ve mevcut presentation metadata ekle.
- 15/30 target limitlerini ve `fitSessionToBridge()` silent trim'ini kaldır.
- Event listener'ı launch öncesi kur.

Uygulanan production sözleşmesi:

- `GameSessionV4` yalnız schema/bridge/catalog metadata, language pair, level, learned ID snapshotı
  ve küçük presentation metadata taşır.
- Language/level allowlist generated cataloglardan gelir; duplicate, negative, unsafe ve catalogda
  olmayan learned ID'ler explicit hata koduyla reddedilir.
- Canonical V4 fixture host validator tarafından kabul edilir; catalog version/hash mismatch ve
  aynı native/target language fail-closed durur.
- B2'deki 1.424 learned ID eksiksiz taşınır ve 32 KiB bütçenin altında kalır; silent trim yoktur.
- Launch yalnız `getCurrentLevel()`, `getLanguagePair()` ve `getLearnedWords(level)` read'lerini
  yapar. Listener `openGame()` öncesinde kurulur, launch hatasında veya aktif `finished` eventinde
  kaldırılır.

Çıkış kapısı:

- Session içinde word/prompt/choice/round bulunmuyor.
- En büyük B2 fixture 32 KiB altında.
- Invalid metadata ve ID'ler açık hata üretiyor.
- Normal app state launch sırasında değişmiyor.

### Phase 3 — Unity catalog ve mode partition

İşler:

- V4 parse/validation.
- Manifest ve yalnız seçili iki catalog load.
- Dictionary ID join ve learned/new partition.
- Bir/iki target destekleyen mode availability.
- On-demand round/distractor factory.

Uygulanan production sözleşmesi:

- Unity V4 sessionı 64 KiB sınırı, UUID, schema/catalog metadata, language pair, presentation
  metadata ve unique safe learned ID kurallarıyla fail-closed doğrular.
- Embedded manifest doğrulandıktan sonra yalnız seçili native ve target `TextAsset` katalogları
  load/parse edilir; parse sonrası üç asset de `Resources.UnloadAsset` ile bırakılır.
- İki katalog dictionary'ye çevrilir, ID parity ve unknown learned ID kontrol edilir; sorted
  learned/new partition session boyunca tutulur ve yeni session/destroy sırasında temizlenir.
- Bir veya iki targetlı modlar full-level distractorlarla aktiftir. Roundlar target çekildiğinde
  üretilir; ID, normalized target label ve native prompt collisionları elenir, correct lane
  deterministik olarak dengelenir.
- Missing/mismatch/invalid katalog recoverable error eventi ve iki modu kapalı ready ekranı üretir.
- Unity `6000.3.14f1` üzerinde 41/41 EditMode ve PlayMode smoke başarılıdır; EditMode suite'i
  A1–C1 partitionı, selected-two load sınırını ve 21 dilin bütün A1 targetlarını doğrular.

Çıkış kapısı:

- A1–C1 bütün ID partition testleri geçiyor.
- 21 dilde prompt/answer collision fixture'ları ambiguous choice üretmiyor.
- Missing/mismatch catalog recoverable error gösteriyor.
- Yalnız iki catalog parse edildiği profiler/test ile doğrulanıyor.

### Phase 4 — Deck, victory, speed ve inferno

İşler:

- New looping ve review finite deck.
- Review unique-correct completion state.
- `reviewCompleted` event ve streak coordinator.
- Mutable capped speed.
- Inferno/reduced-motion/result entegrasyonu.

Çıkış kapısı:

- Her seviye için full new/review fast simulation bütün targetları ilk cycle'da bir kez görüyor.
- Herhangi bir review yanlışı zafer/event üretmiyor.
- Son doğru tek completion üretiyor.
- Speed monoton/capped/resetlenebilir.
- Missing VFX zaferi bozmuyor.

### Phase 5 — CI, export ve cihaz doğrulaması

İşler:

- Generator check ve host testlerini CI'a ekle.
- Unity EditMode/PlayMode testlerini çalıştır.
- Android AAR, iOS device ve simulator frameworkü aynı source/catalog revisiondan export et.
- Host/Unity manifest ve artifact revisionlarını doğrula.
- AAB/iOS archive boyut farkını ölç.

Çıkış kapısı:

- Bütün otomatik gate'ler başarılı.
- Android ve iOS gerçek cihaz smoke başarılı.
- Düşük cihaz FPS/RAM sonucu kabul bütçesinde.
- Rollback artifact seti hazır.

### Phase 6 — Rollout

- Internal build.
- Play internal testing ve TestFlight.
- Küçük production yüzdesi.
- Crash/ANR, launch error ve catalog mismatch kontrolü.
- Gate temizse kademeli genişletme.

## 10. Test matrisi

### 10.1 Generator

- 105 dosya üretiliyor.
- Her seviyede 21 dilin ID seti aynı.
- Output yalnız `id` ve `word` içeriyor.
- Aynı input aynı byte/hash üretiyor.
- Missing language/level, duplicate ID, boş word ve stale output fail ediyor.
- Aynı catalogVersion altında hash değişimi fail ediyor.

### 10.2 Host

- V4 session yalnız metadata ve learned IDs içeriyor.
- Learned/unlearned partition için host round üretmiyor.
- 1.424 ID 32 KiB iç ve 64 KiB hard limit altında.
- Duplicate, negative, unsafe veya unknown ID reddediliyor.
- Listener `openGame` öncesi kuruluyor ve `finished` sonrası kaldırılıyor.
- Duplicate/out-of-session `reviewCompleted` streak yan etkisi üretmiyor.
- Aynı gün ikinci victory `didIncrement=false` oluyor.

### 10.3 Unity EditMode

- Manifest version/hash ve selected catalog load.
- Native/target ID parity.
- Review/new intersection/difference.
- Bir ve iki targetlı mod.
- Duplicate target labels ve aynı native prompt distractorları.
- A1 898 ve B2 1.424 target ilk cycle uniqueness.
- Finite/looping deck.
- Unique-correct review completion.
- Speed curve ve reset.

### 10.4 Unity PlayMode/integration

- Üç target review: üç doğru → event → inferno → victory result.
- Son targettan önce yanlış → loss; event/VFX/streak yok.
- New deck cycle sonu zafer üretmiyor ve loop ediyor.
- Pause/resume speed'i koruyor.
- Retry ve Play Again state'i sıfırlıyor.
- Reduced motion full movement/VFX'i azaltıyor.
- Null inferno victory sonucunu bozmuyor.
- Catalog mismatch oyun yerine recoverable error gösteriyor.

### 10.5 Normal uygulama regresyonu

- Home/learning vocabulary sonuçları değişmiyor.
- Learned/unlearned, favorites, notifications, level progression ve Firestore sync korunuyor.
- Game launch normal vocabulary veya progress state'ine write yapmıyor.
- Review victory yalnız streak'i etkiliyor.
- Game error host öğrenme akışını kullanılabilir bırakıyor.

### 10.6 Cihaz matrisi

- Android düşük/orta sınıf gerçek cihaz release build.
- iOS gerçek cihaz release build; simulator yalnız function smoke.
- Light/dark.
- RTL.
- Çok byte'lı UTF-8 language pair.
- Offline.
- Background/foreground.
- Aynı gün iki review zaferi.
- B2 full learned ve B2 full new session preparation.
- Controlled catalog mismatch build.

## 11. Production bütçeleri

| Alan | Kabul kriteri |
| --- | --- |
| Session | ≤32 KiB CI bütçesi; ≤64 KiB native hard limit; silent trim yok |
| Catalog | 21×5 parity; deterministic version/hash |
| Runtime load | Yalnız seçili native + target catalog parse edilir |
| New mode | Her unlearned target ilk cycle'da tam bir kez |
| Review | Her learned target finite deck'te tam bir kez |
| Victory | Son benzersiz doğru targetta tek event/zafer |
| Streak | Aynı local günde en fazla bir artış |
| Speed | Base 9; monoton; theoretical cap 13.05; resetlenebilir |
| VFX | En fazla 2,4 sn; null asset business sonucu bozmaz |
| Frame | Referans düşük cihazda VFX sırasında uzun süre 45 FPS altına düşmez |
| Memory | Run sonrasında catalog/round referansları bırakılır; tekrar launchta sürekli büyüme yok |
| Bundle | AAB ve iOS archive before/after farkı release kaydında |
| İzolasyon | Normal learning/progress/favorites/notification/sync regresyonu yok |

## 12. Release ve rollback

### Release

- Host manifest, Unity catalog, Android AAR ve iOS XCFramework aynı catalog hashini taşır.
- İki platform artifacti aynı Unity source commitinden üretilir.
- Exporttan önce dirty binary/source değişiklikleri ayrıştırılır.
- Catalog değişikliği yeni store binary gerektirir.
- Mismatch game launchı fail-closed durdurur; Home ve learning çalışmaya devam eder.

### Rollback

- Host kodu, manifest, AAR ve XCFramework birlikte son bilinen iyi revisiona döndürülür.
- Yalnız bir platform artifacti veya yalnız host session schema geri alınmaz.
- Learned progress otomatik silinmez veya migrate edilmez.
- ID anlamı değişmişse oyun geçici kapatılır; tahmini ID eşleme yapılmaz.
- Store rollout durdurulur ve düzeltilmiş binary hazırlanır.

## 13. Riskler

| Risk | Önlem | Blocker |
| --- | --- | --- |
| Unity source/artifact belirsiz | Phase 0 provenance | Evet |
| Host/Unity schema mismatch | Shared V4 fixture ve aynı-release export | Evet |
| ID yeniden atanması | Stable ID source/lock ve generator validation | Evet |
| Host/Unity catalog ayrışması | Version/hash handshake | Evet |
| Ambiguous distractor | Native prompt ve target label collision filter | Evet |
| 105 catalog bundle artışı | Compact id+word ve gerçek artifact ölçümü | Bütçe aşılırsa |
| Uzun review run | Owner tarafından kabul edilmiş davranış; fast simulation + cihaz smoke | Hayır |
| Inferno lisans/performance | Asset gate ve düşük cihaz profiling | Evet |
| Duplicate completion | Active session + completion flag + daily streak idempotency | Evet |
| Normal app regresyonu | Game-only additive data path ve regression suite | Evet |

## 14. Definition of Done

Feature yalnız aşağıdakilerin tamamı sağlandığında production-ready olur:

- Otoriter Unity source commit bulunmuş ve iki platform artifactiyle eşleşiyor.
- Host/Unity aynı GameSession V4 fixture'ını kabul ediyor.
- Sessionda hiçbir word, prompt, choice veya round bulunmuyor.
- Host yalnız language pair, level, learned IDs ve küçük metadata gönderiyor.
- 105 compact catalog tek canonical kaynaktan deterministik üretiliyor.
- Stable IDs bütün dillerde ve catalog sürümlerinde korunuyor.
- Catalog version/hash mismatch oyunu güvenli biçimde durduruyor.
- Unity yalnız seçili iki catalogu load/parse ediyor.
- Learned/new partition bütün seviyelerde doğru.
- New mode bütün unlearned targetları ilk cycle'da bir kez sorup loop ediyor.
- Review mode bütün learned targetları bir kez sorup finite olarak bitiyor.
- Bir/iki targetlı havuzlar full-level distractorlarla çalışıyor.
- Gerçek dil collision fixture'larında tek doğru seçenek oluşuyor.
- Review yanlışı zafer/streak üretmiyor; son doğru tek victory üretiyor.
- `reviewCompleted` yalnız aktif session için bir kez streak çağrısı yapıyor.
- Speed gate ve trackte ortak, capped ve resetlenebilir.
- Inferno normal/reduced-motion yollarında çalışıyor; null fallback güvenli.
- Normal Home/learning/favorites/notifications/progress/sync testleri değişmeden geçiyor.
- AAB/iOS archive boyut, gerçek cihaz FPS/RAM ve platform smoke sonuçları kaydedilmiş.
- Rollback artifact seti ve staged rollout onayı hazır.

Bu kapılardan biri eksikse implementasyon tamamlanmış olabilir; production-ready değildir.
