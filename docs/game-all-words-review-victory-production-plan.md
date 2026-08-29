# Tüm Kelimeler, Review Zaferi, Inferno Bitişi ve Kademeli Hızlanma

## Production uygulama planı

Durum: Analiz ve implementasyon tasarımı, Unity'ye gömülü kompakt kelime kataloğu yaklaşımına göre güncellenmiştir. Bu belge kapsamında kaynak kod değişikliği yapılmamıştır.

İlgili projeler:

- React Native/Expo host: `/Users/turan/Desktop/vocbee`
- Unity oyun: `/Users/turan/vocbee-game-2026-07-28_17-23-42`
- İncelenen Unity sürümü: `6000.3.14f1`
- Aktif Unity sahnesi: `Assets/VocBee/Scenes/VocbeeRunner.unity`

## 1. İstenen davranış

Oyun başlangıcındaki iki mod aşağıdaki kurallarla çalışmalıdır:

1. **Yeni Kelimeler** seçildiğinde, mevcut seviyedeki geçerli öğrenilmemiş kelimelerin tamamı ilk oyun destesine alınmalıdır.
2. **Öğrenilmiş Kelimeler** seçildiğinde, mevcut seviyedeki geçerli öğrenilmiş kelimelerin tamamı ilk oyun destesine alınmalıdır.
3. Review modunda oyuncu, oturum açılırken belirlenen öğrenilmiş kelimelerin her birini bir kez ve hatasız bilirse oyunu kazanmalıdır.
4. Review zaferinde `inferno` asseti kullanılarak alev animasyonlu bir bitiş oynatılmalıdır.
5. Review zaferi günlük streak için nitelikli bir çalışma aksiyonu sayılmalıdır.
6. Her doğru cevap dünya/kapı akışını kontrollü biçimde biraz hızlandırmalıdır.
7. Değişiklikler normal kelime öğrenme, favoriler, bildirimler, seviye ilerlemesi ve senkronizasyon akışlarından izole edilmelidir.

## 2. Mevcut sistemde doğrulanan durum

### 2.1 Kelime hazırlama

React Native tarafındaki `src/features/game/domain/gameSession.ts`:

- Kelimeleri öğrenilmiş ve öğrenilmemiş olarak iki ayrı havuza ayırıyor.
- Her hedef için bir doğru ve iki yanlış seçenek hazırlıyor.
- Yeni kelimeleri varsayılan olarak en fazla **15** turla sınırlıyor.
- Öğrenilmiş kelimeleri varsayılan olarak en fazla **30** turla sınırlıyor.
- Bir modda üçten az uygun hedef varsa modu `placeholder` yapıyor.
- Yanlış seçenekleri yalnızca aynı modun hedef havuzundan seçiyor.

`src/features/game/composition/gameSession.ts` ise oluşan JSON 64 KiB'ı aşarsa tur sayılarını daha da azaltıyor.

### 2.2 Gerçek sözlük boyutları

Assetler üzerinde yapılan ölçüm:

| Seviye | Kelime sayısı |
| --- | ---: |
| A1 | 898 |
| A2 | 867 |
| B1 | 805 |
| B2 | 1.424 |
| C1 | 1.298 |

Gerçek dil çiftleriyle tüm kelimelerin mevcut üç seçenekli tur yapısında bridge üzerinden gönderilmesi ölçüldüğünde:

- İngilizce–Türkçe A1 review paketi yaklaşık **163 KiB**.
- İngilizce–Türkçe B2 review paketi yaklaşık **272 KiB**.
- Mevcut 21 dil arasındaki ölçülen en büyük tek-mod paket yaklaşık **419 KiB** (`B2`, hedef Tayca, ana dil Çince).

Unity'nin oyun sırasında ihtiyaç duyduğu veri yalnızca `id + word` alanlarına indirildiğinde yapılan ölçüm:

| İçerik | Boyut |
| --- | ---: |
| 105 tam vocabulary asseti | 28.300.619 byte |
| 105 kompakt `id + word` oyun kataloğu | 3.637.397 byte |
| Kompakt katalogların referans gzip toplamı | 896.690 byte |

Unity build sıkıştırması gzip ile birebir aynı değildir; 896.690 byte yalnızca sıkıştırılabilirlik göstergesidir. Production bundle etkisi Android AAB ve iOS archive üzerinde ayrıca ölçülmelidir.

Sonuç: Sadece `NEW_WORD_ROUND_LIMIT` ve `REVIEW_ROUND_LIMIT` sabitlerini kaldırmak production çözümü değildir. Tercih edilen çözüm, büyük hazır turları bridge üzerinden göndermek yerine Unity'ye kompakt katalogları gömmek ve hosttan yalnızca seviye, dil çifti, öğrenilmiş ID'ler ve katalog uyumluluk bilgisini göndermektir.

### 2.3 Unity oyun döngüsü

Unity tarafında:

- `RoundDeck.Next()` destenin sonuna gelince otomatik olarak yeniden karıştırıyor ve sonsuza kadar devam ediyor.
- Bu nedenle şu anda “bütün review kelimeleri tamamlandı” durumu oluşmuyor.
- Yanlış cevap koşuyu hemen sonuç ekranına taşıyor ve bir kalp düşürüyor.
- Doğru cevap skor ve combo artırıyor; koşuyu bitirmiyor.
- Dünya hızı `VocbeeWorldSettings.TrackSpeed` içinde değişmez olarak tutuluyor. Sahnedeki başlangıç değeri `9`.
- Hem kapı ilerlemesi hem pist hareketi aynı sabit hızı kullanıyor.
- Unity yalnızca kullanıcı oyundan çıktığında `finished`/`quit` eventi gönderiyor.

### 2.4 Host event ve streak durumu

- Native modül Unity eventlerini `onGameEvent` üzerinden JavaScript'e aktarabiliyor.
- `modules/vocbee-unity/index.ts` bir `onGameEvent` abonelik API'si sunuyor.
- Uygulama tarafında oyun cevaplarını veya tamamlanma eventini işleyen aktif bir consumer bulunmuyor.
- Mevcut streak, takvim günü esaslıdır. `recordDailyStudyAction()` aynı gün içinde yalnızca ilk nitelikli aksiyonda streak'i artırır.
- Streak yazımı AsyncStorage'a kaydedilir ve senkronizasyon için unsynced işareti oluşturur.

Bu günlük semantik korunmalıdır. Aynı gün tekrar tekrar review kazanarak streak'i sınırsız artırmak mevcut ürün modelini bozar.

### 2.5 `inferno` asset doğrulaması

Unity Asset Database ve Unity projesinin `Assets/` dizini `inferno` adına göre tarandı; eşleşen asset bulunamadı. Desktop, Downloads ve Documents altındaki erişilebilir konumlarda da aynı adla bir dosya bulunamadı.

Bu nedenle implementasyona başlanmadan önce assetin şu bilgileri kesinleştirilmelidir:

- Gerçek asset yolu ve GUID'i
- Asset türü: prefab, Particle System, VFX Graph, Animator veya sprite sheet
- Kullanılan shader/materiallar
- URP 17.3 ve mobil iOS/Android uyumluluğu
- Ticari kullanım/lisans durumu

