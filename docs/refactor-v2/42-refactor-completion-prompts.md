# Refactor Completion Prompts

Bu dosya, refactor branch'indeki eksik kalan isi parca parca yaptirmak icin hazirlanmis kesin prompt paketidir.

Her prompt sirayla uygulanmalidir. Bir prompt tamamen bitmeden sonraki prompta gecilmemelidir. Her prompt sonunda belirtilen kabul kriterleri ve komutlar yesil olmadan sonuc production-ready kabul edilmemelidir.

## Mevcut Durum Ozeti

Audit tarihi: 2026-07-09

Branch durumu:

- Aktif branch: `refactor`
- Son gorulen commit: `8a1877c migration phase 8`
- Root `App.tsx` artik shim olarak `src/app/App` export ediyor.
- Uygulamanin composition root'u `src/app/App.tsx`.
- Navigation hala aktif ekranlari root `screens/` altindan import ediyor.
- Bu nedenle uygulama su anda `src/app` bootstrap/provider/navigation katmanini kullaniyor, ancak route screen implementasyonlari hala buyuk oranda root `screens/` altinda calisiyor.

Aktif eski screen dosyalari:

- `screens/OnboardingScreen.tsx`
- `screens/AuthScreens.tsx`
- `screens/SetupScreens.tsx`
- `screens/HomeScreen.tsx`
- `screens/SettingsScreen.tsx`
- `screens/FavoritesScreen.tsx`
- `screens/ExampleSentencesScreen.tsx`
- `screens/LevelTestScreen.tsx`
- `screens/ForgotPasswordScreen.tsx`
- `screens/SplashScreen.tsx`

Onemli bulgular:

- Eski root alanlarinda hala cok sayida aktif dosya var: `screens`, `services`, `context`, `components`, `config`, `utils`.
- `src/app/navigation/RootNavigator.tsx`, `src/app/App.tsx` ve `src/devtools/screenRegistry.ts` hala root `screens/` import ediyor.
- Presentation dosyalarinda hala `AsyncStorage`, Firebase, Firestore, Expo SDK ve native SDK erisimi var.
- `context/AuthContext.tsx` hala buyuk ve veri katmani detaylariyla karisik.
- `services/notificationService.ts`, `services/vocabularyService.ts`, `services/SyncService.ts` gibi servisler hala buyuk ve/veya eski root importlariyla calisiyor.
- `services/adMobService.ts` ve `services/adMobService.web.ts` shim benzeri davranmaya baslamis, ancak butun servis katmani icin ayni disiplin tamamlanmamis.

Buyuk dosya riskleri:

- `screens/SettingsScreen.tsx`: 2131 satir
- `screens/HomeScreen.tsx`: 2010 satir
- `services/notificationService.ts`: 1310 satir
- `screens/SetupScreens.tsx`: 1025 satir
- `screens/AuthScreens.tsx`: 876 satir
- `screens/ExampleSentencesScreen.tsx`: 854 satir
- `context/AuthContext.tsx`: 784 satir
- `services/vocabularyService.ts`: 547 satir
- `screens/LevelTestScreen.tsx`: 485 satir
- `services/SyncService.ts`: 434 satir

## Global Kurallar

Bu kurallar her prompt icin zorunludur.

1. `docs/refactor-v2/03-current-app-behavior.md` baglayici sozlesmedir. Davranis degismeyecek.
2. `docs/refactor-v2/02-target-architecture.md`, `18-definition-of-done.md`, `30-acceptance-checklist.md`, `33-layer-contracts-and-import-rules.md`, `36-shim-and-file-move-recipes.md` ve ilgili phase dokumanlari okunmadan kod degistirilmeyecek.
3. Presentation katmani Firebase, Firestore, `AsyncStorage`, Expo SDK veya native SDK import etmeyecek.
4. Domain katmani saf TypeScript olacak; React, Firebase, Expo, AsyncStorage, network, storage veya native SDK import etmeyecek.
5. Feature-to-feature import sadece public `index.ts` barrel uzerinden yapilacak. Baska feature'in `data`, `application`, `presentation` deep path'i import edilmeyecek.
6. Eski root dosyalar once shim'e cevrilecek. Shim sadece re-export yapacak, logic barindirmayacak.
7. Shim silme sadece Phase 9 promptunda ve tum importlar yeni `src` yollarina tasindiktan sonra yapilacak.
8. Storage key'leri, Firestore collection/path/field adlari, payload sekilleri ve auth/profile davranisi bozulmayacak.
9. Firestore legacy field temizligi ayri onay gerektirir. Migration, backup ve rollback plani olmadan production verisi temizlenmeyecek.
10. Gizli anahtar, token, service account veya production credential dosyaya eklenmeyecek.
11. Test eklemeden veya mevcut testleri guncellemeden davranissal refactor tamamlanmis sayilmayacak.
12. Native iOS klasoru refactor PR'larina karistirilmayacak. `ios/` sadece bilincli native workflow karariyla commit edilecek.

