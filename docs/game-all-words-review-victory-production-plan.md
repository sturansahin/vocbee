# VocBee Game — Tüm Kelimeler ve Review Zaferi Production Planı

Durum: **Aktif; Phase 0 kapıları tamamlanmadan implementasyon başlamaz**

Son güncelleme: 2026-09-04

Kapsam: React Native/Expo host, Android/iOS native Unity bridge ve Unity oyun runtime'ı

## 1. Production kararı

Bu belge oyun için tek kanonik uygulama, doğrulama, rollout ve rollback planıdır. Önceki tek
oturumda 805–1.424 kelimeyi hatasız tamamlama tasarımı production davranışı değildir.

Nihai ürün davranışı:

- **Yeni Kelimeler:** mevcut seviyedeki bütün geçerli öğrenilmemiş kelimeler ilk cycle'da birer
  kez sorulur; cycle bitince deste yeniden karıştırılarak devam eder.
- **Review:** campaign başlangıcındaki bütün geçerli learned ID'ler immutable snapshot olur.
- Review campaign, en fazla **30 hedeflik checkpoint**'lere ayrılır. Bu sayı target kırpma limiti
  değildir; bütün snapshot checkpoint'ler boyunca korunur.
- Bir checkpoint içindeki her hedef bir kez sorulur. Yanlış cevap mevcut checkpoint attempt'ini
  kaybettirir; daha önce tamamlanmış checkpoint'ler korunur.
- Son checkpoint hatasız tamamlandığında tek review zaferi, inferno sekansı ve günlük streak
  aksiyonu oluşur.
- Quit/crash/background sonrası tamamlanmış checkpoint'ler yerel olarak devam ettirilebilir.
- Campaign state Firestore'a eklenmez ve cihazlar arasında sync edilmez. Yeni cloud schema bu
  özellik için gerekli değildir.

Owner tek kesintisiz ve tek yanlışta bütün campaign'i sıfırlayan davranışta ısrar ederse release
kararı **No-Go** olur. B2 için teorik süre 71–237 dakika aralığındadır.

## 2. Doğrulanmış baseline ve Phase 0 blocker'ları

### 2.1 Host

- `src/features/game/domain/gameSession.ts` schema 3, hazır round payloadı ve 15/30 target
  kırpması kullanıyor.
- `src/features/game/composition/gameSession.ts` 64 KiB aşımında roundları sessizce azaltıyor.
- Native wrapper 64 KiB direct JSON sınırını Android/iOS öncesinde doğruluyor.
- `onGameEvent` API'si var; aktif game completion consumer'ı yok.
- `recordDailyStudyAction()` aynı yerel günde ikinci streak artışını engelliyor.
- Home zaten focus ve AppState `active` olduğunda streak summary'yi yeniliyor; yeni Home refresh
  mekanizması yazılmayacak.

### 2.2 Vocabulary

| Seviye | ID sayısı |
| --- | ---: |
| A1 | 898 |
| A2 | 867 |
| B1 | 805 |
| B2 | 1.424 |
| C1 | 1.298 |

- 21 dil × 5 seviye = 105 dosyanın ID kümeleri bugün birebir eşittir.
- Deterministik compact `{id, word}` çıktının toplamı 3.637.397 byte'tır.
- En büyük learned-ID sessionı UI metinleri hariç yaklaşık 6,4 KiB'dır; 32 KiB iç bütçe
  uygulanabilirdir.
- Mevcut `scripts/generateVocabulary.js`, ID'yi CSV satır numarasından üretir. Satır ekleme,
  silme veya sıralama mevcut progress ID'lerini başka kelimeye bağlayabilir.
- Aynı native promptun birden fazla doğru hedefi olabilir. Örneğin Türkçe B2'de `suçlamak`
  `accuse` ve `blame`; `ayrıca` ise `additionally`, `furthermore` ve `moreover` karşılığına gelir.

### 2.3 Unity ve artifact provenance

- Workspace'teki Android AAR ve iOS XCFramework Unity `6000.3.14f1` exportudur.
- Checked-in Android AAR, `unity-export/android` build outputuyla aynı SHA-256 değerine sahiptir.
- Host schema 3 üretirken mevcut export edilmiş Unity kodu schema 1 bekliyor ve kökte
  `contentState + rounds` okuyor.