Asset bir paket içindeki alt öğeyse, oyunda kullanılacak görsel `ReviewCompletionInferno.prefab` adında tek bir sarmalayıcı prefaba dönüştürülmelidir.

### 2.6 Normal uygulama akışı ve OTA durumu

Normal kelime öğrenme akışı şu anda React Native tarafındaki tam vocabulary assetlerini, `DefaultVocabularyService`, AsyncStorage seviye anahtarlarını ve progress servislerini kullanır. Unity oyunu bu akışın consumer'ıdır; otoritesi değildir.

İzolasyon için:

- React Native tam vocabulary dosyaları yerinde kalır.
- Cümle, telaffuz ve native sentence alanları Unity kataloğuna taşınmaz.
- Unity kompakt katalogları uygulama açılışında yüklenmez; yalnızca oyun açılırken seçili iki dil ve seviye yüklenir.
- Review zaferi yalnızca mevcut günlük streak aksiyonunu tetikler; learned word, seviye veya son kelime state'ini değiştirmez.

Projede `expo-updates` bağımlılığı bulunuyor ancak `app.json` içinde açık bir `runtimeVersion` politikası görünmüyor. Unity kataloğu native binary'ye gömülü olacağı için katalog değiştiren bir OTA'nın eski Unity binary'sine ulaşması production uyumsuzluğu yaratabilir. Yayın tasarımında bu durum zorunlu bir kapıyla engellenmelidir.

## 3. Kesin ürün kuralları

Belirsizliği önlemek için implementasyon aşağıdaki kuralları esas almalıdır.

### 3.1 “Hepsi” tanımı

“Hepsi”, oyun oturumu hazırlanırken mevcut seviyede bulunan, validasyondan geçen kelimelerin snapshot'ıdır.

- `reviewTargets = validVocabularyIds ∩ learnedWordIds`
- `newTargets = validVocabularyIds - learnedWordIds`
- İki hedef kümesi ayrık olmalıdır.
- Birleşimleri geçerli kelime kümesine eşit olmalıdır.
- Oturum açıldıktan sonra başka bir ekranda oluşan ilerleme değişikliği açık Unity oturumunu değiştirmez. Yeni snapshot için oyun yeniden açılır.

### 3.2 Review zaferi

Review modu tek geçişli ve sonludur:

- Her review hedefi ilk cycle içinde tam bir kez sorulur.
- Yanlış cevap mevcut davranıştaki gibi koşuyu kaybettirir; zafer ve streak ödülü verilmez.
- Son benzersiz review hedefi de doğru cevaplandığında zafer tetiklenir.
- Aynı turun veya eventin tekrar işlenmesi zaferi ikinci kez tetikleyemez.
- “Play Again” yeni bir run başlatır; aynı günlük streak ikinci kez artırılmaz.

### 3.3 Yeni kelime modu

- İlk cycle bütün öğrenilmemiş hedefleri tam bir kez içerir.
- Bu istek yeni kelime modu için ayrıca bir zafer koşulu tanımlamadığından mevcut sonsuz koşu davranışı korunur.
- İlk cycle bittikten sonra deste yeniden karıştırılarak devam eder.
- Bu modun doğru cevapları bu değişiklik kapsamında kelimeyi otomatik olarak “öğrenildi” yapmaz.

### 3.4 Az kelimeli havuzlar

Hedef havuzunda bir veya iki kelime bulunması modu kapatmamalıdır.

- Hedefler seçili modun havuzundan gelir.
- Yanlış seçenekler, mevcut seviyedeki tüm geçerli sözlükten seçilebilir.
- Yanlış seçenek olarak kullanılan kelime hedef tamamlanma sayacına dahil edilmez.
- Toplam geçerli sözlükte üç ayırt edilebilir seçenek yoksa ilgili mod `placeholder` olur.

Bu karar, “bir öğrenilmiş kelimem var ama review açılamıyor” hatasını önler.

### 3.5 Streak ödülü

Review zaferi `recordDailyStudyAction()` çağırır:

- Kullanıcı o gün henüz nitelikli çalışma yapmadıysa streak artar.
- O gün streak zaten tamamlandıysa `didIncrement=false` olur; zafer yine geçerlidir ancak ikinci artış yapılmaz.
- Arka arkaya günlerde review zaferleri mevcut kurala göre streak'i sürdürür.
- İki günden uzun ara varsa mevcut streak domain kuralı uygulanır; oyun özel bir bypass yapmaz.

### 3.6 Katalog otoritesi ve ID kararlılığı

Vocabulary'nin tek kaynağı mevcut dil/seviye üretim girdileri olmalıdır. React Native ve Unity katalogları elle ayrı ayrı düzenlenmemelidir.

Bir kelimenin güvenli kimliği:

```text
catalogVersion + level + wordId
```

Kurallar:

- Aynı katalog sürümünde bir ID başka kelimeye yeniden atanamaz.
- Bir seviyedeki ID, başka seviyedeki aynı sayısal ID ile global olarak aynı kabul edilemez.
- Katalog içeriği veya ID eşlemesi değiştiğinde `catalogVersion` artırılır.
- Tüm dillerde aynı seviyenin ID kümesi birebir eşit olmalıdır.
- Duplicate, negatif, güvenli integer olmayan veya boş label içeren kayıt build'i durdurmalıdır.
- Host ve Unity aynı deterministik üretimden çıkan `catalogHash` değerini taşımalıdır.

### 3.7 Normal akış izolasyonu

Bu çalışma kapsamında aşağıdakilerin davranışı değiştirilmemelidir:

- Home kelime kartları ve swipe akışı
- Kelimeyi learned olarak işaretleme
- Cümle ve telaffuz gösterimi
- Favoriler
- Bildirim içerikleri ve zamanlaması
- Seviye ilerlemesi
- Firestore/AsyncStorage senkronizasyon modeli
- Uygulama başlangıç süresi

Unity review zaferi learned ID listesine toplu yazım yapmamalı ve seviye atlatmamalıdır. Game event consumer yalnızca streak ve oyun sonucu için gerekli bounded/idempotent state'i değiştirebilir.

## 4. Önerilen production mimarisi

### 4.1 Session ve bridge sözleşmesi

Aşağıdaki sözleşme uygulanmalıdır:

- `GameSessionV3` → `GameSessionV4`
- `schemaVersion: 3` → `4`
- Taşıma mekanizması değişmediği için `bridgeVersion: 1` korunur.
- Vocabulary storage schema değişmediği sürece `vocabularySchemaVersion: 2` korunur.
- Unity oyun kataloğu için immutable `catalogVersion` ve `catalogHash` eklenir.

Host Unity'ye hazır round veya kelime metni göndermez. Önerilen session payload:

```text
schemaVersion: 4
bridgeVersion: 1
vocabularySchemaVersion: 2
catalogVersion: positive integer
catalogHash: lowercase SHA-256
sessionId: UUID
level: A1 | A2 | B1 | B2 | C1
nativeLanguage: supported language key
targetLanguage: supported language key
learnedWordIds: unique safe integer[]
theme/reducedMotion/uiLanguage/isRtl/uiText
```