## Her Prompt Icin Standart Cikis

Her prompt sonunda Opus 4.8 su bilgileri raporlamalidir:

- Degisen dosyalar
- Yeni/degisen mimari sinirlar
- Eski root shim'lerinin durumu
- Calistirilan komutlar ve sonuclari
- Kalan riskler
- Bir sonraki prompta gecilebilir mi: `evet` veya `hayir`

Minimum komutlar:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede mevcutsa ayrica:

```bash
npm run test:ci
npm run lint
npm run prettier:check
npm run test:rules
```

---

# Prompt 0 - Preflight, Baseline ve Calisma Alani Temizligi

## Verilecek Prompt

Sen bu repo uzerinde refactor completion calisacaksin. Once hicbir davranissal kod refactoru yapmadan preflight audit yap.

Calisma kurallari:

- Root path: `/Users/turan/Desktop/vocbee`
- Branch: `refactor`
- Kullanici degisikliklerini geri alma.
- `ios/`, `ios.backup-*`, `.expo/devices.json` ve `package.json` degisikliklerini ayri degerlendir. Refactor ile ilgisiz native/prebuild ciktilarini refactor commitlerine karistirma.
- Bu promptta uygulama davranisi degistirme.

Once su dokumanlari oku:

- `docs/refactor-v2/README.md`
- `docs/refactor-v2/00-analysis-methodology.md`
- `docs/refactor-v2/01-current-state-audit.md`
- `docs/refactor-v2/02-target-architecture.md`
- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/30-acceptance-checklist.md`
- `docs/refactor-v2/31-implementation-order.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`
- `docs/refactor-v2/39-phase-pr-breakdown.md`

Yap:

1. `git status --short`, `git branch --show-current`, `git rev-parse --short HEAD` ile baslangic durumunu kaydet.
2. Aktif runtime graph'i dogrula: root `App.tsx`, `src/app/App.tsx`, `src/app/navigation/RootNavigator.tsx`, `src/devtools/screenRegistry.ts`.
3. Root `screens`, `services`, `context`, `components`, `config`, `utils` altinda aktif kalan dosyalari listele.
4. Presentation katmaninda yasak importlari tespit et: Firebase, Firestore, `AsyncStorage`, Expo SDK, native SDK.
5. `src` icinde root path importlarini tespit et.
6. Feature deep import ihlallerini tespit et.
7. Buyuk dosyalari satir sayisina gore listele.
8. Mevcut test komutlarini package scriptlerinden tespit et.
9. Sonucu `docs/refactor-v2/43-current-refactor-gap-report.md` dosyasina yaz.

Yapma:

- Kod tasima.
- Shim olusturma.
- Import degistirme.
- Native iOS dosyalarini commit'e hazir hale getirme.
- Kullanici degisikliklerini revert etme.

Kabul kriterleri:

- Gap raporu guncel branch ve commit bilgisini icerir.
- Aktif runtime'in `src/app` + root `screens` hibrit durumda oldugu acikca yazilir.
- Her yasak import dosya bazinda listelenir.
- Bir sonraki promptlar icin net oncelik sirasi verilir.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand --runTestsByPath src/app/navigation/__tests__/RootNavigator.test.tsx src/app/providers/__tests__/AppProviders.test.tsx src/devtools/__tests__/screenRegistry.test.ts
```

Teslimat:

- `docs/refactor-v2/43-current-refactor-gap-report.md`
- Kisa terminal ozeti
- Sonraki prompta gecilebilir mi bilgisi

---

# Prompt 1 - Auth, Profile ve Sync Katmanini Tamamlama

## Verilecek Prompt

Auth/Profile/Sync refactorunu production-ready seviyeye getir. Bu promptun sonunda `context/AuthContext.tsx` aktif logic tasimayacak veya sadece geriye uyumluluk shim'i olacak. Auth state, profile persistence, sync orchestration ve auth side effect'leri `src/features/auth`, `src/features/profile` ve gerekiyorsa `src/features/sync` altinda dogru katmanlara ayrilacak.

Once su dokumanlari oku:

- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/04-phase-1-foundation.md`
- `docs/refactor-v2/05-phase-2-auth-profile.md`
- `docs/refactor-v2/08-cross-cutting-auth.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/32-implementation-spec-index.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`

Yap:

1. `context/AuthContext.tsx` icindeki sorumluluklari ayir:
   - auth state provider
   - session listener
   - profile bootstrap
   - setup completion state
   - sync trigger
   - error/loading state
2. Firebase Auth ve Firestore erisimini presentation/context dosyasindan cikar.
3. Gerekli repository ve application servislerini `src/features/auth`, `src/features/profile` ve `src/features/sync` altinda olustur veya mevcutlari tamamla.
4. `AuthContext` API'sini mevcut ekranlari kirmadan koru. Public hook ve provider davranisi degismeyecek.
5. Eski `context/AuthContext.tsx` dosyasini shim'e cevir:
   - sadece `src/features/auth` public barrel'inden export etsin
   - logic barindirmasin
6. `src/app/providers` icinde yeni provider importlarini dogru public path'lere tasidiginindan emin ol.
7. `config/firebase` direct importlarini Auth/Profile presentation ve context katmanindan kaldir.
8. Auth/Profile davranislari icin test ekle:
   - initial loading
   - signed-out state
   - signed-in profile load
   - setup complete/incomplete routing etkisi
   - error state
   - sign out cleanup
9. Mevcut route davranisinin `03-current-app-behavior.md` ile ayni kaldigini dogrula.

Yapma:

- Firestore schema'sini degistirme.
- Kullanici profil field adlarini degistirme.
- Async bootstrap sirasini davranis degistirecek sekilde sadeleştirme.
- Root `screens` dosyalarini bu promptta tasima.

Kabul kriterleri:

- `context/AuthContext.tsx` 200 satirin altinda ve sadece shim/public re-export karakterinde.
- Presentation/context katmaninda Firebase, Firestore veya concrete repository deep import yok.
- Auth/Profile domain kodu saf TypeScript.
- Auth public API geriye uyumlu.
- App acilis, login, logout, setup routing davranisi korunmus.
- Ilgili unit testler mevcut ve yesil.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
```

Teslimat:

- Degisen dosya listesi
- Auth/Profile/Sync katman haritasi
- Shim durumlari
- Test sonucu

---

# Prompt 2 - Vocabulary, Progress, Favorites, Streak ve Review Servislerini Tamamlama

## Verilecek Prompt

Vocabulary, progress, favorites, streak ve review servislerini hedef mimariye tamamla. Bu promptun sonunda root `services/*` dosyalari aktif logic tasimayacak; sadece `src/features/*` public API'lerine shim olacak.

Once su dokumanlari oku:

- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/06-phase-3-data-sync.md`
- `docs/refactor-v2/07-phase-4-learning.md`
- `docs/refactor-v2/09-cross-cutting-sync.md`
- `docs/refactor-v2/12-feature-vocabulary.md`
- `docs/refactor-v2/13-feature-learning.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`

Yap:

1. Su root servisleri incele ve sorumluluklarini cikar:
   - `services/vocabularyService.ts`
   - `services/progressService.ts`
   - `services/favoritesService.ts`
   - `services/streakService.ts`
   - `services/reviewPromptService.ts`
   - `services/SyncService.ts`
2. Domain modellerini `src/features/*/domain` altinda saf TypeScript olarak tamamla.
3. Application use case/facade katmanlarini `src/features/*/application` altinda tamamla.
4. AsyncStorage, Firestore ve network erisimini `data/repositories` veya `data/datasources` altina indir.
5. Eski storage key'lerini ve Firestore path/payload sekillerini aynen koru.
6. Offline/cache/sync davranisini `03-current-app-behavior.md` ile uyumlu tut.
7. Root servisleri shim'e cevir:
   - `export * from '../src/features/...';`
   - gerekiyorsa default export uyumlulugunu koru
   - shim dosyalarinda logic kalmasin
8. `src` icindeki eski servis importlarini yeni public feature barrel'lerine tası.
9. Test ekle:
   - vocabulary load/cache fallback
   - progress update
   - favorite add/remove/check
   - streak calculation/update
   - review prompt eligibility
   - sync success/failure/retry davranisi

Yapma:

- Public method imzalarini gereksiz yere kirma.
- Storage key veya Firestore field adlarini degistirme.
- Presentation dosyalarini buyuk olcekli tasima; bu prompt servis katmani odaklidir.
- Feature deep importlari ekleme.

Kabul kriterleri:

- Root servis dosyalari shim veya 50 satirin altinda uyumluluk wrapper'i.
- Business rule domain/application katmaninda.
- Firebase/AsyncStorage sadece data katmaninda.
- `services/favoritesService.ts`, `services/groqService.ts`, `services/SyncService.ts` gibi dosyalarda `config/firebase` direct dependency aktif logic olarak kalmamis.
- Unit testler kritik servis davranislarini kapsiyor.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
```