- Mevcut exportta önceki planda geçen `RoundDeck` ve `VocbeeWorldSettings` yapıları yoktur;
  `VocbeeRunner` kendi schedule ve `trackSpeed` state'ini taşır.
- Önceki belgede adı geçen otoriter Unity source checkout bu workspace'te yoktur.

Sonuç: Phase 0'da otoriter Unity repo/commit bulunmadan, gerçek sınıf ve sahne yapısı
doğrulanmadan dosya bazlı Unity implementasyonu yapılmaz.

### 2.4 Inferno ve OTA

- Kullanılacak inferno asseti, GUID'i ve lisansı workspace'te yoktur.
- `expo-updates` dependency'si vardır ancak mevcut iOS configte updates disabled'dır; `app.json`
  içinde `runtimeVersion` veya `updates.url`, `eas.json` içinde update channel yoktur.
- Bu release OTA'yı etkinleştirmeyecek. EAS Update ayrı production programıdır; bu özelliğe sırf
  kill switch veya catalog transport için eklenmez.

## 3. Değişmez domain sözleşmeleri

### 3.1 Kelime kimliği

Kelime kimliği bütün katalog sürümlerinde:

```text
level + wordId
```

olur. `catalogVersion` identity'nin parçası değil, içerik/native compatibility bilgisidir.

Kurallar:

- Aynı `level + wordId` sonraki hiçbir catalogVersion'da başka kavrama atanamaz.
- Canonical vocabulary girdileri açık `id` alanı taşır; satır numarası ID değildir.
- ID silinecekse tombstone korunur veya explicit progress migration uygulanır.
- Duplicate, negatif, unsafe integer, eksik ID veya boş display label build'i durdurur.
- Tüm 21 dilde aynı seviyenin ID kümesi eşit olmalıdır.
- İçerik değiştiğinde `catalogVersion` artar; `vocabularySchemaVersion` yalnız storage shape
  değiştiğinde artar.
- AsyncStorage vocabulary cache'i `catalogVersion` mismatch'inde yeniden üretilir.

### 3.2 Snapshot partition

```text
validIds       = iki seçili dil catalogunda bulunan ve validasyondan geçen ortak ID'ler
reviewTargets  = campaign açılışındaki validIds ∩ learnedWordIds
newTargets     = validIds - learnedWordIds
```

- Review ve new target kümeleri ayrık, birleşimleri `validIds` olmalıdır.
- Campaign başladıktan sonra yeni öğrenilen kelimeler açık campaign'e eklenmez; bir sonraki
  campaign'de görünür.
- Progress reset, level değişimi, dil çifti değişimi veya catalog mismatch campaign'i temizler.
- Oyun Unity'den learned state, seviye veya normal vocabulary cache'i değiştiremez.

### 3.3 Az hedefli havuz

- Review/new havuzunda bir veya iki target bulunması modu kapatmaz.
- Distractorlar aynı seviyedeki tüm target-language catalogundan seçilebilir.
- Toplam catalogda üç ayırt edilebilir seçenek üretilemiyorsa yalnız ilgili mod placeholder olur.
- Distractor olarak kullanılan ID completion sayacına dahil edilmez.

### 3.4 Review campaign ve attempt

- `campaignId` bir campaign boyunca sabittir.
- `sessionId` her Unity launchında yenidir.
- `runId`, her checkpoint attempt'i için benzersizdir.
- Campaign target sırası oluşturulduğunda sabitlenir ve local campaign state'te saklanır.
- `nextTargetIndex`, yalnız checkpoint hatasız tamamlandığında ilerler.
- Quit veya loss durumunda yarım checkpoint ilerlemesi commit edilmez.
- Checkpoint retry current speed, score, combo, doğru-ID seti ve gate state'ini resetler.
- Final zafer campaign başına bir kez commit edilir.

### 3.5 Streak

- Yalnız final `reviewCompleted` günlük study action üretir.
- Checkpoint tamamlamak veya new mode oynamak bu kapsamda streak yazmaz.
- Completion eventinin timestamp'i kullanılır; event işleme zamanı kullanılmaz.
- `eventDay <= lastQualifiedDay` ise streak state geriye taşınmaz ve ikinci artış yapılmaz.
- Final event duplicate işlense bile sonuç aynıdır.