“Yalnızca kelime ID'leri ve dil çifti” yaklaşımı veri hacmi açısından doğrudur; ancak literal olarak bu iki alan production sözleşmesi için yeterli değildir. ID'ler seviye kapsamında yorumlandığı için `level`, gömülü native assetin doğrulanması için `catalogVersion/catalogHash`, event korelasyonu ve idempotency için `sessionId` zorunlu minimum metadata olarak kalmalıdır. Bunlar kelime metni veya round taşımadığından payload avantajını bozmaz.

Kurallar:

- `learnedWordIds` yalnızca mevcut seviyeyi temsil eder.
- ID listesi duplicate, negatif veya unsafe integer içeremez.
- Unity, sessiondaki katalog version/hash değerini gömülü manifest ile eşleştirmeden oyun menüsünü aktif etmez.
- Aynı version altında hash uyuşmazlığı data/package corruption sayılır ve fail-closed sonuç üretir.
- 1.424 ID ve mevcut UI metinleriyle payload 64 KiB sınırının altında kalmalıdır; CI en büyük fixture için ayrıca **32 KiB iç bütçe** uygular.
- `openGame(sessionJson)` ve native direct JSON taşıması korunur; dosya/cache transport eklenmez.

### 4.2 Tek kaynaktan kompakt katalog üretimi

Kompakt Unity katalogları mevcut vocabulary üretim kaynağından deterministik oluşturulmalıdır. Elle kopyalama veya iki projede ayrı içerik düzenleme yasaktır.

Her Unity kayıt şekli:

```json
{ "id": 1, "word": "house" }
```

Cümle, telaffuz ve native sentence alanları Unity çıktısına dahil edilmez.

Önerilen generator:

- `scripts/generateGameVocabulary.cjs`
- Girdi: `assets/vocabulary/{language}_{level}.txt`
- Unity çıktı: `Assets/VocBee/Resources/Vocabulary/{language}_{level}.bytes`
- Unity manifest: `Assets/VocBee/Resources/Vocabulary/catalog-manifest.json`
- Host manifest: `src/features/game/generated/gameVocabularyManifest.ts`

Generator sırası:

```text
Dil ve seviyeleri sabit sırada gez
  -> kayıtları id sırasına koy
  -> id + word dışındaki alanları çıkar
  -> bütün dil/seviye ID kümelerini doğrula
  -> canonical UTF-8 JSON üret
  -> dosya SHA-256'larını üret
  -> canonical manifestten global catalogHash üret
  -> host ve Unity manifestlerini aynı değerlerle yaz
```

Build şu durumlarda başarısız olmalıdır:

- Bir seviyede desteklenen dillerin ID kümeleri farklıysa
- Duplicate/geçersiz ID veya boş kelime varsa
- Beklenen 21 dil veya 5 seviyeden biri eksikse
- Checked-in Unity çıktısı generator `--check` sonucuna göre stale ise
- Aynı `catalogVersion` altında canonical hash değişmişse

Host ve Unity ayrı repolarda bulunduğu için generator iki mod desteklemelidir:

- `--check`: Host kaynağı ve manifestini her CI ortamında doğrular.
- `--sync-unity <project-root>`: Release hazırlığında doğrulanmış çıktıyı Unity projesine yazar ve Unity manifestini kontrol eder.

`catalogVersion` generator tarafından otomatik tahmin edilmemelidir; bilinçli release kararı olarak artırılmalıdır.

### 4.3 Unity katalog yükleme ve round üretimi

Unity sessionı aldıktan sonra yalnızca seçili iki dosyayı yükler:

```text
Vocabulary/{targetLanguage}_{level}
Vocabulary/{nativeLanguage}_{level}
```

Önerilen loader `Resources.Load<TextAsset>` ile iki ayrı `.bytes` assetini açar. Tüm 105 katalog belleğe alınmaz.

Yükleme akışı:

1. Session schema ve metadata doğrulanır.
2. `catalogVersion/catalogHash`, gömülü katalog manifestiyle karşılaştırılır.
3. Ana dil ve hedef dil katalogları yüklenip parse edilir.
4. Her iki katalogda ID kümelerinin eşitliği tekrar doğrulanır.
5. Katalogda bulunmayan bir learned ID varsa `INVALID_PROGRESS_IDS` ile oyun başlatılmaz.
6. `reviewTargets = catalogIds ∩ learnedWordIds` oluşturulur.
7. `newTargets = catalogIds - learnedWordIds` oluşturulur.
8. Hedefler ve tüm-katalog distractorları kullanılarak roundlar Unity içinde üretilir.
9. Seçili iki katalog session boyunca cache edilir; oyun kapanırken referanslar bırakılır.

Round factory kuralları:

- Her target ilk cycle için tam bir kez round olur.
- Prompt ana dil kataloğundan, doğru cevap hedef dil kataloğundan gelir.
- İki distractor hedef dildeki tüm seviye kataloğundan seçilebilir.
- Aynı ID, normalize edilmiş aynı label veya hedefle çakışan seçenek kullanılamaz.
- Her roundda üç benzersiz seçenek ve tam bir doğru ID bulunur.
- Doğru lane dağılımı dengeli ve seed ile test edilebilir olmalıdır.
- Session başına seed, `sessionId` veya sessionda açıkça taşınan bir seed üzerinden deterministik yapılabilir.

Host tarafındaki hazır round üretimi, 15/30 limitleri ve `fitSessionToBridge()` kaldırılmalıdır. Unity round factory bu davranışın tek oyun otoritesi olur.

### 4.4 Unity deste davranışı

`RoundDeck` tekrar politikasını açıkça desteklemelidir:

- `Looping`: mevcut davranış; cycle bittiğinde yeniden karıştırır.
- `Finite`: ilk cycle bittiğinde `TryNext` false döndürür.

Önerilen API davranışı:

```text
TryNext(out Entry entry) -> bool
Count
DrawnCount
RemainingCount
Reset()
```

Review modu `Finite`, yeni kelime modu `Looping` kullanır. Runner'ın zafer kararı yalnızca “deck bitti” sinyaline güvenmemeli; benzersiz doğru hedef sayısını da doğrulamalıdır.

### 4.5 Review tamamlanma state machine'i

Unity `VocbeeRunner.FlowState` içine ayrı bir state eklenmelidir:

```text
Playing
   |
   +-- wrong --> WrongFeedback --> Result
   |
   +-- correct, hedefler kaldı --> Playing
   |
   +-- correct, son review hedefi --> VictoryCelebration --> Result
```

Runner run başında şu state'i sıfırlar:

- Seçili oyun modu
- Review hedef sayısı
- Doğru bilinen benzersiz review word ID seti
- Completion eventi gönderildi bayrağı
- Doğru cevap sayısı
- Güncel hız

Doğru cevapta:

1. Normal answer eventi gönderilir.
2. Skor/combo güncellenir.
3. Güncel hız yeni doğru sayısına göre artırılır.
4. Review modundaysa `wordId` benzersiz doğru setine eklenir.
5. Set sayısı `targetCount` değerine eşitse `VictoryCelebration` state'ine geçilir.
6. Input ve yeni gate üretimi durdurulur.
7. Gate gizlenir; alev bitişi ve zafer sesi oynatılır.
8. `reviewCompleted` eventi tam bir kez gönderilir.
9. Yaklaşık 2,4 saniye sonra zafer result ekranı açılır.

`finished` eventi kullanılmamalıdır; native kod mevcut durumda her `finished` eventinden sonra Unity'yi kapatıyor. Zafer için kapatmayan ayrı event gereklidir.

Önerilen event:

```text
type: reviewCompleted
schemaVersion: 4
bridgeVersion: 1
sessionId: string
seq: integer
level: A1 | A2 | B1 | B2 | C1
targetCount: integer
score: integer
bestCombo: integer
```

`finished/quit` yalnızca kullanıcı gerçekten host uygulamaya dönerken gönderilmeye devam eder.

### 4.6 Inferno zafer efekti

Asset doğrulandıktan sonra önerilen entegrasyon:

1. Gerçek asset, gerekirse `Assets/VocBee/Resources/VFX/ReviewCompletionInferno.prefab` altında mobil uyumlu tek prefaba sarılır.
2. `VocbeeRunner` üzerinde `[SerializeField] GameObject reviewCompletionVfxPrefab` referansı tanımlanır.
3. Referans `VocbeeRunner.unity` sahnesindeki `VocbeeGameBridge` nesnesine atanır. Scene referansı build'e dahil edilmeyi garanti eder.
4. Yeni `VocbeeCompletionCelebration` sınıfı prefabın yaşam döngüsünü yönetir.
5. Prefab Awake sırasında bir kez instantiate edilir, inactive tutulur ve her zaferde yeniden kullanılır; zafer anında instantiate kaynaklı frame spike oluşturulmaz.
6. Efekt arının çevresinde/arkasında konumlandırılır; kelime kartlarını ve result UI'ı kapatmaz.
7. Particle System veya Animator kontrollü şekilde restart edilir.
8. Efekt 2,4 saniyelik tek seferlik sekans olarak çalışır; sonucu bekletmeyen sonsuz loop bırakılmaz.
9. Efekt eksikse oyun zaferi yine tamamlanır. Null asset sadece kontrollü warning üretir; streak/event kaybolmaz.

Erişilebilirlik:

- `reducedMotion=false`: tam inferno animasyonu, kısa ölçek/fade ve zafer sesi.
- `reducedMotion=true`: kamera sarsıntısı yok, emisyon ciddi azaltılmış veya tek karelik sıcak glow/fade kullanılır.
- Hız mekaniği bir zorluk kuralı olduğu için reduced motion tarafından kapatılmaz; yalnızca ek görsel hareketler azaltılır.

Mobil performans bütçesi:

- Aynı anda yaşayan particle sayısı cihaz üzerinde sınırlandırılmalı.
- Şeffaf overdraw bütün ekranı uzun süre kaplamamalı.
- URP shader stripping sonrası kullanılan shader Android ve iOS buildlerinde doğrulanmalı.
- Efekt sırasında hedef 60 FPS; desteklenen düşük cihazda uzun süre 45 FPS altına düşmemeli.
- VFX asset lisansı release checklistine eklenmeli.

### 4.7 Kademeli hızlanma

`Time.timeScale` değiştirilmemelidir. Aksi halde UI, feedback timer, ses ve pause davranışı da istenmeden hızlanır.

Yalnızca dünya/gate hızı değiştirilmelidir. Önerilen eğri:

```text
speed(correctCount) = baseSpeed *
  (1 + 0.45 * (1 - exp(-correctCount / 20)))
```

Başlangıç `baseSpeed = 9`. Teorik üst sınır `13.05` olur.

| Doğru sayısı | Yaklaşık hız |
| ---: | ---: |
| 0 | 9,00 |
| 1 | 9,20 |
| 5 | 9,90 |
| 10 | 10,59 |
| 20 | 11,56 |
| 40 | 12,50 |
| Sonsuz limit | 13,05 |

Bu eğri her doğru cevapta artar ancak uzun destelerde kontrolsüz büyümez. Lineer artış 800–1.400 kelimelik seviyelerde oynanamaz hızlara çıkacağı için kullanılmamalıdır.

Unity değişikliği:

- `VocbeeWorldSettings.TrackSpeed` başlangıç ayarı olarak kalır.
- `VocbeeWorld` içinde mutable `CurrentTrackSpeed` tutulur.
- `TickRunning` ve `MoveTrack` aynı `CurrentTrackSpeed` değerini kullanır.
- Doğru cevap sonrası yeni hız bir sonraki gate'e etki eder.
- Run, retry veya mod değişiminde hız tekrar `9` olur.
- Pause/resume hızı korur.
- Inspector'a `maxSpeedMultiplier=1.45` ve `speedCurveCorrectAnswers=20` gibi doğrulanan tuning alanları eklenebilir.

### 4.8 Normal akıştan izolasyon

Game session hazırlanırken host mevcut servislerden yalnızca read-only snapshot alır:

```text
getCurrentLevel()
getLanguagePair()
getLearnedWords(level)
generated game catalog manifest
```

Şunlar oyun launch sırasında çağrılmamalıdır:

- `generateVocabulary()`
- `markWordAsLearned()`
- `checkAndAdvanceLevel()`
- Vocabulary clear/migration işlemleri
- Favori veya notification mutationları

Unity kompakt katalogları React Native Metro asset graph'ına import edilmemeli ve uygulama bootstrap sırasında parse edilmemelidir. Böylece normal başlangıç ve Home yükleme maliyetine ek CPU/RAM yükü gelmez.

Game launch veya katalog validasyonu başarısız olursa hata yalnızca oyun yüzeyinde ele alınır; host Home sessionı ve öğrenme verisi kullanılabilir kalır.

### 4.9 OTA ve native binary uyumluluğu

Unity katalogları AAR/XCFramework içine gömülüdür ve OTA ile güncellenemez. Host JavaScript ve vocabulary assetlerinin native binary'den ayrışmasını engellemek için:

1. `app.json`/dynamic app config içinde native binary'ye bağlı açık bir Expo `runtimeVersion` politikası tanımlanmalıdır.
2. Catalog değişikliği yeni `catalogVersion` ve yeni native Android/iOS build gerektirmelidir.
3. Katalog değiştiren commit OTA-only release pipeline'ında engellenmelidir.
4. OTA publish öncesi host `catalogHash`, hedef release kanalının native catalog hash değeriyle karşılaştırılmalıdır.
5. Uyuşmazlıkta publish veya game launch fail-closed olmalıdır; eski Unity kataloğuyla tahmini eşleşme yapılmamalıdır.
6. Katalog değiştirmeyen UI/iş mantığı OTA'ları aynı runtime/catalog sözleşmesi içinde yayınlanabilir.