Teslimat:

- Servis -> feature mapping tablosu
- Korunan storage key ve Firestore path listesi
- Shim dosya listesi
- Test sonucu

---

# Prompt 3 - Home ve Learning Ekranini Production-Ready Refactor Etme

## Verilecek Prompt

`screens/HomeScreen.tsx` dosyasini hedef mimariye tasi ve aktif Home/Learning ekranini production-ready hale getir. Bu promptun sonunda root `screens/HomeScreen.tsx` sadece shim olacak ve asil ekran `src/features/learning/presentation/screens/HomeScreen.tsx` altinda calisacak.

Once su dokumanlari oku:

- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/07-phase-4-learning.md`
- `docs/refactor-v2/13-feature-learning.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`

Yap:

1. Mevcut `screens/HomeScreen.tsx` davranisini test edilebilir parcalara ayir:
   - data loading
   - vocabulary session state
   - pronunciation/speech action
   - progress update
   - favorites action
   - streak/celebration state
   - onboarding/tutorial overlay state
   - ad/review prompt triggerlari
2. Presentation ekranini `src/features/learning/presentation/screens/HomeScreen.tsx` altina tasi.
3. Hook'lari ayir:
   - `useHomeScreen`
   - `useLearningSession`
   - `useWordActions`
   - gerekiyorsa `useTutorialOverlay`, `useCelebrationState`
4. UI alt bilesenlerini ayir:
   - word card
   - action bar
   - progress summary
   - overlays
   - empty/error/loading states
5. `AsyncStorage`, `expo-speech`, service singleton ve native SDK importlarini presentation ekranindan cikar.
6. Speech ve storage erisimini application facade/data adapter arkasina al.
7. Root `screens/HomeScreen.tsx` dosyasini `docs/refactor-v2/36-shim-and-file-move-recipes.md` tarifine uygun shim'e cevir.
8. `RootNavigator` importunu yeni public feature barrel'ine tası veya shim uzerinden gecisli tut; bu prompt sonunda aktif runtime'in yeni `src` ekranini kullandigini dogrula.
9. Test ekle:
   - loading state
   - empty state
   - word action
   - favorite toggle
   - progress action
   - speech action facade call
   - error state

Yapma:

- Home ekraninin gorunen davranisini, butonlarini, sirasini veya metinlerini keyfi degistirme.
- Tutorial, streak celebration, review/ad trigger davranisini kaldirma.
- Tek parca 1000+ satirlik yeni ekran dosyasi olusturma.

Kabul kriterleri:

- Root `screens/HomeScreen.tsx` sadece shim.
- Yeni aktif Home screen `src/features/learning/presentation/screens/HomeScreen.tsx`.
- Ana screen dosyasi 400 satirin altinda.
- Presentation dosyalarinda Firebase, AsyncStorage, Expo SDK direct importu yok.
- Home davranisi `03-current-app-behavior.md` ile uyumlu.
- Ilgili testler yesil.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
```

Teslimat:

- Home ekran parcalama haritasi
- Shim dosya durumu
- Yasak import kontrol sonucu
- Test sonucu

---

# Prompt 4 - Example Sentences, Grammar, Level Test ve Favorites Ekranlarini Tamamlama

## Verilecek Prompt

Example Sentences, grammar generation, level test ve favorites ekranlarini hedef mimariye tasi. Bu promptun sonunda ilgili root `screens/*` dosyalari shim olacak, asil implementasyonlar `src/features/*/presentation` altinda calisacak.

Once su dokumanlari oku:

- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/07-phase-4-learning.md`
- `docs/refactor-v2/12-feature-vocabulary.md`
- `docs/refactor-v2/13-feature-learning.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`

Yap:

1. Su ekranlari incele:
   - `screens/ExampleSentencesScreen.tsx`
   - `screens/LevelTestScreen.tsx`
   - `screens/FavoritesScreen.tsx`
2. Example sentences davranisini ayir:
   - sentence generation/load
   - grammar explanation
   - speech/pronunciation
   - favorite/save state
   - loading/error/empty states
3. Grammar/Groq/network erisimini presentation'dan cikar; application facade ve data client arkasina al.
4. `expo-speech` ve `AsyncStorage` importlarini presentation ekranlarindan kaldir.
5. Level test domain scoring ve persistence kurallarini application/domain altina al.
6. Favorites ekranini favorites feature public API'si ile calistir; direct service veya storage importu kullanma.
7. Root screen dosyalarini shim'e cevir:
   - `screens/ExampleSentencesScreen.tsx`
   - `screens/LevelTestScreen.tsx`
   - `screens/FavoritesScreen.tsx`
8. `RootNavigator` ve `screenRegistry` importlarini yeni public barrel'lere hazirla.
9. Test ekle:
   - example generation success/error
   - grammar explanation success/error
   - speech facade call
   - level test scoring
   - level test persistence call
   - favorites list/toggle/remove

Yapma:

- AI prompt metinlerini, response parse davranisini veya fallback davranisini keyfi degistirme.
- Level hesaplama algoritmasini davranissal gerekce olmadan degistirme.
- Favorite storage formatini degistirme.

Kabul kriterleri:

- Ilgili root screens sadece shim.
- Aktif implementasyon `src/features/*/presentation` altinda.
- Presentation dosyalarinda Firebase, AsyncStorage, Expo SDK direct importu yok.
- ExampleSentences ana screen dosyasi 400 satirin altinda.
- Level/Favorites davranisi mevcut app davranisiyla ayni.
- Testler yesil.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
```

Teslimat:

- Ekran -> feature path mapping
- Grammar/network facade ozeti
- Shim listesi
- Test sonucu

---

# Prompt 5 - Notifications Refactorunu Tamamlama

## Verilecek Prompt

Notification sistemini hedef mimariye tamamla. `services/notificationService.ts` buyuk aktif servis olmaktan cikacak; notification permission, scheduling, pending word storage, app lifecycle entegrasyonu ve platform adapter'lari `src/features/notifications` altinda ayrilacak.

Once su dokumanlari oku:

- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/10-cross-cutting-notifications.md`
- `docs/refactor-v2/15-feature-notifications.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`

Yap:

1. `services/notificationService.ts` sorumluluklarini cikar:
   - permission request/check
   - notification channel setup
   - scheduling/canceling
   - pending word repository
   - daily reminder state
   - app lifecycle hooks
   - platform-specific behavior
2. Domain modellerini saf TypeScript olarak ayir.
3. Expo Notifications erisimini data/platform adapter katmanina indir.
4. Pending word repository importlarini feature public boundary ile uyumlu hale getir.
5. App lifecycle tarafinda kullanilan API'yi application facade olarak sun.
6. Root `services/notificationService.ts` dosyasini shim veya cok ince uyumluluk wrapper'i yap.
7. Notification davranisinin mevcut izin, schedule, cancel ve reminder davranisini korudugunu testlerle dogrula.
8. iOS/Android platform farklarini mocklanabilir adapter ile izole et.

Yapma:

- Notification permission prompt zamanlamasini keyfi degistirme.
- Reminder saatleri, storage key'leri veya notification payload'larini degistirme.
- Expo Notifications'u presentation veya app provider icine direct import olarak yayma.

Kabul kriterleri:

- `services/notificationService.ts` 50 satirin altinda shim/wrapper.
- Expo Notifications sadece notification data/platform adapter katmaninda.
- App/provider katmani notification facade kullanir.
- Notification testleri permission, schedule, cancel, pending word ve error path'lerini kapsar.
- Tip kontrolu ve testler yesil.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
```

Teslimat:

- Notification architecture ozeti
- Eski servis shim durumu
- Platform adapter listesi
- Test sonucu

---

# Prompt 6 - Settings, Setup, Onboarding ve Auth Screens Refactorunu Tamamlama

## Verilecek Prompt

Settings, Setup, Onboarding ve Auth screen refactorunu tamamla. Bu promptun sonunda bu ekranlar root `screens/` altinda aktif logic tasimayacak, asil implementasyonlar ilgili `src/features/*/presentation` path'lerinde olacak.

Once su dokumanlari oku:

- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/05-phase-2-auth-profile.md`
- `docs/refactor-v2/08-cross-cutting-auth.md`
- `docs/refactor-v2/14-feature-settings.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`

Yap:

1. Su ekranlari refactor et:
   - `screens/SettingsScreen.tsx`
   - `screens/SetupScreens.tsx`
   - `screens/OnboardingScreen.tsx`
   - `screens/AuthScreens.tsx`
   - `screens/ForgotPasswordScreen.tsx`
2. Settings sorumluluklarini ayir:
   - profile display/edit
   - avatar/image picker flow
   - language/level preferences
   - notification settings
   - account actions
   - sign out/delete account flow
   - legal/support links