## 4. Contract'lar

### 4.1 GameSession V4

`bridgeVersion` transport değişmediği için 1 kalır. Session payload hazır round veya kelime metni
taşımaz.

```text
schemaVersion: 4
bridgeVersion: 1
vocabularySchemaVersion: 2
catalogVersion: positive safe integer
catalogHash: lowercase SHA-256
sessionId: UUID
campaignId: UUID
level: A1 | A2 | B1 | B2 | C1
nativeLanguage: supported language key
targetLanguage: supported language key
learnedWordIds: unique safe integer[]  # campaign sırası
reviewNextTargetIndex: integer
reviewCheckpointSize: 30
theme: light | dark
reducedMotion: boolean
uiLanguage/isRtl/uiText
```

Validasyon:

- Session JSON object ve UTF-8 olarak en fazla 64 KiB olmalıdır.
- CI fixture bütçesi 32 KiB'dır; aşım silent trim değil açık build/test hatasıdır.
- UUID, hash, level, dil, index sınırları ve duplicate ID'ler iki tarafta doğrulanır.
- `reviewNextTargetIndex`, `0..learnedWordIds.length` aralığında olmalıdır.
- Catalogda bulunmayan learned ID hostta reddedilir; Unity aynı kontrolü defense-in-depth olarak
  tekrarlar.
- `catalogVersion/hash`, gömülü Unity manifestiyle eşleşmeden mod seçimi açılmaz.

### 4.2 Catalog manifest

Tek generated manifest aşağıdaki bilgileri taşır:

```text
manifestSchemaVersion
catalogVersion
catalogHash
languages[]
levels[]
files[path] = { sha256, wordCount, byteLength }
```

- Dil, seviye ve kayıtlar sabit sırada gezilir.
- Display text değiştirilmeden minified canonical UTF-8 JSON yazılır.
- Property sırası generator tarafından sabittir: `id`, sonra `word`.
- `catalogHash`, version ve sıralı per-file metadata'dan üretilir; kendi hash alanını içermez.
- Unity yüklediği iki gerçek `TextAsset` byte'ının SHA-256 değerini per-file manifest hashleriyle
  karşılaştırır.
- Host manifesti ile Unity manifesti generatorün aynı çalıştırmasından çıkar.

### 4.3 Durable event envelope

Event schema, GameSession schema'dan bağımsızdır:

```text
eventVersion: 1
bridgeVersion: 1
type: reviewCheckpointCompleted | reviewCompleted | error | finished | ready
eventId: string
sessionId: UUID
campaignId: UUID
runId: string
seq: positive integer
completedAtEpochMs: safe integer
```

`reviewCheckpointCompleted` ayrıca cumulative `nextTargetIndex`; `reviewCompleted` toplam
`targetCount` taşır.

- Answer eventleri durable outbox'a yazılmaz.
- Checkpoint/final event native storage'a yazılmadan JS'e emit edilmez.
- Native outbox yalnız en yeni cumulative game progress eventini tutar.
- JS `getPendingGameEvent()` ile okur, validate/commit eder, sonra `ackGameEvent(eventId)` çağırır.
- Host aynı `eventId`, geriye giden `seq` veya geriye giden `nextTargetIndex` için yan etki üretmez.

## 5. Minimal modül sahipliği

### 5.1 Host

| Dosya/modül | Sorumluluk |
| --- | --- |
| `scripts/generateGameVocabulary.cjs` | Stable-ID validation, compact catalog ve manifest generation; `--check`, `--sync-unity` |
| `src/features/game/generated/catalog-manifest.json` | Generator çıktısı; host session compatibility bilgisi |
| `src/features/game/domain/gameSession.ts` | V4 type, saf validator ve payload bütçesi |
| `src/features/game/domain/reviewCampaign.ts` | Campaign create/resume/advance/invalidate saf kuralları |
| `src/features/game/data/reviewCampaignStore.ts` | Tek AsyncStorage campaign kaydı ve son processed event ID |
| `src/features/game/composition/gameSession.ts` | Read-only level/language/learned snapshot ve launch |
| `src/features/game/composition/gameEventCoordinator.ts` | Native pending/live event consume, campaign/streak commit ve ack |
| `modules/vocbee-unity/index.ts` | Typed native bridge ve pending-event API |

