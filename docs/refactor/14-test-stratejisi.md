# 14 — Test Stratejisi

## Mevcut Durum

- **Jest** (`jest.config.js`): preset `jest-expo`, setup `./jest.setup.js`, `.txt` -> `__mocks__/txtFileMock.js`.
- **`collectCoverageFrom` HARIÇ listesi** (test edilmesi en zor ama en kritik dosyalar): adMobService,
  notificationService, favoritesService, progressService, vocabularyService, SettingsScreen, SetupScreens,
  ExampleSentencesScreen, FavoritesScreen, ForgotPasswordScreen, LevelTestScreen, OnboardingScreen,
  SplashScreen, SafeBannerAd.
- **Mevcut testler:** 21 Jest test dosyası / 173 test (son yerel doğrulama). screens/__tests__
  (AuthScreens, HomeScreen); services/__tests__ (api, googleAuthConfig,
  groqService, i18n, nativeGoogleSignIn, notificationFrequency, notificationService, socialAuthProfile,
  storage, streakService, SyncService); utils/__tests__ (profileAvatar, streakCelebration);
  components/__tests__ (CustomAlert, ErrorBoundary, OfflineNotice, SwarmLogo, UIComponents, VocabularyCardHeader).
- **Typecheck varyantları:** `typecheck` (app), `typecheck:test`, `typecheck:rules`, `typecheck:worker`.
- **Rules testi:** `test:rules` (firebase emulators), `tests/firestoreRules.ts`.
  Yerel/CI ortamında Java/JDK ve Firebase emulator erişimi gerekir.

## Sorunlar

1. **Kritik mantık coverage dışı:** en riskli dosyalar (notification, ads, vocabulary) hariç tutulmuş
   çünkü test edilebilir değiller (yan etki + UI iç içe). Bu refactor'ın asıl fırsatı burada.
2. **Karakterizasyon testi yok:** büyük ekranları güvenle bölmek için "mevcut davranışı kilitleyen" test yok.
3. Coverage eşiği (threshold) tanımlı değil; gerileme sessizce geçebilir.
4. Jest coverage çıktısı `coverage/` olarak ignore ediliyor; fakat repoda `config/coverage` altında
   izlenen eski coverage artifact'leri bulunuyor. Bunlar Faz 0'da ayrı cleanup kararı gerektirir.

## Önerilen Yaklaşım: Test piramidi + "çıkarınca test et, sonra kapsama al"

- **Karakterizasyon (golden) testleri ilk:** Her büyük refactor PR'ından ÖNCE, mevcut davranışı sabitleyen
  test yazılır (ör. notification slot zamanları, ad-gate kararı, sync alan şekli). Refactor sonrası aynı test yeşil kalır.
- **Saf birim testleri:** çıkarılan saf fonksiyon/hook'lar (slotPlanner, contentBuilder, canShowAd,
  useResponsive, migrations) doğrudan test edilir.
- **Bileşen testleri (RTL):** çıkarılan saf sunum bileşenleri (WordCard, sections) için.
- **Entegrasyon:** kritik akışlar (auth cache-first, setup -> setupCompleted, sync round-trip) için.
- **Rules emulator:** her client-yazım değişikliğinde `test:rules`.
- **Contract testleri:** Firestore payload builder'ları (`userDoc`, setup/settings repositories),
  storage key inventory, env sınıflandırması ve grammar-proxy core davranışı için saf testler.
- **Coverage kapısı:** her dosya refactor edilip test edildikçe `collectCoverageFrom` HARIÇ listesinden
  ÇIKARILIR; ortak coverage threshold kademeli yükseltilir (ör. başlangıç %40 global, her faz +%5).

## Alternatifler ve Neden Elendiler

- **E2E (Detox/Maestro) ekle** — Şimdilik elendi: kurulum maliyeti yüksek; önce birim/entegrasyon tabanı.
  İleride smoke-E2E (bkz. `15`/`16`) düşünülebilir.
- **Test framework değiştir (vitest)** — Elendi: `jest-expo` RN için standart; değiştirmek risk.
- **Önce coverage threshold zorla, sonra refactor** — Elendi: test edilemez dosyalarda threshold imkansız;
  önce refactor + test, sonra threshold.

## Migration / Implementasyon Adımları

1. **PR-1:** `jest.config.js`'e `moduleNameMapper` (alias'lar; bkz. `02`) ve global coverage threshold
   (düşük başlangıç) ekle.
   - Komut: `npm run test:ci`
2. **PR-2..N (her feature refactor'ıyla eşleşik):** İlgili golden + birim testleri yaz; dosyayı refactor et;
   `collectCoverageFrom` hariç listesinden çıkar; threshold'u kademeli yükselt.
3. **PR-son:** Hariç liste minimuma iner (sadece gerçek native-only sarıcılar kalır); threshold hedefe ulaşır.

Her PR sonunda: `npm run typecheck && npm run typecheck:test && npm run test:ci` (+ ilgiliyse `test:rules`).

## Riskler

- **Yan etkili kodu test ederken kırılgan mock'lar** — bakım yükü. Azaltım: SDK erişimini adaptöre
  toplayıp (bkz. `06`/`12`) tek yerde mock'la.
- **Golden test "yanlış davranışı" kilitleyebilir** (mevcut bug'ı dondurma). Azaltım: golden yazarken
  belirgin bug'lar işaretlenir; refactor sonrası ayrı PR'da düzeltilir.
- **Threshold çok erken yüksek** PR'ları bloklar. Azaltım: kademeli artış.

## Test ve Kabul Kriterleri

- `collectCoverageFrom` hariç listesi her fazda kısalır; kaldırılan dosyalar için testler yeşil.
- Global coverage threshold tanımlı ve CI'da zorunlu (bkz. `16`).
- Tüm typecheck varyantları ve `test:ci` yeşil.
- `test:rules` ortam önkoşulları CI dokümanında açık: Java/JDK, Firebase CLI, emulator portları ve auth.
- Yeni coverage artifact'leri (`coverage/`, `**/coverage/`) git'e girmiyor; mevcutta izlenen
  `config/coverage` çıktıları ayrı cleanup PR'ında kaldırılıyor.

## Etkilenecek Dosyalar

```
jest.config.js            -> moduleNameMapper (alias), coverageThreshold, kısalan collectCoverageFrom hariç listesi
jest.setup.js             -> yeni adaptör mock'ları (expo-notifications, google-mobile-ads, purchases)
services/__tests__/*      -> import yolları güncellenir (dosyalar src/'e taşındıkça)
(yeni)                    -> features/*/**/__tests__/* (golden + birim + bileşen testleri)
```