3. Setup sorumluluklarini ayir:
   - onboarding/setup form state
   - preference persistence
   - profile update
   - completion state
4. Auth screens sorumluluklarini ayir:
   - login/register form state
   - forgot password
   - validation
   - auth facade calls
5. Firebase, Firestore, `updateProfile`, `AsyncStorage`, ImagePicker ve notification SDK erisimlerini presentation'dan cikar.
6. Gerekli native/SDK islerini application facade veya data/platform adapter arkasina al.
7. Root screen dosyalarini shim'e cevir.
8. Ana screen dosyalarini 400 satirin altina indir.
9. Test ekle:
   - settings profile load/update
   - avatar picker success/cancel/error
   - setup completion
   - auth login/register validation
   - forgot password success/error
   - sign out/delete account confirmation flow

Yapma:

- Auth ve setup route davranisini degistirme.
- Kullanici profil field'larini veya preference storage key'lerini degistirme.
- Form validation mesajlarini gereksiz yere degistirme.
- Settings gorunur bilgi mimarisini keyfi yeniden tasarlama.

Kabul kriterleri:

- Root screen dosyalari sadece shim.
- `SettingsScreen`, `SetupScreens`, `AuthScreens` ana implementasyonlari 400 satirin altinda.
- Presentation'da Firebase, AsyncStorage, Expo SDK veya ImagePicker direct importu yok.
- Setup/Auth/Settings davranisi `03-current-app-behavior.md` ile uyumlu.
- Testler yesil.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
```

Teslimat:

- Ekran parcalama haritasi
- Facade/adapter listesi
- Shim durumu
- Test sonucu

---

# Prompt 7 - Shared Katman, UI Bilesenleri, Config ve Import Boundary Hardening

## Verilecek Prompt

Shared katmani tamamla ve import boundary kurallarini sertlestir. Bu promptun sonunda root `components`, `utils`, `config` aktif implementation alani olmaktan cikacak; ortak kodlar `src/shared` altinda olacak ve eski root dosyalari shim olacak.

Once su dokumanlari oku:

- `docs/refactor-v2/02-target-architecture.md`
- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/11-cross-cutting-ui-theme.md`
- `docs/refactor-v2/16-shared-modules.md`
- `docs/refactor-v2/17-platform-integration.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`

Yap:

1. Root shared adaylarini incele:
   - `components/*`
   - `utils/*`
   - `config/*`
2. Gercekten shared olanlari `src/shared` altina tasi:
   - UI components
   - typography/theme/colors
   - platform helpers
   - storage abstractions
   - logger/error helpers
   - test utilities
3. Feature-specific component veya helper'lari ilgili feature altina tasi.
4. Root dosyalari shim'e cevir.
5. Firebase config icin tek dogru entrypoint belirle:
   - SDK initialization app/data composition tarafinda kalsin
   - presentation/domain direct import yapmasin
6. `src` icindeki root importlarini yeni alias/public path'lere tası.
7. Feature public barrel'lerini tamamla:
   - `src/features/*/index.ts`
   - sadece public API export et
   - data implementation detaylarini export etme
8. Import boundary kontrol komutlari veya lint rule'lari ekle/guncelle:
   - domain icinde SDK importu yasak
   - presentation icinde Firebase/AsyncStorage/Expo SDK direct importu yasak
   - feature deep importlari yasak
9. `src/devtools/screenRegistry.ts` icindeki screen importlarini yeni public path'lere tası.

Yapma:

- UI davranisini veya tasarimini keyfi degistirme.
- Her helper'i shared'a atma; feature-specific kod feature icinde kalacak.
- Data implementationlarini public barrel'den export etme.

Kabul kriterleri:

- `src/shared` ortak kodlarin ana evi.
- Root `components`, `utils`, `config` dosyalari shim veya migration wrapper karakterinde.
- `src` icinde `../../screens`, `../../../screens`, `../services`, `../config` gibi eski root importlari kalmamis.
- Import boundary rule/test mekanizmasi var ve yesil.
- Domain ve presentation yasak import kontrolleri yesil.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
npm run test:rules
```

Teslimat:

- Shared module mapping
- Public barrel listesi
- Boundary rule/test ozeti
- Yasak import tarama sonucu

---

# Prompt 8 - Phase 9 Shim Silme, Dead Code Temizligi ve CI Hardening

## Verilecek Prompt

Phase 9 cleanup yap. Bu prompt sadece Prompt 1-7 kabul kriterleri tamamen yesil olduktan sonra uygulanacak. Amac eski root shim'lerini silmek, dead code'u temizlemek, importlari tamamen `src` mimarisine almak ve CI/lint/test kalitesini production-ready hale getirmektir.

Once su dokumanlari oku:

- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/29-phase-9-cleanup-performance-hardening.md`
- `docs/refactor-v2/30-acceptance-checklist.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`
- `docs/refactor-v2/36-shim-and-file-move-recipes.md`
- `docs/refactor-v2/39-phase-pr-breakdown.md`