Tek implementasyon için interface/factory katmanı eklenmez. Campaign store yalnız ikinci storage
implementasyonu gerektiğinde interface'e ayrılır.

### 5.2 Android/iOS native bridge

Mevcut Kotlin/Swift modülleri içinde:

- checkpoint/final event JSON'unu platform storage'a atomik yaz;
- `getPendingGameEvent` ve `ackGameEvent` ekle;
- `reviewCompleted` ve checkpoint eventlerinde Unity'yi kapatma;
- yalnız `finished` terminal eventinde mevcut unload davranışını koru;
- malformed JSON'u persist etme ve typed error üret.

Yeni native transport sınıfı ancak mevcut modül dosyası okunamaz büyüklüğe gelirse çıkarılır.

### 5.3 Unity

Phase 0'da bulunan gerçek source yapısı esas alınır. Minimum sorumluluk ayrımı:

| Modül | Sorumluluk |
| --- | --- |
| `GameSession.cs` | V4 parse ve trust-boundary validation |
| `GameVocabularyCatalog.cs` | Manifest + seçili iki catalog load/hash/parse/unload |
| `GameRoundFactory.cs` | Partition, current target ve güvenli distractor üretimi |
| Mevcut deck/schedule sınıfı | Looping new ve checkpoint-bounded finite review |
| `HostBridge.cs` | Event envelope, seq ve native emit |
| `VocbeeRunner.cs` | Attempt state, speed, checkpoint/final transition ve result UI |

VFX için ayrı class başlangıçta eklenmez. Asset basit Particle System/Animator ile yönetilemiyorsa
o zaman tek `ReviewCompletionVfx` componenti çıkarılır.

## 6. Unity runtime kuralları

### 6.1 Catalog load

1. Session contract doğrulanır.
2. Embedded manifest version/hash session ile karşılaştırılır.
3. Yalnız `{nativeLanguage}_{level}` ve `{targetLanguage}_{level}` TextAssetleri yüklenir.
4. Gerçek asset byte hashleri manifest per-file hashleriyle karşılaştırılır.
5. Her iki catalog parse edilir ve ID parity doğrulanır.
6. `TextAsset`ler parse sonrası `Resources.UnloadAsset` ile bırakılır; parsed dictionary'ler run
   boyunca tutulur.
7. Hata durumunda recoverable game error gösterilir; host learning state değişmez.

`Resources` ilk release için yeterlidir. Addressables, remote catalog, cache file transport veya
AssetBundle eklenmez. Gerçek AAB/IPA boyutu ya da startup profili bütçeyi aşarsa ayrı optimizasyon
kararı alınır.

### 6.2 Round üretimi

- Roundlar bütün campaign için upfront materialize edilmez; current target için gerektiğinde
  üretilir.
- Target sırası sessiondaki learned ID sırasıdır.
- New mode target sırası catalog partitionından Fisher–Yates ile üretilir.
- Correct lane dengeli dağıtılır; aynı seed aynı test fixture'ında aynı sonucu verir.
- Candidate şu koşulların tamamını sağlamalıdır:

```text
candidate.id != target.id
normalize(targetWord(candidate)) != normalize(targetWord(target))
normalize(nativeWord(candidate)) != normalize(nativeWord(target))
```

- Üç choice ID'si ve üç normalized display label benzersizdir.
- Exactly one choice `correctWordId` taşır.
- Unicode normalization `NFKC + invariant case` olarak tek helper'da uygulanır ve gerçek 21-dil
  collision fixture'larıyla test edilir.

### 6.3 Review state machine

```text
Ready
  -> Playing
       -> wrong -> LossResult -> retry same checkpoint | exit
       -> correct, target kaldı -> Playing
       -> correct, checkpoint sonu -> CheckpointCommit
            -> campaign kaldı -> next checkpoint / Playing
            -> campaign bitti -> VictoryCelebration -> VictoryResult
```

- State transition tek metotta sahiplenilir.
- Input, gate spawn ve collision `CheckpointCommit/VictoryCelebration` sırasında kapalıdır.
- Checkpoint/final event bir attempt içinde bir kez oluşturulur.
- Durable event emit, VFX ve ses başlamadan önce yapılır; görsel hata business completion'ı
  engellemez.

### 6.4 Hız