Projede şu anda açık bir `runtimeVersion` alanı görünmediği için bu madde production release blocker'dır. Uygulanacak Expo politikası installed Expo sürümünde doğrulanmalı; temel invariant “aynı OTA runtime yalnızca aynı gömülü oyun kataloğuna sahip native binary'lere gider” olmalıdır.

## 5. Host uygulamada dosya bazında iş listesi

### `scripts/generateGameVocabulary.cjs`

- Tam vocabulary assetlerinden deterministic `id + word` Unity çıktıları üret.
- Canonical serialization ve SHA-256 manifest üret.
- 21 dil × 5 seviye matrisini doğrula.
- `--check` ve `--sync-unity` modlarını uygula.
- Aynı version altında hash değişimini ve stale generated outputu hata yap.
- Word-only toplam boyut için rapor üret; beklenmeyen boyut sıçramasını CI'da görünür kıl.

### `package.json` ve CI/release scriptleri

- `vocabulary:game:check` scripti ekle.
- Unity export öncesi `vocabulary:game:sync` zorunlu kapısını ekle.
- OTA-only pipeline'da vocabulary/catalog değişikliğini engelle.
- Android ve iOS exportlerinin aynı `catalogVersion/catalogHash` ile üretildiğini doğrula.

### `src/features/game/generated/gameVocabularyManifest.ts`

- Generator çıktısı olarak `catalogVersion`, `catalogHash`, desteklenen diller, seviyeler ve beklenen kelime sayılarını taşı.
- Elle düzenleme uyarısı içersin.
- Session hazırlama yalnızca bu generated contractı kullansın.

### `src/features/game/domain/gameSession.ts`

- Session schema'yı V4'e yükselt.
- `newWords/review.rounds` payloadlarını kaldır.
- `catalogVersion`, `catalogHash` ve `learnedWordIds` alanlarını ekle.
- ID, dil, seviye, hash ve session metadata validasyonunu uygula.
- 15/30 round limitlerini ve host round factory'yi kaldır.
- Session için 32 KiB iç bütçe, 64 KiB hard bridge limiti uygula.

### `src/features/game/composition/gameSession.ts`

- Mevcut seviye, dil çifti ve learned ID snapshotını paralel yükle.
- Learned ID'leri mevcut host level vocabulary ID setine göre doğrula.
- Generated catalog manifest değerlerini sessiona ekle.
- `fitSessionToBridge()` ve round kırpmasını kaldır.
- Aktif session metadata'sını event coordinator'a kaydetmeden Unity'yi açma.
- Open başarısızsa aktif session kaydını temizle.

### `modules/vocbee-unity/index.ts`

- `openGame` için mevcut 64 KiB direct JSON doğrulamasını koru.
- GameSession V4 eventlerini discriminated union olarak parse/validate et.
- `reviewCompleted` eventini typed API'ye ekle.
- Bilinmeyen schema/eventleri fail-closed işle.
- Bridge transport versionını gereksiz yere yükseltme.

### Android/iOS native modüller

İlgili dosyalar:

- `modules/vocbee-unity/android/src/main/java/com/vocbee/unity/VocbeeUnityModule.kt`
- `modules/vocbee-unity/android/src/main/java/com/vocbee/unity/VocbeeUnityActivity.kt`
- `modules/vocbee-unity/ios/VocbeeUnityModule.swift`

Yeni bir dosya taşıma katmanı gerekmez. Mevcut native kod için yalnızca regresyon doğrulaması yapılmalıdır:

- Küçük V4 session JSON'u değişmeden Unity'ye ulaşır.
- `reviewCompleted` eventinde Unity Activity/View kapanmaz.
- Yalnızca terminal `finished` eventinde unload davranışı çalışır.
- Invalid JSON ve native launch error davranışları korunur.

Kod zaten bu davranışı sağlıyorsa native kaynakta gereksiz değişiklik yapılmamalıdır.

### Game event coordinator

Yeni bir application/composition servisi şu sorumlulukları almalıdır:

- Native event aboneliğini Unity açılmadan önce kurmak
- Event JSON'unu parse ve validate etmek
- `sessionId` değerini aktif session ile eşleştirmek
- `seq` değerini monoton kontrol etmek
- `reviewCompleted` eventini session başına yalnızca bir kez işlemek
- `recordDailyStudyAction()` çağırmak
- Streak özetinin Home ekranına dönüşte yenilenmesini sağlamak
- Event işlendikten sonra aktif completion ledger'a session ID eklemek

Ledger son 50 completion sessionını tutan bounded bir AsyncStorage kaydı olabilir. Günlük streak metodu zaten idempotent olsa da ledger, analytics/UI/notification gibi yan etkilerin iki kez çalışmasını engeller.

### Home ekranı

- Unity'den dönüşte `getStreakSummary()` yeniden okunmalı.
- `didIncrement=true` ise mevcut streak kutusu yeni değeri göstermeli.
- Aynı gün daha önce tamamlandıysa sayı değişmemeli.
- Oyun launch animasyonu, session open sonucu ile completion sonucunu birbirine karıştırmamalıdır.

### Lokalizasyon

`locales/gameRunner.ts` ve bütün 21 dil kaynağına en az şu alanlar eklenmelidir:

- `reviewVictoryTitle`
- `reviewVictorySubtitle`
- `allLearnedWordsCompleted`

Gerekirse host tarafında:

- `game.streakRewardApplied`
- `game.streakAlreadyCompletedToday`

Placeholder tokenları mevcut lokalizasyon testleriyle doğrulanmalıdır.

### `app.json` veya dynamic Expo app config

- Native Unity catalog compatibility'sine bağlı açık bir `runtimeVersion` politikası tanımla.
- Catalog değişikliğinin aynı runtime'a OTA olarak gönderilememesini release otomasyonuyla doğrula.
- Android/iOS app version, Unity artifact revision ve catalog versionı release manifestinde birlikte kaydet.

## 6. Unity projesinde dosya bazında iş listesi

### `Assets/VocBee/Scripts/GameSession.cs`

- `GameSessionV4` metadata ve learned ID modelini ekle.
- Session schema versionını 4 yap; bridge transport versionını 1 tut.
- `catalogVersion/catalogHash`, level, dil çifti ve unique learned ID validasyonu ekle.
- Eski hazır `newWords/review.rounds` session alanlarını kaldır.
- Direct JSON ve 64 KiB hard limit davranışını koru.
- Unsupported schema/catalog için açık, recoverable hata kodları üret.

### Yeni Unity vocabulary catalog katmanı

Önerilen dosyalar:

- `Assets/VocBee/Scripts/Runtime/Vocabulary/GameVocabularyCatalog.cs`
- `Assets/VocBee/Scripts/Runtime/Vocabulary/GameVocabularyLoader.cs`
- `Assets/VocBee/Scripts/Runtime/Vocabulary/GameRoundFactory.cs`

Görevler:

- Gömülü catalog manifestini ve seçili iki `TextAsset` kataloğunu yükle.
- Version/hash ve dil/seviye desteğini doğrula.
- İki dilin ID kümelerini karşılaştır.
- Dictionary lookup ile prompt/answer eşlemesi yap.
- Learned/new hedef kümelerini session learned ID snapshotından üret.
- Tüm hedefleri ve benzersiz distractorları içeren roundları üret.
- Parse/load sırasında bounded allocation kullan; session bitiminde referansları bırak.