Baslamadan once dogrula:

- `src` icinde root `screens`, `services`, `context`, `components`, `config`, `utils` importu yok.
- Root shim dosyalari disinda aktif logic kalmamis.
- Tum aktif route importlari `src/features/*` veya `src/app` public path'lerinden geliyor.
- Tum Prompt 1-7 testleri yesil.

Yap:

1. Root shim importlarini kullanan son dosyalari yeni `src` public path'lerine tası.
2. Root shim dosyalarini sil:
   - `screens/*`
   - `services/*`
   - `context/*`
   - `components/*`
   - `config/*`
   - `utils/*`
   Sadece gercekten artik import edilmeyen shim'leri sil.
3. Dead code tespiti yap ve kullanilmayan dosyalari kaldir.
4. `tsconfig`, Jest config, Babel/Metro alias config ve ESLint import rule'larini yeni mimariye gore sertlestir.
5. `src/app/navigation/RootNavigator.tsx` ve `src/devtools/screenRegistry.ts` tamamen yeni public API'leri kullansin.
6. Coverage gap'lerini kapat:
   - auth
   - profile
   - learning
   - vocabulary
   - notifications
   - settings/setup
7. Secret scan yap; credential veya token olmadigini dogrula.
8. Bundle/performance smoke audit yap:
   - gereksiz duplicate import
   - dev-only code production'a siziyor mu
   - heavy module lazy loading gerekir mi

Yapma:

- Firestore production data cleanup yapma.
- Storage key veya payload schema degistirme.
- Native iOS klasorunu refactor cleanup PR'ina karistirma.
- Testleri silerek yesil yapma.

Kabul kriterleri:

- Tum aktif uygulama kodu `src/app`, `src/features`, `src/shared` altinda.
- Root eski klasorler ya yok ya da sadece repo tarafindan bilincli tutulan dokuman/asset iceriyor.
- `rg "../../screens|../../../screens|../services|../config|../context" src` bos veya bilerek dokumante edilmis istisna dondurur.
- `HomeScreen`, `SettingsScreen`, `SetupScreens`, `AuthScreens` ana implementasyonlari 400 satirin altinda.
- `AuthContext` 200 satirin altinda veya public provider shim'i.
- Domain/presentation yasak import kontrolleri yesil.
- Full CI yesil.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
npm run prettier:check
npm run test:rules
```

Ek taramalar:

```bash
rg "../../screens|../../../screens|../services|../config|../context" src
rg "from ['\\\"](firebase|@react-native-async-storage|expo-|react-native-image-picker)" src/features src/app src/shared
```

Teslimat:

- Silinen shim/dead code listesi
- Kalan istisna listesi
- Full CI sonucu
- Production readiness durumu

---

# Prompt 9 - Firestore Legacy Field Cleanup Icin Ayrik ve Onayli Migration

## Verilecek Prompt

Bu prompt production verisine dokunabilecek Firestore legacy field cleanup icindir. Bu promptu sadece repo sahibi acikca onay verdikten, Prompt 8 tamamen bittikten ve migration/backup plani kabul edildikten sonra uygula.

Once su dokumanlari oku:

- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/06-phase-3-data-sync.md`
- `docs/refactor-v2/09-cross-cutting-sync.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/29-phase-9-cleanup-performance-hardening.md`
- `docs/refactor-v2/30-acceptance-checklist.md`

Baslamadan once zorunlu onay sor:

- Hangi environment hedefleniyor: dev, staging, production?
- Firestore backup alindi mi?
- Rollback plani yazildi mi?
- Eski app versiyonlari icin compatibility window kapandi mi?
- Dual-write kapatilacak mi, yoksa sadece audit mi yapilacak?

Yap:

1. Legacy field ve collection kullanimlarini statik olarak tara.
2. Runtime repository kodunda hala legacy read/write var mi dogrula.
3. Migration script'i dry-run destekli yaz:
   - kac dokuman etkilenecek
   - hangi field silinecek/tasinacak
   - once/sonra ornek payload
   - hata halinde durma ve raporlama
4. Backup/restore talimatini dokumante et.
5. Staging veya emulator uzerinde migration test et.
6. Production icin default davranisi dry-run yap; destructive mode explicit flag gerektirsin.
7. Migration sonucunu audit log olarak yazdir.