`Time.timeScale` değişmez. Gate ve pist aynı mutable world speed'i kullanır:

```text
speed(correctCount) = baseSpeed * (1 + 0.45 * (1 - exp(-correctCount / 20)))
```

- Default `baseSpeed=9`, theoretical cap `13.05`.
- Inspector'da yalnız `baseSpeed`, `maxMultiplier` ve `curveAnswers` tuning alanları bulunur.
- Checkpoint retry/next checkpoint/yeni run hızını base değere döndürür.
- Pause/resume current attempt hızını korur.
- Reduced motion kamera shake, zoom ve yoğun particle hareketini kapatır; gameplay speed kuralı
  korunur.

### 6.5 Inferno

Phase 0'da doğrulanması zorunlu bilgiler:

- Asset path ve GUID
- Prefab/Particle System/VFX Graph/Animator/sprite tipi
- URP 17.3 ve Unity `6000.3.14f1` uyumluluğu
- Android/iOS shader ve material sonucu
- Ticari lisans ve attribution şartı

Entegrasyon:

- Prefab scene serialized reference ile build'e girer; ayrıca `Resources/VFX` altına konmaz.
- Null/broken prefab zaferi veya streak'i engellemez.
- Normal motion tek seferlik en fazla 2,4 saniye oynar.
- Reduced motion statik sıcak glow/fade kullanır; camera shake yoktur.
- Pool yalnız profil instantiate spike gösterirse eklenir.

## 7. Uygulama phase'leri

### Phase 0 — Source ve ürün kilidi

İşler:

- Otoriter Unity repo, branch ve commit bulunur.
- Android/iOS artifactlerin hangi Unity commitinden üretildiği kaydedilir.
- Host schema 3 ile checked-in Unity schema 1 mismatch'i reproduce edilir.
- Review checkpoint davranışı owner tarafından kabul edilir.
- Inferno asset ve lisans sağlanır.
- Release v1 için OTA disabled kararı teyit edilir.

Çıkış kapısı:

- Unity source build açılıyor; scene ve scriptler okunabiliyor.
- Android/iOS için aynı source revision kullanılacağı kanıtlı.
- Product contract ve asset bilgileri eksiksiz.

### Phase 1 — Stable ID ve catalog pipeline

İşler:

- Canonical CSV/source formatına açık immutable ID ekle.
- Mevcut 105 dosyayı ID kaybetmeden migrate et.
- Generator, manifest, per-file/global hash ve cache catalogVersion invalidation ekle.
- `vocabulary:game:generate`, `vocabulary:game:check`, `vocabulary:game:sync` scriptlerini ekle.

Çıkış kapısı:

- 21 × 5 ID parity ve word count testleri geçiyor.
- Aynı input byte-for-byte aynı çıktı/hash üretiyor.
- Satır reorder, ID reassignment, stale output ve aynı versionda content drift fail ediyor.
- Normal vocabulary cache catalogVersion değişiminde yenileniyor.

### Phase 2 — Host V4 ve review campaign

İşler:

- GameSession V4 validator ve payload üretimi.
- Review campaign saf domain kuralları ve local store.
- Progress reset/logout clear listesine campaign key'i ekle.
- Silent trim ve host round factory'yi kaldır.

Çıkış kapısı:

- Bütün seviyelerde partition property testleri geçiyor.
- Max B2 fixture 32 KiB iç, 64 KiB hard limit altında.
- Campaign create/resume/checkpoint advance/invalidate testleri geçiyor.
- Home/learning/favorites/notification/sync state'i launch sırasında değişmiyor.

### Phase 3 — Unity catalog ve gameplay

İşler:

- V4 parse, manifest ve selected catalog validation.
- On-demand round factory ve collision-safe distractor seçimi.
- Looping new mode ve checkpoint review state machine.
- Retry/quit/resume state resetleri.

Çıkış kapısı:

- Unity EditMode full A1–C1 simulationı her targetı bir kez görüyor.
- Bir/iki target senaryosu geçiyor.
- 21-dil prompt collision fixture'larında ambiguous choice üretilmiyor.
- Catalog mismatch/bozuk asset/unknown ID recoverable error üretiyor.

### Phase 4 — Durable event ve streak

İşler:

- Kotlin/Swift one-slot cumulative outbox.
- Typed JS pending-event API ve coordinator.
- Timestamp tabanlı, out-of-order güvenli streak root-cause düzeltmesi.
- Campaign progress ve final completion idempotency.

Çıkış kapısı:

- Emit sonrası JS listener yokken event yeniden açılışta tüketiliyor.
- Commit öncesi/sonrası process interruption testleri veri kaybetmiyor veya iki kez işlemiyor.
- Aynı gün duplicate final streak artırmıyor.
- Gecikmiş eski event streak gününü geriye almıyor.

### Phase 5 — Speed, inferno ve accessibility

İşler:

- Mutable world speed ve reset kuralları.
- Inferno + victory HUD/ses entegrasyonu.
- Reduced-motion fallback.

Çıkış kapısı:

- Eğri monoton, capped ve attempt başında resetleniyor.
- Missing VFX ile zafer/event tamamlanıyor.
- Düşük cihazda CPU/GPU frame ve memory bütçesi geçiyor.

### Phase 6 — Export ve release gates

İşler:

- Android AAR, iOS device ve simulator framework aynı Unity commit/catalogdan export edilir.
- Tek `modules/vocbee-unity/unity-build-manifest.json` source commit, Unity version, schema,
  catalog hash ve platform artifact SHA-256 değerlerini taşır.
- Host/native/Unity shared fixture integration testi çalışır.
- Gerçek AAB ve IPA/archive boyut farkı kaydedilir.

Çıkış kapısı:

- Platform artifact revisionları ve catalog hash eşit.
- Bütün CI/release komutları başarılı.
- İki gerçek cihaz smoke ve lifecycle matrix'i başarılı.

### Phase 7 — Rollout

- Internal build → TestFlight/Play internal → küçük production yüzdesi → kontrollü artış.
- Her basamakta store crash/ANR, game launch failure, catalog mismatch ve device smoke izlenir.
- Gate aşımı varsa rollout durdurulur; sonraki yüzde açılmaz.

## 8. Test ve quality gate matrisi

### Host PR gate

```bash
npm run vocabulary:game:check
npm run typecheck:all
npm run lint
npm run prettier:check
npm run test:boundaries
npm run test:ci
git diff --check
```

Hedefli testler:

- Session V4 validation ve UTF-8 byte budget
- Stable-ID/catalog generator
- Review campaign reducer
- Durable event coordinator
- Streak same-day, midnight ve out-of-order
- Existing Home/game launch regressions

### Unity PR gate

- Catalog parse/hash/parity
- Partition ve distractor collision corpus
- Finite checkpoint ve looping new deck
- 805–1.424 target fast simulation; gerçek zamanlı gate beklenmez
- Duplicate completion transition
- Speed curve/reset
- Missing/broken VFX fallback

### Release/device gate

En az:

- Android düşük ve orta sınıf gerçek cihaz, release AAB tabanlı build
- iOS gerçek cihaz release; simulator yalnız contract/smoke
- Light/dark, RTL ve uzun label dili
- Offline launch
- Background/foreground, kill/relaunch ve checkpoint resume
- Aynı gün iki final victory ve midnight boundary
- Art arda 10 Unity aç/unload döngüsünde bellek/çökme kontrolü
- Catalog mismatch negatif build

## 9. Ölçülebilir bütçeler

| Alan | Production kapısı |
| --- | --- |
| Session | CI fixture ≤32 KiB; native hard limit ≤64 KiB; silent trim yok |
| Catalog | 21 × 5 parity; selected asset runtime SHA-256 doğrulaması |
| Campaign | Her snapshot ID final victory öncesi tam bir kez committed target olur |
| Checkpoint | En fazla 30 target; loss yalnız current checkpoint'i resetler |
| Event | At-least-once delivery + idempotent commit/ack |
| Streak | Aynı local günde en fazla bir artış; geçmiş event state'i geriye taşımaz |
| Speed | 9 başlangıç, monoton artış, 13.05 theoretical cap |
| VFX | 2,4 sn'den uzun loop yok; null asset business sonucu bozmaz |
| Frame | Referans düşük cihazda VFX boyunca p95 frame ≤22,2 ms; 50 ms üstü spike araştırılır |
| Memory | 10 launch/unload sonunda sürekli büyüyen managed/native memory yok |
| Bundle | AAB ve IPA before/after farkı release kaydında; tahmini gzip kabul edilmez |
| İzolasyon | Normal learning/progress/favorites/notification/sync regresyonu yok |