### `Assets/VocBee/Scripts/HostBridge.cs`

- Mevcut `LoadSessionJson` giriş metodunu koru.
- `reviewCompleted` event modelini ekle.
- Her event için monoton sequence üret.
- Completion eventini session başına tek sefer gönder.
- Schema, catalog veya parse hatasında güvenli placeholder/result davranışını koru.
- Ready eventi içinde `catalogVersion/catalogHash` raporlamak debug ve entegrasyon teşhisi için tercih edilir.

### `Assets/VocBee/Scripts/Runtime/Gameplay/RoundDeck.cs`

- Finite ve looping policy desteği ekle.
- `TryNext` API'si ile cycle sonunu açıkça bildir.
- Reset ve shuffle sınırında aynı turun arka arkaya gelmemesi kuralını looping modda koru.
- Finite review modunda cycle 2'ye geçme.

### `Assets/VocBee/Scripts/VocbeeRunner.cs`

- Seçili modu run state'inde sakla.
- Review doğru hedef setini ve hedef sayısını takip et.
- `VictoryCelebration` state'ini ekle.
- Son doğru review cevabında input/gate akışını durdur.
- Completion eventini bir kez gönder.
- Hız eğrisini doğru cevap sayısıyla güncelle.
- Run/retry/mode resetinde hızı ve completion state'ini sıfırla.
- Inferno celebration controller'ını çağır.

### `Assets/VocBee/Scripts/Runtime/World/VocbeeWorld.cs`

- Mutable current track speed ekle.
- Pist ve gate ilerlemesinde aynı hızı kullan.
- Hızı base değere döndüren ve clamp eden API ekle.
- Zafer sırasında gate'i güvenli şekilde durdur/gizle.

### Yeni completion VFX sınıfı

Önerilen yol:

- `Assets/VocBee/Scripts/Runtime/VFX/VocbeeCompletionCelebration.cs`

Sorumlulukları:

- Prefabı bir kez oluşturmak ve cache etmek
- Normal/reduced motion varyantını seçmek
- Tek seferlik play/stop/reset yapmak
- Eksik veya bozuk componentte oyunu düşürmeden fallback uygulamak
- Dispose sırasında runtime instance'ı temizlemek

### `Assets/VocBee/Scripts/Runtime/UI/VocbeeHud.cs`

- Zafer başlığı ve alt metni göster.
- Celebration sırasında gameplay input yüzeylerini kapat.
- Result ekranına kontrollü geçiş yap.
- RTL ve uzun çeviriler için mevcut autosize kurallarını uygula.

### `Assets/VocBee/Scenes/VocbeeRunner.unity`

- `ReviewCompletionInferno.prefab` referansını `VocbeeRunner` componentine ata.
- Tuning değerlerini serialize et.
- Scene'nin yalnızca gerekli referansları içerdiğini ve build'e prefabı dahil ettiğini doğrula.

## 7. Test stratejisi

### 7.1 Catalog üretim ve bütünlük testleri

Generator testleri ve CI doğrulaması:

- 21 dilin her birinde A1-C1 seviyelerinin eksiksiz üretilmesi
- Her dil/seviye çıktısındaki ID kümesinin canonical kaynakla birebir eşleşmesi
- Aynı inputtan byte-for-byte aynı çıktı ve aynı catalog hashinin üretilmesi
- Compact catalogda yalnızca gerekli `id` ve `word` alanlarının bulunması; örnek cümle, telaffuz ve diğer öğrenme verilerinin sızmaması
- Duplicate/boş ID, boş kelime, desteklenmeyen dil veya seviye halinde üretimin fail etmesi
- Host generated manifesti ile Unity catalog manifestinin version/hash/değer bazında eşleşmesi
- Generator sonrası `--check` çalıştırıldığında stale veya elle değiştirilmiş çıktıların reddedilmesi
- Her catalog ve toplam ham/sıkıştırılmış asset boyutunun CI bütçesini aşmaması

### 7.2 React Native session/bridge testleri

- Session yalnızca schema/bridge metadata, level, dil çifti, learned ID snapshotı, catalog version/hash ve UI seçeneklerini içermeli.
- Session içinde round listesi, target/distractor kelime metni veya full vocabulary bulunmamalı.
- A1-A2-B1-B2-C1 seviyelerinde learned/new partition union ve intersection kuralları doğrulanmalı.
- En büyük gerçekçi B2 learned ID snapshotı Unicode metadata ile iç bütçe olan 32 KiB altında, her durumda native hard limit olan 64 KiB altında kalmalı.
- Duplicate, boş, yanlış seviyeye ait veya catalogda bulunmayan learned ID güvenli ve açık biçimde reddedilmeli.
- Desteklenmeyen schema, dil çifti, level, catalog version/hash ve malformed JSON launch öncesinde reddedilmeli.
- Payload hiçbir koşulda sessizce kırpılmamalı; limit aşımı açık hata üretmeli.
- Android ve iOS doğrudan JSON bridge fixture'ları byte-for-byte aynı contractı uygulamalı.
- Oyun açılamadığında host öğrenme/progress state'i değiştirilmemeli ve aktif session temizlenmeli.

### 7.3 Game event coordinator testleri

- Aktif sessiona ait `reviewCompleted` streak aksiyonu üretmeli.
- Farklı session ID reddedilmeli.
- Duplicate session/seq ikinci yan etki üretmemeli.
- Sırası geriye giden seq reddedilmeli.
- Aynı gün ikinci zafer `didIncrement=false` olmalı.
- Ertesi gün zafer mevcut streak'i bir artırmalı.
- Unity launch hatası aktif session kaydını temizlemeli.

### 7.4 Unity EditMode testleri

- Catalog loader yalnızca seçili iki dil/seviye assetini yüklemeli.
- Catalog version/hash uyuşmazlığı, eksik asset, duplicate ID ve iki dil arasında ID kümesi farkı fail-closed davranmalı.
- Learned ID snapshotından new/review target partitionı doğru üretilmeli.
- 898 A1 ve 1.424 B2 hedef dahil olmak üzere ilk cycle'da her target tam bir kez üretilmeli.
- Bir ve iki targetlı pool, distractorları gerektiğinde seviyenin tamamından güvenli biçimde tamamlayabilmeli.
- Aynı ID, normalize edilmiş aynı label veya aynı translation distractor olarak kabul edilmemeli.
- Aynı seed aynı round sırasını; farklı seed farklı geçerli sırayı üretmeli.
- Finite deck her round'u bir kez verir ve sonra biter.
- Looping deck mevcut tekrar davranışını korur.
- Hız eğrisi monoton artar, 9'dan başlar ve 13,05'i aşmaz.
- Reset hızı 9'a döndürür.
- Review son doğru hedefte yalnızca bir completion tetikler.
- Duplicate doğru bildirim completion sayısını artırmaz.
- New mode deck sonu review zaferi üretmez.
- GameSession V4, direct JSON hard limit ve catalog metadata validasyonları çalışır.
- Run sonlandığında yüklenen catalog referansları ve üretilen round state'i bırakılır.