Yapma:

- Onay almadan production data silme.
- Backup olmadan destructive operation calistirma.
- App'in eski versiyonlari hala legacy field bekliyorsa field silme.
- Migration script'ini otomatik production destructive mode ile calistirma.

Kabul kriterleri:

- Migration script dry-run ile guvenli calisiyor.
- Etkilenecek dokuman sayisi raporlanabiliyor.
- Backup/rollback dokumani var.
- Emulator/staging test sonucu kayitli.
- Production destructive run icin explicit onay ve flag gerekiyor.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:rules
npm run lint
```

Teslimat:

- Migration script path'i
- Dry-run raporu
- Backup/rollback dokumani
- Production onay checklist'i

---

# Prompt 10 - Final Production Readiness ve Release Gate

## Verilecek Prompt

Tum refactor tamamlandiktan sonra final production readiness audit yap. Bu promptun amaci yeni ozellik eklemek degil, refactorun eksiksiz ve guvenli sekilde release edilebilir oldugunu kanitlamaktir.

Once su dokumanlari oku:

- `docs/refactor-v2/03-current-app-behavior.md`
- `docs/refactor-v2/18-definition-of-done.md`
- `docs/refactor-v2/30-acceptance-checklist.md`
- `docs/refactor-v2/31-implementation-order.md`
- `docs/refactor-v2/33-layer-contracts-and-import-rules.md`

Yap:

1. Davranis checklist'i hazirla ve `03-current-app-behavior.md` icindeki her maddeyi tek tek dogrula.
2. Static architecture audit yap:
   - kod sadece `src/app`, `src/features`, `src/shared` altinda mi?
   - domain saf mi?
   - presentation SDK import etmiyor mu?
   - feature deep import yok mu?
3. Test audit yap:
   - unit
   - integration
   - rules/emulator
   - navigation/provider smoke
4. Manual smoke test checklist'i hazirla:
   - cold start
   - onboarding
   - register/login/logout
   - setup complete
   - home learning flow
   - favorite toggle
   - example sentences/grammar
   - level test
   - notifications permission/schedule
   - settings profile update
   - offline/cache scenario
5. Build/simulator smoke icin komutlari calistir veya calistirilamiyorsa nedenini yaz:
   - iOS simulator
   - Android emulator varsa Android
6. Performance ve bundle risklerini kontrol et.
7. Secret scan ve env audit yap.
8. Sonucu `docs/refactor-v2/44-final-production-readiness-report.md` dosyasina yaz.

Yapma:

- Yeni feature ekleme.
- Davranis degistirme.
- Buyuk refactor baslatma. Eksik bulursan bloklayici olarak raporla ve ilgili onceki prompta geri don.

Kabul kriterleri:

- `44-final-production-readiness-report.md` her acceptance maddesini `pass`, `fail` veya `not applicable` olarak isaretler.
- Fail olan madde varsa release hazir denmez.
- Full CI yesil.
- Manual smoke checklist net ve uygulanabilir.
- Kalan riskler acikca yazilmis.

Calistir:

```bash
npm run typecheck
npm test -- --runInBand
```

Projede varsa ayrica:

```bash
npm run test:ci
npm run lint
npm run prettier:check
npm run test:rules
```

Teslimat:

- `docs/refactor-v2/44-final-production-readiness-report.md`
- Full command result summary
- Release karari: `ready`, `blocked`, veya `ready with documented risk`

---

## Onerilen Uygulama Sirasi

1. Prompt 0 ile baseline raporu olustur.
2. Prompt 1 ile Auth/Profile/Sync katmanini tamamla.
3. Prompt 2 ile temel servis/data katmanini tamamla.
4. Prompt 3 ile Home/Learning ekranini tasi.
5. Prompt 4 ile Example Sentences, Grammar, Level Test ve Favorites ekranlarini tasi.
6. Prompt 5 ile Notifications katmanini tamamla.
7. Prompt 6 ile Settings/Setup/Onboarding/Auth screens refactorunu tamamla.
8. Prompt 7 ile shared/import boundary sertlestirmesini yap.
9. Prompt 8 ile Phase 9 shim silme ve CI hardening yap.
10. Prompt 9'u sadece production data cleanup icin ayrik onayla uygula.
11. Prompt 10 ile final release gate raporunu uret.

Bu sira bozulmamalidir. Ozellikle Prompt 8, onceki promptlar tamamlanmadan calistirilmamalidir. Prompt 9 ise refactorun zorunlu parcasi degil, production data migration parcasi olarak ayrik onayla ele alinmalidir.