## 10. Release ve rollback

### Release

- Catalog source, host manifest, Unity manifest ve iki platform artifacti aynı release commitinde
  pinlenir.
- Export öncesi dirty binary/source değişiklikleri ayrıştırılır; mevcut user değişiklikleri
  ezilmez.
- Release v1 OTA kullanmaz. Catalog değişikliği yeni store binary gerektirir.
- Runtime catalog mismatch oyunu fail-closed kapatır; Home ve learning kullanılabilir kalır.

### Rollback

- Rollback bir önceki bilinen iyi host + Android AAR + iOS XCFramework + catalog setine birlikte
  yapılır.
- Tek platform artifacti veya yalnız host JS geri alınmaz.
- Campaign state yeni catalogla uyuşmuyorsa temizlenir; normal learned progress silinmez.
- Streak veya learned progress otomatik geriye alınmaz.
- Store staged rollout durdurulur; eski binary desteklenmeye devam eder.

## 11. Production risk register

| Risk | Önlem | Release durdurur mu? |
| --- | --- | --- |
| Otoriter Unity source bulunamıyor | Phase 0 provenance | Evet |
| Host/Unity schema mismatch | Shared fixture + artifact manifest | Evet |
| ID başka kelimeye atanıyor | Explicit immutable ID + generator lock | Evet |
| Cached vocabulary stale | CatalogVersion cache invalidation | Evet |
| Ambiguous distractor | Native ve target label collision filter | Evet |
| Completion event kaybı | Native durable outbox + ack | Evet |
| Duplicate/gecikmiş streak | Event ID, cumulative index, timestamp guard | Evet |
| Çok uzun review | 30-target resumable checkpoint | Evet |
| Inferno lisans/uyumluluk eksik | Phase 0 asset gate | Evet |
| Unity as a Library memory baskısı | 10-cycle device profiling | Evet |
| Resources startup/bundle büyümesi | Gerçek artifact ölçümü; gerekirse sonraki optimizasyon | Bütçe aşılırsa |
| Normal app regresyonu | Additive game-only store ve existing regression suite | Evet |

## 12. Definition of Done

Feature ancak aşağıdakilerin tamamı kanıtlandığında production-ready olur:

- Otoriter Unity source commit ile Android/iOS artifact provenance eşleşiyor.
- Host ve Unity aynı V4 fixture'ını kabul ediyor; eski/bozuk schema'yı reddediyor.
- Stable IDs satır sırasından bağımsız ve sonraki catalogda reassignment yapılamıyor.
- Compact cataloglar deterministik; 105 dosya parity/hash/check testlerinden geçiyor.
- AsyncStorage vocabulary cache catalogVersion değişiminde yenileniyor.
- New mode bütün unlearned targetları ilk cycle'da bir kez soruyor ve sonra loop ediyor.
- Review campaign bütün learned snapshotı 30-target checkpoint'lerde tamamlıyor ve resume ediyor.
- Prompt/answer collision içeren gerçek dil fixture'larında tek doğru seçenek üretiliyor.
- Wrong yalnız current checkpoint'i kaybettiriyor; final victory yalnız bütün campaign bitince oluşuyor.
- Native outbox process/lifecycle kesintilerinde checkpoint/final eventi koruyor.
- Campaign ve streak handler duplicate/out-of-order eventlerde idempotent.
- Final victory aynı gün en fazla bir streak artışı üretiyor.
- Speed eğrisi capped/resetlenebilir ve gate/pist aynı değeri kullanıyor.
- Inferno lisansı, URP/mobil sonucu ve reduced-motion fallback doğrulanmış.
- Missing VFX veya catalog error normal learning verisini değiştirmiyor.
- AAB/IPA boyut, FPS ve 10-cycle memory sonuçları release kaydında.
- Host CI, Unity EditMode/PlayMode, Android/iOS integration ve gerçek cihaz smoke başarılı.
- Rollout yüzdesini artıracak açık owner onayı ve rollback artifact seti hazır.

Bu maddelerden biri eksikse çalışma “implementasyon tamamlandı” olabilir; **production-ready değildir**.