### 7.5 Unity PlayMode/integration testleri

- Üç kelimelik review: üç doğru → inferno → victory result.
- Son kelimeden önce yanlış → mevcut loss result, inferno ve streak eventi yok.
- Pause/resume güncel hızı korur.
- Retry hız ve review completion sayacını sıfırlar.
- Reduced motion akışında full particle/camera hareketi çalışmaz.
- Inferno prefab referansı null olduğunda zafer tamamlanır.
- Gömülü catalog eksik/bozuk olduğunda recoverable error ve güvenli çıkış sağlanır.
- Host session catalog version/hashi binary ile uyuşmadığında oyun başlamaz ve açık hata döner.

### 7.6 Normal uygulama akışı regresyon testleri

- Home ve öğrenme akışı mevcut `DefaultVocabularyService` sonuçlarını değiştirmeden çalışır.
- Kelime öğrenme, favori ekleme/çıkarma, bildirim planlama ve Firestore progress sync davranışları korunur.
- Uygulama başlangıcında Unity compact catalogları React Native belleğine veya normal vocabulary servisine yüklenmez.
- Oyun sessionı oluşturmak learned state'i, current level'ı veya kelime sırasını değiştirmez.
- Review zaferi yalnızca günlük streak aksiyonunu tetikler; kelime learned state'i ve level progression değişmez.
- Catalog veya Unity launch hatası normal öğrenme verisini bozmaz; kullanıcı host uygulamaya güvenle döner.
- Oyun hiç açılmadan yapılan mevcut Home/learning/favorites/notification testleri aynı sonuçla geçer.

### 7.7 Cihaz matrisi

En az:

- Android debug ve release, düşük/orta sınıf gerçek cihaz
- iOS simulator yalnızca işlev kontrolü
- iOS release gerçek cihaz
- Light/dark tema
- RTL: Arapça veya Farsça
- Uzun etiketli dil ve çok byte'lı UTF-8 dil çifti
- Offline mod
- Background/foreground sırasında oyun
- Aynı gün iki review zaferi
- Gün değişimi sınırı
- En büyük B2 learned snapshotı ve A1 full-new başlangıcı
- Catalog hash/version uyuşmazlığı olan kontrollü negatif build
- Store binary ile eşleşmeyen catalog değişikliğinin OTA release kapısında reddedilmesi

## 8. Ölçülebilir kabul kriterleri

| Alan | Kabul kriteri |
| --- | --- |
| Catalog bütünlüğü | 21 dil x 5 seviye ID kümeleri canonical kaynakla eşleşir; host ve Unity aynı version/hash manifestini kullanır. |
| New pool | Snapshot'taki her geçerli öğrenilmemiş ID ilk cycle'da tam bir kez target olur. |
| Review pool | Snapshot'taki her geçerli öğrenilmiş ID ilk cycle'da tam bir kez target olur. |
| Session payload | Round/kelime taşınmaz; en büyük desteklenen snapshot 32 KiB iç bütçenin ve 64 KiB hard limitin altında kalır. |
| Kırpma | 15/30 limiti veya bridge boyutu nedeniyle sessiz target azaltma bulunmaz. |
| Review win | Son benzersiz hedef doğru bilindiğinde tek bir zafer oluşur. |
| Hata | Herhangi bir yanlış cevap zaferi ve streak ödülünü engeller. |
| Streak | Aynı yerel günde en fazla bir artış; sonraki ardışık günde bir artış. |
| Event | Duplicate/out-of-session completion yan etki üretmez. |
| Hız | Her doğruyla monoton artar; 9'dan başlar ve 13,05'i aşmaz. |
| Reset | Retry ve yeni run hızı/ilerlemeyi başlangıca döndürür. |
| Inferno | Review zaferinde oynar; eksik asset oyunu veya ödülü bozmaz. |
| Erişilebilirlik | Reduced motion için düşük hareketli fallback vardır. |
| Lazy load | Yalnızca seçili dil çiftinin ve seviyenin iki catalog asseti yüklenir; normal uygulama başlangıcı bunları yüklemez. |
| Performans | Catalog parse/round üretimi menüyü kilitlemez; VFX kabul edilen cihazda uzun süre 45 FPS altına düşürmez. |
| Bundle boyutu | Compact word-only catalogların release artifactlerine etkisi ölçülür ve tanımlı CI bütçesini aşmaz. |
| Normal akış | Home, öğrenme, favoriler, bildirimler, progress ve Firestore sync mevcut davranışını korur. |
| Uyumluluk | Catalog değişikliği doğru native runtime/version olmadan OTA olarak yayınlanamaz. |
| Platform | Aynı metadata ve catalog revizyonu Android/iOS'ta aynı target count ve completion sonucunu üretir. |

## 9. Uygulama sırası

1. `inferno` asset yolunu, tipini, URP/mobil uygunluğunu ve lisansını doğrula.
2. Catalog ID/version/hash yönetişimini ve GameSession V4 contractını ortak fixture'larla kesinleştir.
3. Deterministik compact catalog generatorünü, Unity assetlerini ve host generated manifestini üret.
4. Generator `--check`, ID parity, boyut bütçesi ve normal uygulama regresyon testlerini CI'a ekle.
5. Host session üretimini learned ID snapshotı ve catalog metadata gönderecek şekilde sadeleştir; direct JSON limit testlerini tamamla.
6. Unity catalog loader, partition ve tek round-authority olan `GameRoundFactory` katmanını tamamla.
7. Finite review deck ve completion state machine'i uygula.
8. Hız eğrisini world hareketine bağla; inferno prefab ve zafer HUD akışını entegre et.
9. Host game event coordinator ve günlük streak bağlantısını tamamla.
10. Lokalizasyonları ve accessibility fallbacklerini tamamla.
11. Native-bound Expo runtimeVersion politikasını ve catalog değiştiren OTA'ları engelleyen release kontrolünü ekle.
12. Unity EditMode/PlayMode ile React Native Jest/typecheck/lint ve normal-akış regresyonlarını çalıştır.
13. Catalogları senkronlayıp Unity Android library ve iOS device/simulator frameworklerini aynı revizyondan yeniden export et.
14. AAR/XCFramework içeren release buildlerde catalog version/hash, cihaz matrisi ve OTA negatif senaryosunu doğrulayıp kademeli rollout yap.

## 10. Export ve doğrulama kapıları

Export başlamadan önce catalog üretimi ve senkronizasyonu doğrulanmalıdır. Örnek kapı sırası:

1. Canonical vocabulary kaynaklarının ve ID yönetişiminin doğrulanması
2. `vocabulary:game:generate` ve ardından `vocabulary:game:check`
3. Üretilen catalogların Unity proje köküne kontrollü `--sync-unity` adımıyla senkronlanması
4. Host ve Unity manifestlerinde catalog version/hash eşitliği
5. Unity Console error/warning kontrolü
6. EditMode testleri
7. PlayMode/integration testleri
8. `VocBee/Export Android Library`
9. Host projede `npm run unity:android:library`
10. `VocBee/Export iOS Library`
11. `VocBee/Export iOS Simulator Library`
12. Host projede `npm run unity:ios:framework`
13. AAR ve XCFramework içinde beklenen catalog version/hash ve assetlerin bulunduğunun doğrulanması
14. `npm run typecheck:all`
15. İlgili Jest testleri ve ardından `npm run test:ci`
16. `npm run lint`
17. Native runtimeVersion/catalog release manifesti ve OTA compatibility dry-run kontrolü
18. Android/iOS release smoke testi

Unity export artifactleri değiştirilmeden önce mevcut dirty binary değişiklikleri sahipleriyle ayrıştırılmalıdır. Host çalışma ağacında ve Unity projesinde önceden var olan değişiklikler ezilmemelidir.

## 11. Riskler ve önlemler

### Host ve Unity catalog ayrışması

Risk: Host learned ID snapshotı bir catalog revizyonuna, Unity binary başka bir revizyona göre yorumlayabilir.

Önlem: Tek canonical kaynak, deterministik generator, generated host/Unity manifestleri, version+hash handshake, CI parity ve mismatch halinde fail-closed davranış.

### OTA ve native binary uyumsuzluğu

Risk: Catalog veya session contractı OTA ile değişirken cihazdaki gömülü Unity artifacti eski kalabilir.

Önlem: Native-bound `runtimeVersion`, catalog değiştiren OTA için release engeli ve Android/iOS artifact revisionını catalog versionıyla birlikte kaydeden release manifesti.

### Bundle boyutu ve Unity belleği

Risk: 21 dil x 5 seviye catalog binary boyutunu büyütür; iki büyük catalogun parse edilmesi düşük cihazda bellek baskısı yaratabilir.

Önlem: Yalnızca `id+word` compact çıktı, ham/sıkıştırılmış boyut bütçesi, seçili iki catalogun lazy load edilmesi, bounded parse/round üretimi, run bitiminde referans bırakma ve gerçek cihaz profiling.

### Normal uygulama akışında regresyon

Risk: Oyun için oluşturulan yeni veri katmanı Home/learning vocabulary servisine bağlanırsa startup, öğrenme veya sync davranışı değişebilir.

Önlem: Compact catalogu Unity'ye özel ve additive tutmak; `DefaultVocabularyService`, mevcut full assetler ve progress modellerini değiştirmemek; normal-akış regresyon testlerini release kapısına eklemek.

### Event kaybı veya iki kez işleme

Risk: Native lifecycle veya yeniden abonelik sırasında completion eventi kaybolabilir/tekrarlanabilir.

Önlem: Unity açılmadan abonelik, sessionId + seq validasyonu, bounded completion ledger ve günlük streak idempotency.

### Uzun review süresi

Risk: B2 seviyesinde 1.424 öğrenilmiş kelimeyi tek hatasız run içinde tamamlamak pratik olarak çok uzun olabilir.

Önlem: Bu plan kullanıcının “hepsini bilirse kazanır” kuralını aynen uygular. Ancak ürün açısından checkpoint/resume veya bölümleme daha sonra ayrı bir karar olarak değerlendirilmelidir; mevcut kapsamda kelime azaltılmaz.

### Inferno performansı

Risk: Şeffaf particle overdraw, mobil shader veya eksik referans FPS/crash sorunu oluşturabilir.

Önlem: Prefab warm-up/pooling, URP materyal doğrulaması, null fallback, reduced-motion varyantı ve gerçek cihaz profiling.

### Streak anlamının bozulması

Risk: Her tekrar kazanışında mekanik `+1` yapmak streak'i günlük alışkanlık yerine farm edilebilir skora dönüştürür.

Önlem: Yalnızca mevcut `recordDailyStudyAction` kullanılmalı; aynı gün ikinci artış yapılmamalıdır.

## 12. Rollback planı

- GameSession schema v4, host generated manifesti ve gömülü Unity catalogları aynı store release setinde yayınlanmalıdır.
- Catalog version/hash doğrulaması başarısız olursa oyun güvenli hata ekranı göstermeli; öğrenme akışı etkilenmeden host uygulamaya dönebilmelidir.
- Streak yazımı oyun binary'sinden bağımsız host domain servisinde kaldığı için VFX veya Unity sonucu başarısız olduğunda veri doğrudan Unity'den değiştirilmez.
- Rollback'te host kodu, generated manifest, AAR ve XCFramework aynı bilinen iyi catalog revizyonuna birlikte döndürülmelidir; yalnızca bir platform artifacti geri alınmamalıdır.
- OTA yalnızca aynı native runtime/catalog contractına sahip binary'leri hedeflemeli; uyumsuz catalog değişikliği rollback OTA'sı olarak kullanılmamalıdır.
- ID kümesini değiştiren rollbackte mevcut learned ID'lerin anlamı doğrulanmalı; güvenli eşleşme yoksa oyun launchı geçici olarak kapatılmalı, progress verisi otomatik migrate edilmemelidir.
- Oyun launchının compatibility nedeniyle kapatılması Home, öğrenme, favoriler, bildirimler ve sync akışını etkilememelidir.

## 13. Definition of Done

İş ancak aşağıdakilerin tamamı sağlandığında production-ready kabul edilmelidir:

- Tüm seviyelerde full new/review target testleri geçiyor.
- Compact cataloglar deterministik üretiliyor; 21 dil x 5 seviye ID parity, version/hash ve stale-output kontrolleri geçiyor.
- Direct JSON session yalnızca metadata ve learned ID içeriyor; 32 KiB iç bütçe ve 64 KiB hard limit iki platformda doğrulanmış, sessiz kırpma bulunmuyor.
- Unity yalnızca seçili dil çiftinin/seviyenin iki catalogunu lazy load ediyor ve run sonunda referansları bırakıyor.
- Review deck sonlu; new deck looping.
- Hatasız tüm-review koşusu tek zafer üretmiş.
- Inferno efekti normal ve reduced-motion yollarında doğrulanmış.
- Streak aynı gün idempotent, ardışık günlerde doğru çalışıyor.
- Hız eğrisi monoton, capped ve resetlenebilir.
- Eventler sessionId/seq ile doğrulanıyor ve duplicate yan etki üretmiyor.
- Bütün lokalizasyon alanları 21 dilde dolu.
- Normal Home/learning/favorites/notification/progress/sync regresyon testleri değişmeden geçiyor.
- Catalog mismatch recoverable ve fail-closed; native runtimeVersion ile catalog değiştiren OTA release kapısı doğrulanmış.
- Unity testleri, Jest, TypeScript, lint ve iki release cihaz smoke testi başarılı.
- Android AAR ile iOS device/simulator XCFramework aynı Unity kaynak ve catalog revizyonundan export edilmiş.
- Compact catalogların release artifact boyut etkisi ölçülmüş ve kabul edilen bütçe release kaydına eklenmiş.
- `inferno` asset lisansı ve mobil performans sonucu release kaydına eklenmiş.
