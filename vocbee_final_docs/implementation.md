# VocBee Production-Ready Implementation Plan

Bu dokuman, `vocbee_final_docs` altindaki audit, fix guide, release checklist ve evidence log dosyalarinin tam incelemesine gore hazirlanmis uygulama planidir. Amac, VocBee'yi production release icin kanitlanabilir sekilde hazir hale getirmektir.

Kaynak dokumanlar:

- `VOCBEE_PRODUCTION_AUDIT.md`: Ana karar, bulgular, servis bazli analiz, UI/i18n denetimi, CI/test plani.
- `VOCBEE_PRODUCTION_FIX_GUIDE.md`: Uygulanabilir P0/P1/P2 duzeltme rehberi.
- `VOCBEE_RELEASE_CHECKLIST.md`: Go/no-go checklist.
- `VOCBEE_AUDIT_EVIDENCE_SUMMARY.json`: Makine okunabilir bulgu ve metrik ozeti.
- `evidence_logs/*`: TypeScript, Jest, functions build/lint, npm audit ve locale kanit loglari.
- `VOCBEE_PRODUCTION_AUDIT_COMBINED.pdf`: Audit, fix guide ve checklist birlesik PDF ciktisi.

## 1. Production Karari

Mevcut durum: production-ready degil.

Release blocker durumlar:

- TypeScript gate fail: `evidence_logs/tsc-root.log` 750 TypeScript hatasi iceriyor.
- Jest gate fail: `evidence_logs/jest-root.log` 4 failed suite, 12 failed test, 155 passed test raporluyor.
- Firebase Functions build fail: `functions/src/index.ts` unused import hatalari.
- Firebase Functions lint fail: unused import warning ve object-curly-spacing error.
- Root production npm audit fail: 1 critical, 7 high, 20 moderate.
- Functions production npm audit fail: 1 critical, 3 high, 11 moderate, 2 low.
- Android RevenueCat production key eksik.
- Grammar proxy auth/rate-limit/schema/error-sanitization acisindan production icin yetersiz.
- Firestore security rules ve emulator rule tests yok.
- Sync ve account deletion akislarinda data integrity riski var.

Release karari ancak bu dokumandaki P0 maddeler tamamlanip kanit loglari yesile dondugunde "go" olabilir.

## 2. Uygulama Ilkeleri

- Once kanit ureten kalite kapilari duzeltilecek: typecheck, tests, lint, build, audit.
- Security ve data integrity isleri UI polish oncesinde tamamlanacak.
- Kod degisiklikleri kucuk, test edilebilir ve geri alinabilir PR/parcalar halinde yapilacak.
- Her P0/P1 madde icin kabul kriteri ve dogrulama komutu olacak.
- Dashboard veya store console gibi repo disi ayarlar checklist ile kanitlanacak.
- `npm audit fix --force` dogrudan uygulanmayacak; Expo SDK, React Native ve Firebase uyumlulugu kontrol edilerek upgrade yapilacak.
- Secrets `EXPO_PUBLIC_*` icinde yalnizca public client config icin kullanilacak; server secret client bundle'a girmeyecek.

## 3. Faz 0 - Baseline ve CI Iskeleti

Hedef: tekrar edilebilir production gate olusturmak.

Degisecek dosyalar:

- `package.json`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.test.json`
- `.github/workflows/mobile-ci.yml` veya mevcut CI dosyasi
- Gerekirse `firebase.json`

Adimlar:

1. `package.json` scriptlerini ekle:

```json
{
  "typecheck": "tsc -p tsconfig.app.json --noEmit",
  "typecheck:test": "tsc -p tsconfig.test.json --noEmit",
  "test:ci": "jest --runInBand",
  "audit:prod": "npm audit --omit=dev --audit-level=high",
  "functions:lint": "npm --prefix functions run lint",
  "functions:build": "npm --prefix functions run build"
}
```

2. Root `tsconfig.json` dosyasini ortak compiler options icin bir base haline getir.
3. `tsconfig.app.json` ile app kodunu derle; tests, coverage, functions ve generated raporlari exclude et.
4. `tsconfig.test.json` ile testleri derle; `jest`, `node` ve mevcut mock/global ihtiyaclarini types/include altinda tanimla.
5. Functions root tsconfig'e girmeyecek; kendi `functions/tsconfig.json` dosyasi ile derlenecek.
6. CI workflow'a su sirayi ekle:

```bash
npm ci
npm run typecheck
npm run typecheck:test
npm run test:ci
npm run audit:prod
npm --prefix functions ci
npm --prefix functions run lint
npm --prefix functions run build
```

Kabul kriterleri:

- `npm run typecheck` sadece app kodunu kontrol eder ve yesil olur.
- `npm run typecheck:test` test tiplerini kontrol eder ve yesil olur.
- CI kirmizi durumda release build veya deploy calismaz.

## 4. Faz 1 - Jest ve TypeScript Release Gate

Hedef: mevcut otomatik kontrolleri yesile cevirmek.

### 4.1 storage.test.ts

Sorun:

- `saveLocalProgress` ve `getLocalProgress` artik `services/storage.ts` icinden export edilmiyor.

Secenek A, tercih edilen:

- Testleri yeni `progressService` davranisina tasimak.
- Storage testlerini sadece storage sorumluluklari icin daraltmak.

Secenek B, backward-compatible:

- `services/storage.ts` icine compatibility wrapper eklemek.
- Wrapper'lar mevcut local progress key ve sync flag davranisini korumali.

Kabul kriterleri:

- `services/__tests__/storage.test.ts` yesil.
- Progress save/get davranisi data kaybi uretmiyor.
- Local mutation sonrasi sync flag isaretleniyor.

### 4.2 streakService.test.ts

Sorun:

- Zaman bagimli restore testi deterministik degil; expected 3, received 0.

Adimlar:

- `getTodayKey(now = new Date())` veya service factory ile zaman injection ekle.
- Testlerde fake timers kullan ve teardown'da restore et.
- Restore/clear semantics netlestir: cloud restore hangi durumda streak'i saklar veya temizler.

Kabul kriterleri:

- `services/__tests__/streakService.test.ts` yesil.
- Timezone/day boundary icin en az bir regresyon testi var.

### 4.3 ErrorBoundary.test.tsx

Sorun:

- HOC export nedeniyle `ErrorBoundary.getDerivedStateFromError` static method olarak gorunmuyor.
- Production ekranda `error.toString()` kullaniciya gosteriliyor.

Adimlar:

- `ErrorBoundaryInner` class export et.
- `ErrorBoundary` HOC export'unu koru.
- Test static method'u `ErrorBoundaryInner.getDerivedStateFromError` uzerinden test etsin.
- Production'da internal error detail sadece `__DEV__` modda render edilsin.
- Deprecated `SafeAreaView` kullanimini `react-native-safe-area-context` ile uyumlu hale getir.

Kabul kriterleri:

- `components/__tests__/ErrorBoundary.test.tsx` yesil.
- Production build hata detayini kullaniciya basmaz.

### 4.4 OfflineNotice.test.tsx

Sorun:

- Bagliyken component opacity 0 ile tree'de kaliyor; tests ve accessibility bekleneni ile uyumsuz.

Product karari:

- Ilk render bagliysa `null` don.
- Daha once offline state gorulduyse animasyon korunabilir, fakat connected state'te accessibility tree'den saklanmali.

Adimlar:

- `isConnected !== false` durumunu "online veya bilinmeyen ama offline degil" olarak ele al.
- Bagliyken `accessibilityElementsHidden` ve `importantForAccessibility="no-hide-descendants"` kullan.
- Testleri bu karara gore guncelle.

Kabul kriterleri:

- `components/__tests__/OfflineNotice.test.tsx` yesil.
- Screen reader connected state'teki hidden banner'i okumaz.

## 5. Faz 2 - Firebase Functions Karari

Hedef: deploy zincirindeki functions kirmizisini kapatmak.

Degisecek dosyalar:

- `functions/src/index.ts`
- `functions/package.json`
- `functions/tsconfig.json`
- `firebase.json`

Karar A, functions kullanilmiyorsa:

- Template functions scaffold'u deploy/predeploy zincirinden kaldir.
- `firebase.json` predeploy scriptlerini temizle.
- Root CI'da functions adimlari dokumante edilmis sekilde atlanir veya kaldirilir.

Karar B, functions kullanilacaksa:

- `functions/src/index.ts` icindeki unused imports temizlenir.
- Gercek callable/HTTPS endpoint yazilir.
- ESLint object-curly-spacing duzeltilir.
- Functions dependency audit upgrade plani uygulanir.

Kabul kriterleri:

- `npm --prefix functions run lint` yesil.
- `npm --prefix functions run build` yesil.
- Kullanilmayan template fonksiyon deploy edilmez.

## 6. Faz 3 - RevenueCat Production Guard

Hedef: Android production monetization akisini garanti altina almak.

Degisecek dosyalar:

- `eas.json`
- `services/revenueCatService.ts`
- `context/MonetizationContext.tsx`
- Gerekirse docs/checklist dosyalari

Adimlar:

1. Production EAS profile'a Android RevenueCat key ekle:

```json
"EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY": "goog_..."
```

2. iOS key mevcut kalir:

```json
"EXPO_PUBLIC_REVENUECAT_IOS_API_KEY": "appl_..."
```

3. Startup guard ekle:

```ts
if (!__DEV__ && Platform.OS === 'android' && !process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY) {
  throw new Error('Missing Android RevenueCat key');
}
```

4. Test key ve production key ayrimini netlestir; production'da test key kabul edilmez.
5. Store sandbox smoke testlerini release checklist'e kanit olarak ekle.

Kabul kriterleri:

- Android internal testing AAB RevenueCat configure hatasi vermiyor.
- Purchase, restore, entitlement `ad_free`, logout/login ve customer center akislari test edildi.
- Free user icin ads gorunur, paid user icin ads kalkar.

## 7. Faz 4 - Grammar Proxy Hardening

Hedef: Groq proxy endpoint'ini abuse, maliyet ve veri sizintisi risklerine karsi production seviyesine getirmek.

Degisecek dosyalar:

- `api/grammarProxy.js`
- `proxy/grammar-worker.ts`
- `services/groqService.ts`
- Gerekirse Firebase/App Check entegrasyon dosyalari

Adimlar:

1. Sadece `POST` kabul et; diger method'lar 405 donsun.
2. `Content-Type: application/json` zorunlu olsun.
3. Body max 2 KB ile sinirlansin.
4. `sentence1` ve `sentence2`: string, trim, 1-280 char.
5. `outputLanguage` allowlist ile sinirlansin; prompt'a serbest metin olarak girmesin.
6. Firebase ID token veya App Check token dogrulansin.
7. Rate limit memory map yerine durable storage kullan:
   - Cloudflare Durable Object, KV veya Upstash
   - uid + ip bazli limit
   - anon abuse engeli
8. Groq request'i `AbortController` ile 10-15 sn timeout'a bagla.
9. Groq error'larini sanitize et; client'a ham provider hatasi donme.
10. Response schema validate et:

```ts
type GrammarResponse = {
  sentence1: { structure: string; grammar: string; reason: string };
  sentence2: { structure: string; grammar: string; reason: string };
};
```

11. AI response field length cap koy.
12. PII icermeyen audit log ekle.

Kabul kriterleri:

- Auth/App Check yoksa 401/403.
- Rate limit asilirsa 429.
- Invalid body 400.
- Groq timeout 504 veya generic 502.
- Client'a provider secret, stack trace veya ham exception donmez.
- Unit/integration tests abuse path'lerini kapsar.

## 8. Faz 5 - Firestore Rules ve Emulator Tests

Hedef: client-side checks disinda server-side data isolation kanitlamak.

Yeni veya degisecek dosyalar:

- `firestore.rules`
- `firestore.indexes.json` gerekiyorsa
- `firebase.json`
- `tests/firestore.rules.test.ts` veya benzer test konumu
- `package.json`

Rules gereksinimleri:

- Auth olmayan istek denied.
- `users/{uid}` icin `request.auth.uid == uid`.
- Baska kullanicinin dokumani read/write/delete denied.
- Unknown top-level fields denied veya kontrollu allowlist.
- `preferences.level` allowlist ile validate.
- `progress.learnedWords` map/list tipiyle validate.
- `streak.currentStreak` negatif olamaz.
- `notificationSettings` beklenen shape disinda reddedilir.
- Deletion flow icin server/admin yoluna uygun model dokumante edilir.

Emulator testleri:

- Kendi dokumanini read/write success.
- Baska uid read/write denied.
- Auth olmadan denied.
- Invalid progress type denied.
- Invalid preferences level denied.
- Negative streak denied.
- Unknown field denied.

Kabul kriterleri:

- Firestore rules emulator tests CI'da yesil.
- Firestore rules deploy komutu release checklist'e ekli.
- App Check enforcement dashboard'da dogrulandi.

## 9. Faz 6 - Sync Data Integrity

Hedef: favorites/progress/streak/preferences sync akisinda partial failure ve cloud overwrite kaynakli data loss riskini kapatmak.

Degisecek dosyalar:

- `services/SyncService.ts`
- `services/favoritesService.ts`
- `services/progressService.ts`
- `services/streakService.ts`
- `services/storage.ts`
- Ilgili testler

Adimlar:

1. `syncFavoritesToFirebase` hata yutmasin; failure durumunda throw etsin.
2. `syncToFirestore` alt sync islemlerini `Promise.allSettled` ile toplasin.
3. Tek bir alt sync fail olursa `LAST_SYNC` ve sync flag temizlenmesin.
4. Her data domain'e metadata ekle:
   - `updatedAt`
   - `version`
   - `updatedByDeviceId`
5. Local mutation sonrasi domain-level dirty flag veya `pendingOps[]` olustur.
6. `shouldSync` sadece 24 saat mantigina bagli kalmasin:
   - mutation sonrasi debounce
   - foreground/background
   - network regain
   - logout force sync
7. Cloud restore oncesi `needsSync` kontrol et.
8. Local dirty varsa cloud overwrite yapma; merge/conflict queue olustur.
9. Domain merge stratejisi:
   - Favorites: union + duplicate cleanup
   - Progress: learned words union, current level explicit user action
   - Streak: max/best + day key validation
   - Preferences: explicit latest user action
10. `setCurrentLevel` ve `resetProgress` sync flag davranisini duzelt.

Kabul kriterleri:

- Favorites sync fail ederse sync flag temizlenmez.
- Offline mutation online olunca kaybolmaz.
- Cloud restore local unsynced datayi ezmez.
- Iki cihaz conflict testi dokumante edilir.
- Logout/reinstall/switch-device senaryolari test edilir.

## 10. Faz 7 - Account Deletion ve Local Purge

Hedef: Auth, Firestore ve local data temizligini atomik/idempotent hale getirmek.

Degisecek dosyalar:

- `context/AuthContext.tsx`
- `services/storage.ts`
- `services/storageKeys.ts`
- Gerekirse Cloud Function/callable endpoint
- Account deletion tests

Tercih edilen akiskan:

1. Kullanici reauth yapar.
2. Server/callable deletion request olusturulur.
3. Cloud Function Firestore ve Storage cleanup yapar.
4. Auth user delete edilir.
5. Local full purge yapilir.

Client-only kalacaksa minimum siralama:

1. Reauth gate en basta.
2. `deleteUser(user)` recent-login hatasini once tetikler.
3. Sonra Firestore cleanup.
4. Sonra `clearAllLocalData({ fullPurge: true })`.

Local purge gereksinimleri:

- `profile_${uid}` prefix temizlenir.
- Review prompt state, cached user profile, notification state, sync flags temizlenir.
- Device ID logout icin korunabilir; account deletion icin full purge ile silinir.
- Shared device senaryosu test edilir.

Kabul kriterleri:

- `auth/requires-recent-login` durumunda cloud data yanlis sirayla silinmez.
- Delete retry idempotenttir.
- Auth user kalip Firestore dokumani silinmis yari durum uretilmez.

## 11. Faz 8 - Dependency Security

Hedef: critical/high audit bulgularini kapatmak veya resmi risk kabul dokumaniyla mitigation altina almak.

Root audit kritik/high paketleri:

- `protobufjs`: critical
- `@isaacs/brace-expansion`: high
- `@xmldom/xmldom`: high
- `minimatch`: high
- `node-forge`: high
- `picomatch`: high
- `tar`: high
- `undici`: high

Functions audit kritik/high paketleri:

- `protobufjs`: critical
- `fast-xml-parser`: high
- `node-forge`: high
- `path-to-regexp`: high

Adimlar:

1. `npm audit --omit=dev --json` ciktisini mevcut lockfile ile yeniden al.
2. Transitive dependency chain'i tespit et.
3. Expo SDK 54 ve React Native 0.81 uyumlulugunu koruyarak patch/minor upgrade dene.
4. Firebase/functions tarafinda `firebase-admin` ve `firebase-functions` major upgrade gereksinimini ayri branchte test et.
5. `npm audit fix --force` ancak kontrollu migration branch'inde, full test matrix ile denenir.
6. Kapatilamayan bulgular icin risk acceptance dosyasi olustur:
   - package
   - severity
   - reachable olup olmadigi
   - mitigation
   - owner
   - review date

Kabul kriterleri:

- `npm run audit:prod` high+ icin yesil veya belgelenmis istisna var.
- Functions audit high+ icin yesil veya functions kullanilmiyorsa deploy chain'den cikmis.

## 12. Faz 9 - Privacy, Permissions ve Legal Copy

Hedef: uygulamadaki privacy metni, store permission descriptions ve gercek veri akislarini uyumlu hale getirmek.

Degisecek dosyalar:

- `app.json`
- `privacypolicy.md`
- `privacy_policy.tex`
- `delete_account.html`
- `locales/en.ts`
- `locales/tr.ts`
- Diger locale dosyalari
- Settings/privacy UI

Adimlar:

1. `RECORD_AUDIO` izni icin karar ver:
   - Aktif recording feature yoksa `app.json` icinden kaldir.
   - Kullanilacaksa feature, prompt ve privacy policy ile tam uyumlu hale getir.
2. In-app privacy modalini gercek veri akisiyla guncelle:
   - Firebase Auth
   - Firestore cloud sync
   - AsyncStorage/local storage
   - RevenueCat
   - AdMob/UMP/ATT
   - Groq grammar proxy
   - Expo services
   - deletion/retention
3. Store permission descriptions ile gercek feature'lari eslestir.
4. Delete account sayfasini uygulama akisiyle tutarli hale getir.
5. Hukuki metinleri hukuk/uyumluluk kontrolune isaretle.

Kabul kriterleri:

- In-app privacy copy "veriler sadece cihazda" gibi yanlis izlenim vermez.
- Store privacy form ve app copy tutarlidir.
- RECORD_AUDIO ya kaldirilmis ya da gercek feature ile gerekcelendirilmis.

## 13. Faz 10 - i18n ve Hardcoded Text

Hedef: 21 dilde structural completeness'i kalite ve UI tasma gate'i ile desteklemek.

Mevcut kanit:

- 21 dil.
- English key count: 343.
- Missing/extra/empty key: 0.
- Placeholder mismatch: 0.
- Same-as-English warning olan diller var.

Degisecek dosyalar:

- `locales/*.ts`
- `screens/ExampleSentencesScreen.tsx`
- `services/nativeGoogleSignIn.ts`
- `context/AuthContext.tsx`
- i18n lint scriptleri

Adimlar:

1. Hardcoded accessibility labels locale dosyalarina tasinacak:
   - `Play word pronunciation`
   - `Explain grammar with AI`
   - `Go back`
   - `Close modal`
   - `Retry loading explanation`
2. Google/Apple auth error metinleri i18n'e tasinacak.
3. `scripts/syncLocales.js` CI gate'e baglanacak veya yeni `i18n-lint` script eklenecek.
4. Same-as-English raporu native speaker QA listesine donusturulecek.
5. Pseudo-localization script veya test modu eklenecek.
6. RTL dilleri icin reload/restart prompt uygulanacak.

Kabul kriterleri:

- Missing/extra/empty/placeholder mismatch 0 kalir.
- Hardcoded visible/accessibility English taramasi temizlenir veya allowlist dokumante edilir.
- de/fr/tr/ar/fa/ur/hi icin uzun metin QA snapshotlari tamamlanir.

## 14. Faz 11 - UI/UX Responsive ve Accessibility QA

Hedef: UI'nin device, font scale, orientation, RTL ve theme matrix'inde guvenilir olmasi.

Degisecek dosyalar:

- `screens/HomeScreen.tsx`
- `screens/SettingsScreen.tsx`
- `screens/SetupScreens.tsx`
- `components/HomeHeader.tsx`
- `components/OfflineNotice.tsx`
- `utils/typography.ts`
- Ilgili UI tests

Adimlar:

1. Module scope `Dimensions.get('window')` kullanimlarini `useWindowDimensions` ile degistir.
2. Tablet strategy belirle:
   - maxWidth
   - centered content
   - orientation karari
3. Body text icin display font kullanimini azalt; display font heading/brand ile sinirla.
4. Uzun cevirilerde `numberOfLines` ve truncation davranisini gozden gecir.
5. Large text fontScale 1.3, 1.6, 2.0 testleri yap.
6. RTL reload prompt ve logical spacing kontrolu yap.
7. Dark/light mode screenshot QA tamamla.

QA matrix:

- 320-360px Android: login, setup, home, examples modal, settings modals.
- iPhone SE: keyboard, forgot password, paywall, modal overflow.
- Large iPhone/Android: header alignment, card proportions, ad overlap.
- iPad/tablet: maxWidth, bosluklar, orientation karari.
- Large text: 120%, 150%, 200%.
- RTL: Arabic, Farsi, Urdu onboarding/settings/modal buttons.
- Dark mode: splash, error boundary, offline banner, paywall.

Kabul kriterleri:

- On-screen text incoherent overlap uretmez.
- Connected offline banner accessibility tree'de gorunmez.
- Tablet support karari dokumante edilir.

## 15. Faz 12 - Release Go/No-Go

Release oncesi zorunlu komutlar:

```bash
npm ci
npm run typecheck
npm run typecheck:test
npm run test:ci
npm run audit:prod
npm --prefix functions ci
npm --prefix functions run lint
npm --prefix functions run build
```

Eger functions kullanilmiyorsa:

- Functions klasoru/predeploy release chain'den resmi olarak kaldirilmis olmali.
- CI bu karari yansitmali.
- Firebase deploy dokumani guncellenmeli.

Dashboard/store dogrulamalari:

- Firebase Auth providers.
- Firestore rules deployed.
- App Check enabled where supported.
- RevenueCat iOS/Android products and entitlement `ad_free`.
- AdMob app IDs/ad unit IDs.
- UMP/ATT consent.
- Groq proxy secret server-side.
- EAS production env values.
- App Store / Play Store internal test smoke.

Go kriterleri:

- Tum P0 maddeler kapali.
- P1 maddeler kapali veya owner/date/mitigation iceren kabul edilmis risk dokumani var.
- P2 maddeler icin QA matrix tamamlanmis veya release notunda bilincli scope karari var.
- `VOCBEE_RELEASE_CHECKLIST.md` tamamlanmis.
- Yeni kanit loglari `vocbee_final_docs/evidence_logs` altinda veya CI artifact olarak saklanmis.

No-go kriterleri:

- TypeScript, Jest, functions build/lint veya high+ audit kirmizi.
- Android RevenueCat key eksik.
- Firestore rules test edilmemis.
- Grammar proxy authsiz public endpoint olarak kaliyor.
- Account deletion recent-login yari silme riski devam ediyor.
- Sync flag partial failure'da temizlenebiliyor.

## 16. Onerilen PR Sirasi

1. PR-01: CI/typecheck/test scriptleri ve tsconfig ayrimi.
2. PR-02: Jest failures ve ErrorBoundary production detail fix.
3. PR-03: Functions scaffold karari ve build/lint yesil.
4. PR-04: RevenueCat Android key guard ve smoke checklist.
5. PR-05: Grammar proxy hardening.
6. PR-06: Firestore rules + emulator tests.
7. PR-07: Sync failure propagation ve conflict-safe restore.
8. PR-08: Account deletion + full local purge.
9. PR-09: Dependency audit upgrades/risk acceptance.
10. PR-10: Privacy/permission copy.
11. PR-11: i18n hardcoded strings + locale QA gate.
12. PR-12: Responsive/accessibility UI QA fixes.
13. PR-13: Final release checklist, evidence logs ve go/no-go signoff.

## 17. Sahiplik ve Kanit Formati

Her madde icin PR aciklamasinda su format kullanilmali:

```md
## Scope
- Degisen alanlar:
- Degismeyen alanlar:

## Risk
- Runtime risk:
- Data risk:
- Security risk:

## Verification
- [ ] npm run typecheck
- [ ] npm run typecheck:test
- [ ] npm run test:ci
- [ ] npm run audit:prod
- [ ] npm --prefix functions run lint
- [ ] npm --prefix functions run build
- [ ] Manual/device QA:

## Evidence
- Log/artifact path:
- Dashboard screenshot/check id:
```

Bu plan tamamlanmadan production release yapilmamalidir.
