# VocBee Production Readiness, Security, Code Quality ve UI/UX Denetim Raporu

**Denetim tarihi:** 3 Mayis 2026  
**Incelenen arsiv:** `vocbee-master.zip`  
**Proje tipi:** Expo / React Native mobil uygulamasi; Firebase Authentication + Firestore; RevenueCat; Google AdMob; Expo Notifications; Groq tabanli grammar proxy; 21 dilli i18n.

## 1. Yonetici ozeti

Bu kod tabani store kimlikleri, production EAS profili, App Store / Play Store URL leri ve temel production servislerini iceriyor. Buna ragmen denetim sonucum: **su haliyle production-ready degil**. Bunun nedeni tek bir problem degil; release gate, servis guvenligi, veri tutarliligi ve QA zincirinde birden fazla bloklayici var.

En kritik noktalar:

1. **Release gate kirmizi:** TypeScript, Jest, Firebase Functions build/lint ve npm audit basarisiz.
2. **Android RevenueCat production key eksik:** Android production build monetization akisi patlayabilir.
3. **Grammar proxy herkese acik ve zayif korunuyor:** maliyet, abuse, prompt injection ve hata sizintisi riski var.
4. **Firestore rules arsivde yok:** client dogrudan user dokumanlarini yaziyor; server-side access isolation kanitlanamiyor.
5. **Sync katmaninda data loss riski var:** favori sync hatasi yutuluyor; cloud restore local unsynced datayi ezebilir.
6. **Account deletion akisi atomik degil:** recent-login hatasinda Firestore silinip Auth kullanicisi kalabilir.
7. **UI/i18n iyi bir temel iceriyor ama production polish eksik:** 21 dil yapisal olarak tamam, fakat kalite, hardcoded metinler, RTL reload ve responsive testleri tamamlanmamis.

## 2. Kapsam ve metodoloji

Yapilan denetimler:

- Arsiv acildi ve proje mimarisi incelendi.
- Root ve functions bagimlilikleri kuruldu.
- `npx tsc --noEmit`, Jest testleri, Firebase Functions build/lint calistirildi.
- Root ve functions icin production dependency audit incelendi.
- Servis katmani, auth, sync, storage, monetization, ad, grammar proxy, i18n ve UI componentleri statik olarak incelendi.
- Locale dosyalari otomatik olarak key eksigi, bos deger, placeholder uyumsuzlugu ve English ile ayni kalan metinler acisindan kontrol edildi.

Sinirlar:

- Fiziksel cihaz/emulator ile tum ekranlar render edilmedi. UI/UX yorumu statik kod, testler ve responsive pattern denetimine dayanir.
- Firestore security rules, App Check ayarlari, RevenueCat dashboard, AdMob consent dashboard ve store console ayarlari ZIP icinde olmadigi icin dogrulanamadi.
- Bu rapor hukuki/uyumluluk danismanligi degildir; privacy/KVKK/GDPR metinleri icin hukuk gozden gecirmesi gerekir.

## 3. Otomatik kontrol sonuclari

| Kontrol | Sonuc | Detay |
| --- | --- | --- |
| Root dependency install | PASS | npm ci --ignore-scripts --no-audit --no-fund --progress=false tamamlandi. |
| TypeScript | FAIL | npx tsc --noEmit exit 2. Jest globals type disi; functions/src root tsconfig e dahil; tsconfig include/types ayrimi hatali. |
| Unit tests | FAIL | 21 suite icinden 4 fail; 167 test icinden 12 fail. storage, streak, ErrorBoundary, OfflineNotice. |
| Functions build | FAIL | functions npm run build: unused onRequest/logger. |
| Functions lint | FAIL | unused import warning ve object-curly-spacing error. |
| Root npm audit prod | FAIL | {'info': 0, 'low': 0, 'moderate': 20, 'high': 7, 'critical': 1, 'total': 28} |
| Functions npm audit prod | FAIL | {'info': 0, 'low': 2, 'moderate': 11, 'high': 3, 'critical': 1, 'total': 17} |
| Locale structural check | PASS with warnings | 21 dil, 343 key; missing/extra/empty/placeholder mismatch yok; bazi dillerde English ile ayni kalan keyler var. |

## 4. Production-ready karari

**Karar: Hayir, bu haliyle production release onerilmez.**

Minimum release kosullari:

- TypeScript ve Jest temiz olmalı.
- Firebase Functions ya temiz build/lint ile deploy edilmeli ya da projeden/predeploy den kaldirilmali.
- Android RevenueCat key production EAS profile a eklenmeli.
- Grammar proxy server-side guvenlik katmani tamamlanmali.
- Firestore rules ve rule testleri eklenmeli.
- Critical/high npm audit bulgulari giderilmeli veya kabul edilebilir, belgelenmis, mitigation li hale getirilmeli.
- Account deletion ve sync conflict flowlari duzeltilmeli.

## 5. Mimari ve servis envanteri

| Alan | Dosyalar | Gorev | Denetim yorumu |
| --- | --- | --- | --- |
| App Shell | App.tsx | Provider sirasi: SafeAreaProvider, ThemeProvider, AlertProvider, AuthProvider, MonetizationProvider, ErrorBoundary, OfflineNotice, AppContent. | Yapi mantikli; startup side effect ve loglar production gate ile kontrol edilmeli. |
| Authentication | context/AuthContext.tsx; services/nativeGoogleSignIn.ts | Firebase email/password, Google, Apple, profile cache, account deletion, sign out. | Deletion sirasi, local profile cleanup ve localized error handling iyilestirilmeli. |
| Firebase/Firestore Sync | services/SyncService.ts | Progress, favorites, profile, preferences, streak, notification settings sync. | Conflict resolution, failure propagation, security rules olmadan production riskli. |
| Local Storage | services/storage.ts; storageKeys.ts | AsyncStorage uzerinden data, progress, prefs, cache, sync flag. | PII minimizasyonu, profile_ cleanup, crypto random device id, SecureStore threat model. |
| Learning Progress | services/progressService.ts | Learned words, current level, reset, restore. | setCurrentLevel/resetProgress sync flag davranisi gozden gecirilmeli. |
| Favorites | services/favoritesService.ts | Local favorite list + Firebase sync. | sync error yutma, Firestore data validation ve duplicate cleanup onemli. |
| Streak | services/streakService.ts | Daily streak state, restore/clear, timezone-ish day logic. | Time injection ve restore semantics testleri duzeltilmeli. |
| Vocabulary | services/vocabularyService.ts; assets/vocabulary/*.txt | Bundled vocabulary JSON txt data, generation/cache. | Data schema validation ve localization quality gate eklenmeli. |
| Grammar AI | services/groqService.ts; api/grammarProxy.js; proxy/grammar-worker.ts | Client cache + proxy path + dev direct fallback. | Server side auth, durable rate limit, input/output validation, error sanitization gerekli. |
| Monetization | services/revenueCatService.ts; adMobService.ts; context/MonetizationContext.tsx | Ad-free entitlement, paywall/customer center, ads. | Android RevenueCat key missing; consent/ad privacy tests gerekli. |
| Notifications | services/notificationService.ts; App.tsx | Permission gate, schedule/refill/process notifications. | Permission copy/localization, stale schedules and background sync tests gerekli. |
| i18n/RTL | services/i18n.ts; locales/*.ts; utils/rtl.ts | 21 language resources, fallback en, RTL support. | Completeness iyi; quality/hardcoded text/RTL reload gate eksik. |

## 6. Kritik bulgular tablosu

| Seviye | Baslik | Bulgu | Kanıt | Production-ready duzeltme |
| --- | --- | --- | --- | --- |
| CRITICAL | Release gate gecmiyor | TypeScript, Jest, Firebase Functions build/lint ve npm audit kontrolleri basarisiz. | tsconfig.json; jest-root.log; functions-build.log; functions-lint.log; npm-audit*.json | CI/CD pipeline zorunlu hale getirilmeli; kirmizi test/tsc/lint/audit duzelmeden release engellenmeli. |
| CRITICAL | Android RevenueCat production anahtari yok | eas.json production env sadece iOS RevenueCat anahtari iceriyor; Android tarafinda production build bos anahtar ile RevenueCat configure edemeyebilir. | eas.json:25-31; services/revenueCatService.ts:28-49 | EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY veya ortak EXPO_PUBLIC_REVENUECAT_API_KEY production profile a eklenmeli; startup health check ve store smoke testi yapilmali. |
| HIGH | Grammar proxy herkese acik ve zayif korunuyor | CORS *; auth yok; kalici rate limit yok; input type/length/allowlist yok; hata mesajlari client a siziyor; Groq maliyet ve abuse riski var. | api/grammarProxy.js:1-20,53-97; proxy/grammar-worker.ts:19-31,35-66,68-139 | Firebase Auth token/App Check veya imzali istek; durable rate limit; schema validation; length cap; outputLanguage allowlist; timeout; generic error response. |
| HIGH | Firestore security rules yok | ZIP icinde firestore.rules veya storage.rules bulunmadi. Client dogrudan users/{{uid}} dokumanlarini okuyor/yaziyor. | config/firebase.ts:8-15; services/SyncService.ts:108,148,204,229,348 | Rules eklenip test edilmeli: request.auth.uid == uid, alan bazli validate, App Check enforcement, emulator rule tests. |
| HIGH | Sync hatasi favorilerde yutuluyor ve sync flag temizlenebiliyor | syncToFirestore favorites sync fonksiyonunu bekliyor; fakat syncFavoritesToFirebase kendi hatasini catch edip throw etmiyor. Sonra clearSyncFlag cagriliyor. | services/SyncService.ts:148-154; services/favoritesService.ts:219-235 | syncFavoritesToFirebase boolean/throw donmeli; tum alt sync ler basarili olmadan LAST_SYNC/SYNC_FLAG temizlenmemeli. |
| HIGH | Account deletion sirasi veri tutarsizligi yaratabilir | Firestore dokumani once siliniyor, Auth kullanicisi sonra siliniyor. deleteUser requires-recent-login donerse Firestore silinmis, Auth kullanicisi kalmis olur. | context/AuthContext.tsx:622-635,645-650 | Reauth gate i basta yap; once Auth deletion token uygunlugunu dogrula; sonra cloud data sil; tum adimlari idempotent server endpoint veya callable function ile yonet. |
| HIGH | Cloud restore local unsynced data yi ezebilir | fetchAndSaveUserData cloud verisini local e yazip clearSyncFlag cagiriyor. Yerel degisiklik daha yeni ise conflict resolution yok. | services/SyncService.ts:226-340,332 | lastUpdated/version/deviceId alanlariyla merge stratejisi kur; restore oncesi local needsSync true ise cloud overwrite yapma veya conflict queue olustur. |
| HIGH | Dependency guvenlik borcu yuksek | Root prod audit: {'info': 0, 'low': 0, 'moderate': 20, 'high': 7, 'critical': 1, 'total': 28}. Functions prod audit: {'info': 0, 'low': 2, 'moderate': 11, 'high': 3, 'critical': 1, 'total': 17}. | npm-audit-root-prod.json; npm-audit-functions-prod.json | Expo/Firebase/axios zincirleri guncellenmeli; npm audit fix force dogrudan uygulanmadan Expo SDK uyumluluk matrisi ile kontrollu upgrade yapilmali. |
| MEDIUM | Firebase Functions scaffold deploy edilemiyor | functions/src/index.ts template; build unused imports ile, lint object spacing ile fail. | functions/src/index.ts:10-32; functions-build.log; functions-lint.log | Kullanilmiyorsa functions klasoru ve firebase predeploy kaldir; kullanilacaksa gercek callable/https fonksiyonu yaz, build/lint yesil yap. |
| MEDIUM | ErrorBoundary production da internal hata metnini gosteriyor | error.toString() kullanici ekranina basiliyor. | components/ErrorBoundary.tsx:71-75 | Hata detayini sadece __DEV__ modda goster; production da genel mesaj ve crash reporting id goster. |
| MEDIUM | Android RECORD_AUDIO izni gereksiz gorunuyor | app.json RECORD_AUDIO tanimli; kodda aktif audio recording ozelligi gorulmedi. | app.json:82-85; privacypolicy.md:47-49 | Kullanilmiyorsa izni kaldir; kullaniliyorsa feature, permission prompt ve privacy metni tam uyumlu olmali. |
| MEDIUM | In-app privacy metni guncele uymuyor | Locale privacy ozeti "veriler cihazda saklanir" diyor; uygulama Firestore cloud sync, AdMob, RevenueCat, Groq kullaniyor. | locales/en.ts:194-202; locales/tr.ts:privacy*; privacypolicy.md:79-85 | In-app privacy modalini web privacy policy ile ayni veri kategorileri, bulut sync, ucuncu taraflar ve deletion haklariyla guncelle. |
| MEDIUM | Hidden OfflineNotice accessibility/test sorunu | Bagliyken component hala render ediliyor; opacity 0/pointerEvents none ama screen reader/test agacinda kalabilir. | components/OfflineNotice.tsx:34-59; components/__tests__/OfflineNotice.test.tsx | Connected durumda null don veya accessibilityElementsHidden/importantForAccessibility kullan; test beklentisini netlestir. |
| MEDIUM | RTL degisikligi reload gerektiriyor ama uygulanmiyor | applyRTLLayout true donuyor; i18n languageChanged sonucu reload tetiklemiyor. | services/i18n.ts:63-66; utils/rtl.ts:52-64 | RTL/LTR degisiminde kullaniciya restart/reload akisi sun; UI elementlerinde start/end/marginLeft yerine logical spacing kullan. |
| MEDIUM | UI responsive riskleri | Bazi ekranlar module scope Dimensions.get kullaniyor; global display font cok yaygin; uzun ceviriler icin numberOfLines sinirli. | screens/HomeScreen.tsx:89; screens/SettingsScreen.tsx:55; screens/SetupScreens.tsx:51; utils/typography.ts; rg metrics | useWindowDimensions a gec; text scaling/large font testleri; tablet max-width stratejisi; uzun locale snapshotlari. |
| LOW | Hardcoded user-facing English messages | Google/Apple auth errorlari ve ExampleSentences accessibility label lar i18n disinda. | services/nativeGoogleSignIn.ts:103-127; context/AuthContext.tsx:489-490; screens/ExampleSentencesScreen.tsx:175,264,301,413,478 | Tum hata ve accessibility metinleri locale dosyalarina tasinmali. |

## 7. Servis bazli detayli analiz

### 7.1 Auth ve hesap yonetimi

Dosyalar: `context/AuthContext.tsx`, `services/nativeGoogleSignIn.ts`, `services/googleAuthConfig.ts`, `config/firebase.ts`.

Guclu yanlar:

- Email/password, Google ve Apple akislari var.
- Social sign-in sonrasi provider profilini Firestore/local profile ile merge etmeye calisiyor.
- Logout oncesi force sync dusunulmus.
- `auth/requires-recent-login` hatasi yakalaniyor.

Sorunlar:

- `deleteAccount` once Firestore dokumanini siliyor, sonra Firebase Auth kullanicisini siliyor (`context/AuthContext.tsx:622-635`). `deleteUser` recent-login isterse cloud dokumani silinmis ama auth kullanicisi kalmis olur. Bu hesap uyumlulugu ve destek acisindan problem yaratir.
- Apple sign-in genel hatasi hardcoded English (`context/AuthContext.tsx:489-490`). Google sign-in hata metinleri de i18n disinda (`services/nativeGoogleSignIn.ts:103-127`).
- Local profile cache `profile_${uid}` clearAllLocalData tarafindan temizlenmiyor; shared device senaryosunda eski profile kalma riski var (`services/storageKeys.ts:47-49`, `services/storage.ts:118-151`).

Duzeltme yaklasimi:

1. Delete flow icin once reauth kontrolu yap, sonra server-side idempotent deletion endpoint/callable function calistir.
2. Firestore delete ve Auth delete sirasini transactional/idempotent hale getir: `deletionRequests/{uid}` kaydi, Cloud Function cleanup, retry state.
3. Tum auth hata metinlerini locale keys e tasi.
4. `clearAllLocalData` icine `profile_` prefix cleanup ekle.

### 7.2 Firebase ve Firestore guvenligi

Dosyalar: `config/firebase.ts`, `services/SyncService.ts`, `services/favoritesService.ts`.

Bulgu:

- Firebase client config client tarafinda bulunuyor. Bu tek basina secret degildir, fakat **Firestore rules olmadan guvenlik saglamaz**.
- ZIP icinde `firestore.rules`, `storage.rules` veya rule tests yok.
- Client `users/{uid}` dokumanini dogrudan set/get/delete ediyor.

Production-ready rules ornegi:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }

    match /users/{uid} {
      allow create: if isOwner(uid)
        && request.resource.data.email is string
        && request.resource.data.keys().hasOnly([
          'email','displayName','photoURL','createdAt','setupCompleted','preferences',
          'progress','streak','notificationSettings','lastActiveDeviceId'
        ]);
      allow read, update, delete: if isOwner(uid);
    }
  }
}
```

Buna ek olarak `@firebase/rules-unit-testing` ile en az su testler olmalidir:

- Kullanici kendi dokumanini okuyabilir/yazabilir.
- Kullanici baska uid dokumanini okuyamaz/yazamaz/silemez.
- Bilinmeyen alanlar reddedilir.
- Progress/favorites/streak field tipleri hataliysa update reddedilir.

### 7.3 SyncService veri tutarliligi

Dosyalar: `services/SyncService.ts`, `services/favoritesService.ts`, `services/progressService.ts`, `services/streakService.ts`.

Guclu yanlar:

- Retry helper var.
- Progress, profile, favorites, preferences, notification settings ve streak tek sync akisi icinde dusunulmus.
- Device id ile last active device takip edilmeye calisilmis.

Sorunlar:

- `shouldSync` sadece 24 saat gecince sync ediyor (`services/SyncService.ts:50-64`). Kullanici uygulamayi silerse veya cihaz degistirirse 24 saat icinde kaybolan veriler olabilir. Logout force sync bunu tamamen cozmez.
- `syncFavoritesToFirebase` hata yakalayip throw etmiyor; `syncToFirestore` ise `clearSyncFlag` cagiriyor (`services/SyncService.ts:150-154`, `services/favoritesService.ts:219-235`). Bu data loss riskidir.
- Cloud restore local unsynced datayi ezebilir ve sync flag i temizler (`services/SyncService.ts:226-340,332`). Timestamp/version conflict strategy yok.
- `setCurrentLevel` sync flag isaretlemiyor (`services/progressService.ts:140-146`). `resetProgress` tek basina unsynced isaretlemiyor (`services/progressService.ts:170-179`).

Production-ready sync modeli:

- Her data domain e `updatedAt`, `version`, `updatedByDeviceId` ekle.
- Local mutation oldugunda sync queue olustur: `pendingOps[]` veya domain-level dirty flag.
- Sync 24 saat yerine debounce/throttle: foreground/background, network regain, mutation sonrasi 30-120 saniye.
- Cloud restore oncesi local dirty ise merge/conflict resolve et.
- Her alt sync fonksiyonu hata durumunda throw etsin; tum islem basarili olmadan sync flag temizlenmesin.

### 7.4 Grammar AI ve proxy guvenligi

Dosyalar: `services/groqService.ts`, `api/grammarProxy.js`, `proxy/grammar-worker.ts`.

Guclu yanlar:

- Production path proxy kullanacak sekilde tasarlanmis; Groq API key client ta tutulmak istenmemis.
- Client tarafinda timeout var (`services/groqService.ts:164-166`).
- AI response JSON parse ediliyor ve cache kullaniliyor.

Sorunlar:

- Vercel proxy ve Cloudflare Worker CORS `*` ile herkese acik (`api/grammarProxy.js:2-5`, `proxy/grammar-worker.ts:35-41`).
- Auth yok; uygulama disindan herkes endpoint i kullanabilir.
- Worker rate limit memory map; cold start ve multi-isolate durumunda guvenilir degil (`proxy/grammar-worker.ts:19-31`).
- Inputlar sadece presence ile kontrol ediliyor; type, length, allowed language yok (`api/grammarProxy.js:16-20`, `proxy/grammar-worker.ts:59-66`).
- `outputLanguage` prompt icine direkt giriyor; prompt injection riski var (`api/grammarProxy.js:22-51`, `proxy/grammar-worker.ts:68-89`).
- Hata mesajlari client a ham donuyor (`api/grammarProxy.js:95-96`, `proxy/grammar-worker.ts:135-138`).

Production-ready proxy iskeleti:

```ts
const ALLOWED_LANGUAGES = new Set(['Turkish','English','German','French','Spanish','Italian','Portuguese','Russian','Arabic','Chinese','Japanese','Korean']);
const MAX_SENTENCE_LEN = 280;

function validateBody(body: unknown) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'INVALID_BODY');
  const { sentence1, sentence2, outputLanguage = 'Turkish' } = body as any;
  if (typeof sentence1 !== 'string' || typeof sentence2 !== 'string') throw new HttpError(400, 'INVALID_SENTENCE');
  if (sentence1.trim().length < 1 || sentence1.length > MAX_SENTENCE_LEN) throw new HttpError(400, 'INVALID_SENTENCE');
  if (sentence2.trim().length < 1 || sentence2.length > MAX_SENTENCE_LEN) throw new HttpError(400, 'INVALID_SENTENCE');
  if (typeof outputLanguage !== 'string' || !ALLOWED_LANGUAGES.has(outputLanguage)) throw new HttpError(400, 'INVALID_LANGUAGE');
  return { sentence1: sentence1.trim(), sentence2: sentence2.trim(), outputLanguage };
}
```

Ek gereksinimler:

- Firebase ID token dogrulama veya App Check token.
- Durable Object/KV/Upstash tabanli kalici rate limit.
- AbortController timeout.
- Groq errorlarini sanitize et.
- Response schema validation: `sentence1.structure|grammar|reason` ve `sentence2.*` string ve length cap.

### 7.5 Monetization ve reklam

Dosyalar: `services/revenueCatService.ts`, `context/MonetizationContext.tsx`, `services/adMobService.ts`, `app.json`, `eas.json`.

Guclu yanlar:

- RevenueCat entitlement `ad_free` merkezi tanimlanmis.
- Production da test key kullanma guard i var (`services/revenueCatService.ts:42-49`).
- AdMob app ids ve ad unit ids ayrilmis.

Sorunlar:

- Android production RevenueCat key yok (`eas.json:25-31`, `services/revenueCatService.ts:35-37`). Bu P0 bug dir.
- `TEST_REVENUECAT_API_KEY` kaynak kodda duruyor. Guard var, fakat secrets/env yonetimi daha temiz olmali.
- Ad/ATT/UMP davranisi icin dashboard/config dogrulanamadi.

Duzeltme:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_GRAMMAR_PROXY_URL": "https://vocbee-proxy.vercel.app/api/grammarProxy",
    "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY": "appl_...",
    "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY": "goog_..."
  },
  "android": { "buildType": "app-bundle" }
}
```

Smoke test listesi:

- Fresh install free user: ads gorunur, paywall acilir.
- Purchase monthly/yearly/lifetime: entitlement active, ads kalkar.
- Restore purchase: entitlement geri gelir.
- Logout/login same uid: RevenueCat `logIn` dogru calisir.
- Android production AAB internal testing: RevenueCat configure hatasi yok.

### 7.6 Storage ve local privacy

Dosyalar: `services/storage.ts`, `services/storageKeys.ts`, `config/firebase.ts`.

Sorunlar:

- AsyncStorage PII ve profil bilgileri icin kullaniliyor (`services/storage.ts:90-107`). Firebase Auth persistence de AsyncStorage (`config/firebase.ts:21-26`). Bu RN icin yaygin, fakat threat model dokumante edilmeli.
- Device id `Date.now() + Math.random()` ile uretiliyor (`services/storage.ts:164-171`). Security secret degil, ama collision/guessing acisindan `expo-crypto` daha iyi.
- `clearAllLocalData` profile prefix ve device id gibi bazi alanlari temizlemiyor (`services/storage.ts:118-151`). Logout icin device id kalabilir, ama delete account/shared device icin full purge secenegi olmalidir.

Duzeltme:

```ts
import * as Crypto from 'expo-crypto';

const profileKeys = allKeys.filter(key => key.startsWith(STORAGE_KEYS.PROFILE_PREFIX));
const reviewKeys = [STORAGE_KEYS.APP_REVIEW_PROMPT_STATE];

if (!deviceIdPreserve) keysToRemove.push(STORAGE_KEYS.DEVICE_ID);
keysToRemove.push(...profileKeys, ...reviewKeys);

const id = Crypto.randomUUID?.() ?? `device_${Date.now()}_${await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, String(Math.random()))}`;
```

### 7.7 ErrorBoundary ve hata yonetimi

Dosya: `components/ErrorBoundary.tsx`.

Bulgu:

- `error.toString()` production ekraninda gosteriliyor (`components/ErrorBoundary.tsx:71-75`). Internal hata detayi kullaniciya ve ekran goruntulerine sizabilir.
- React Native `SafeAreaView` deprecated warning uretiyor; `react-native-safe-area-context` kullanilmali.
- Testler HOC export nedeniyle `getDerivedStateFromError` statigini bulamiyor.

Duzeltme:

```tsx
{__DEV__ && this.state.error && (
  <View style={styles.errorBox}>
    <Text style={styles.errorText}>{this.state.error.toString()}</Text>
  </View>
)}
```

Ayrica `export { ErrorBoundaryInner }` test icin ayrilabilir veya test HOC davranisina gore guncellenebilir.

## 8. UI/UX ve responsive tasarim denetimi

Pozitifler:

- Birden cok ekranda `ScrollView`, `SafeAreaProvider` ve responsive width hesaplari kullanilmis.
- iOS tablet destegi app config de acik (`app.json:22-24`).
- Dark/light theme yapisi var.
- Offline banner, error boundary, rating prompt gibi production UI durumlari dusunulmus.

Riskler:

- `Dimensions.get('window')` bircok dosyada module scope ta aliniyor (`screens/HomeScreen.tsx:89`, `screens/SettingsScreen.tsx:55`, `screens/SetupScreens.tsx:51`, `components/HomeHeader.tsx:13`). Orientation kilitli olsa da tablet split view, foldable, font scale ve runtime size change icin `useWindowDimensions` daha guvenilir.
- Global display font `FONT_FAMILY` cok yaygin kullaniliyor. Expanded display font uzun Almanca/Fransizca/Turkce/Hintce/Urdu metinlerde tasma riski yaratir.
- `numberOfLines` sinirli kullanilmis; Settings/Setup gibi uzun ceviri alanlarinda snapshot testi yok.
- OfflineNotice bagliyken de render agacinda duruyor; accessibility icin saklanmali veya null donmeli.
- RTL icin utility var, fakat forceRTL reload akisi yok. RTL layout degisiklikleri reload olmadan tam uygulanmaz (`utils/rtl.ts:52-64`).

Production UI test matrisi:

| Boyut | Test |
| --- | --- |
| 320-360px genis Android | Login, setup 7 adim, home card, examples modal, settings reset/delete modallari |
| iPhone SE | Keyboard/login/forgot password, paywall, modal overflow |
| Large iPhone/Android | Header alignment, card proportions, banner ad overlap |
| iPad/tablet | maxWidth, merkezleme, bosluklar, tablet orientation karari |
| Large text | system font scale 120%, 150%, 200% |
| RTL | Arabic/Farsi/Urdu onboarding, settings, chevrons, modal buttons |
| Dark mode | splash, error boundary, offline banner, paywall transition |

## 9. i18n ve ceviri kalite denetimi

Otomatik sonuc:

- 21 dil dosyasi bulundu.
- English anahtar sayisi: 343.
- Tum dillerde missing/extra/empty key: 0.
- Placeholder mismatch: 0.
- Bazi dillerde English ile birebir ayni kalan metinler var; bir kismi marka/dil adi nedeniyle normal olabilir, bir kismi ceviri eksigi olabilir.

| Dil | Key | Missing | Extra | Empty | English ile ayni | Ornekler |
| --- | --- | --- | --- | --- | --- | --- |
| am | 343 | 0 | 0 | 0 | 0 |  |
| ar | 343 | 0 | 0 | 0 | 0 |  |
| de | 343 | 0 | 0 | 0 | 8 | languages.hindi, languages.swahili, languages.urdu, onboarding.start, settings.avatarOptionAccessibility, settings.min, settings.nameLabel, settings.support |
| es | 343 | 0 | 0 | 0 | 7 | auth.error, common.error, common.no, languages.hindi, languages.urdu, settings.avatarOptionAccessibility, settings.min |
| fa | 343 | 0 | 0 | 0 | 0 |  |
| fr | 343 | 0 | 0 | 0 | 6 | example.structure, languages.hindi, languages.swahili, settings.min, settings.privacyContact, settings.support |
| hi | 343 | 0 | 0 | 0 | 0 |  |
| id | 343 | 0 | 0 | 0 | 5 | auth.email, home.streak, languages.hindi, languages.swahili, languages.urdu |
| it | 343 | 0 | 0 | 0 | 8 | auth.email, auth.password, auth.passwordPlaceholder, common.no, languages.hindi, languages.swahili, languages.urdu, settings.min |
| ja | 343 | 0 | 0 | 0 | 0 |  |
| ko | 343 | 0 | 0 | 0 | 0 |  |
| pt | 343 | 0 | 0 | 0 | 3 | languages.hindi, languages.urdu, settings.min |
| ru | 343 | 0 | 0 | 0 | 1 | auth.email |
| sr | 343 | 0 | 0 | 0 | 0 |  |
| sw | 343 | 0 | 0 | 0 | 0 |  |
| th | 343 | 0 | 0 | 0 | 0 |  |
| tr | 343 | 0 | 0 | 0 | 1 | settings.avatarOptionAccessibility |
| ur | 343 | 0 | 0 | 0 | 0 |  |
| vi | 343 | 0 | 0 | 0 | 1 | auth.email |
| zh | 343 | 0 | 0 | 0 | 0 |  |

Ek bulgular:

- `screens/ExampleSentencesScreen.tsx` accessibility label lari hardcoded English: `Play word pronunciation`, `Explain grammar with AI`, `Go back`, `Close modal`, `Retry loading explanation`.
- Google/Apple auth hata metinleri i18n disinda.
- In-app privacy metni web privacy policy ile ayni seviyede guncel degil. Locale privacy ozeti cloud sync ve ucuncu taraflari yeterince aciklamiyor.
- RTL dilleri structural olarak listelenmis, ama reload ve layout mirror testleri eksik.

Production i18n gate:

1. `i18n-lint` script: missing/extra/empty/placeholder/same-as-English raporunu CI da calistir.
2. Hardcoded visible string taramasi: Text/Alert/accessibilityLabel icin i18n zorunlu.
3. Native speaker QA: en az tr, de, fr, es, ar, fa, ur, hi icin ekran bazli kontrol.
4. Pseudo-localization testi: uzun metinlerle UI tasma kontrolu.
5. RTL restart flow: languageChanged true donerse user a reload CTA.

## 10. Test ve CI duzeltme plani

### 10.1 TypeScript

Mevcut `tsconfig.json` root icinde tests ve functions i de kapsiyor; `types` sadece `nativewind/types` oldugu icin Jest global tipleri yok. Onerilen ayrim:

```json
// tsconfig.app.json
{
  "extends": "./tsconfig.json",
  "include": ["App.tsx", "components/**/*.ts", "components/**/*.tsx", "screens/**/*.ts", "screens/**/*.tsx", "services/**/*.ts", "context/**/*.tsx", "config/**/*.ts", "utils/**/*.ts", "types/**/*.d.ts"],
  "exclude": ["**/__tests__/**", "functions/**", "coverage/**", "node_modules/**"]
}
```

```json
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "types": ["nativewind/types", "jest"] },
  "include": ["**/*.test.ts", "**/*.test.tsx", "jest.setup.js", "__mocks__/**/*.js"]
}
```

### 10.2 Test failures

- `storage.test.ts`: Deprecated `saveLocalProgress/getLocalProgress` exportlari silinmis. Testler yeni progressService e tasinmali veya compatibility wrapper geri eklenmeli.
- `streakService.test.ts`: Zaman bagimli restore semantigi bug/test uyumsuzlugu. `now` injection ile deterministik test yap.
- `ErrorBoundary.test.tsx`: HOC export nedeniyle static method yok. Inner class export et veya test HOC davranisini test et.
- `OfflineNotice.test.tsx`: Component bagliyken null donmuyor. Product karari: animasyon icin render kalacaksa accessibility hidden; test buna gore guncellenmeli.

### 10.3 CI pipeline onerisi

```yaml
name: mobile-ci
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test -- --runInBand
      - run: npm audit --omit=dev --audit-level=high
      - run: npm --prefix functions ci
      - run: npm --prefix functions run lint
      - run: npm --prefix functions run build
```

## 11. Oncelikli duzeltme yol haritasi

| Oncelik | Alan | Aksiyon |
| --- | --- | --- |
| P0 - Release blocker | CI gate | tsc/test/lint/build/audit fail durumlarini release i engelleyecek pipeline a bagla. |
| P0 - Revenue | Android RevenueCat | Production Android API key ekle; iOS/Android store sandbox purchase/restore smoke testleri yaz. |
| P0 - Security | Grammar proxy | Auth/App Check + Durable Object/KV rate limit + schema validation + generic errors. |
| P0 - Data isolation | Firestore rules | Rules ve emulator tests ekle, sadece users/{auth.uid} erisimi. |
| P1 - Data integrity | Sync | Failure propagation, conflict resolution, sync flag semantics, deletion order. |
| P1 - Privacy | Policy and permissions | RECORD_AUDIO kararini ver; in-app privacy copy guncelle; account deletion recent-login flow. |
| P2 - UI/i18n | Responsive and localization | useWindowDimensions, font fallback, RTL reload, hardcoded labels. |
| P2 - QA | Device matrix | Small Android, iPhone SE, large iPhone, iPad/tablet, RTL, large text, dark mode. |

## 12. Release checklist


### Build health

- [ ] npm ci clean install
- [ ] npx tsc --noEmit yesil
- [ ] npm test -- --runInBand yesil
- [ ] functions npm run lint/build yesil veya functions kaldirildi
- [ ] npm audit production icin kabul edilebilir seviyede ve documented

### Security

- [ ] Firestore rules deployed and emulator-tested
- [ ] App Check enabled for Firestore/Functions where supported
- [ ] Grammar proxy auth/rate-limit/schema/timeout/generic-error implemented
- [ ] No server secrets in EXPO_PUBLIC or client bundle
- [ ] Dependency critical/high vulnerabilities fixed or formally accepted with mitigation

### Data integrity

- [ ] Sync failure propagation tested
- [ ] Conflict resolution tested across two devices
- [ ] Logout/delete/reinstall flows tested
- [ ] Offline -> online queue tested
- [ ] Account deletion idempotent and reauth-safe

### Monetization/ads

- [ ] RevenueCat iOS and Android keys set
- [ ] Entitlement id ad_free verified
- [ ] Purchase/restore/customer center tested
- [ ] AdMob app ids/ad unit ids verified
- [ ] UMP/ATT consent flows tested

### UI/UX

- [ ] Small/large screen snapshots
- [ ] Tablet support decision documented
- [ ] Large text accessibility tested
- [ ] Dark/light mode tested
- [ ] RTL Arabic/Farsi/Urdu tested after app reload
- [ ] Offline banner accessibility tested

### Localization/legal

- [ ] All hardcoded user strings extracted
- [ ] Same-as-English list reviewed by native speakers
- [ ] In-app privacy copy aligned with privacy policy
- [ ] Store permission descriptions aligned with actual features


## 13. Kanit log ozetleri

### 13.1 Jest final summary

```text
    expect(received).toBeNull()

    Received: {"_fiber": {"_debugHookTypes": null, "_debugInfo": null, "_debugNeedsRemount": false, "_debugOwner": [FiberNode], "_debugStack": [Error: react-stack-top-frame], "_debugTask": null, "actualDuration": 0, "actualStartTime": 1777819905079, "alternate": null, "child": [FiberNode], "childLanes": 0, "deletions": null, "dependencies": null, "elementType": "Text", "flags": 0, "index": 0, "key": null, "lanes": 0, "memoizedProps": [Object], "memoizedState": null, "mode": 3, "pendingProps": [Object], "ref": null, "refCleanup": null, "return": [FiberNode], "selfBaseDuration": 0, "sibling": null, "stateNode": [Object], "subtreeFlags": 0, "tag": 5, "treeBaseDuration": 0, "type": "Text", "updateQueue": null}}

      111 |         });
      112 |
    > 113 |         expect(queryByText('offline.message')).toBeNull();
          |                                                ^
      114 |
      115 |         // Simulate disconnect
      116 |         mockGetNetworkStateAsync.mockResolvedValue({ isConnected: false });

      at Object.toBeNull (components/__tests__/OfflineNotice.test.tsx:113:48)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)

  ● OfflineNotice › handles undefined connection state

    expect(received).toBeNull()

    Received: {"_fiber": {"_debugHookTypes": null, "_debugInfo": null, "_debugNeedsRemount": false, "_debugOwner": [FiberNode], "_debugStack": [Error: react-stack-top-frame], "_debugTask": null, "actualDuration": 0, "actualStartTime": 1777819905114, "alternate": null, "child": [FiberNode], "childLanes": 0, "deletions": null, "dependencies": null, "elementType": "Text", "flags": 0, "index": 0, "key": null, "lanes": 0, "memoizedProps": [Object], "memoizedState": null, "mode": 3, "pendingProps": [Object], "ref": null, "refCleanup": null, "return": [FiberNode], "selfBaseDuration": 0, "sibling": null, "stateNode": [Object], "subtreeFlags": 0, "tag": 5, "treeBaseDuration": 0, "type": "Text", "updateQueue": null}}

      135 |
      136 |         // isConnected !== false, so should be treated as connected
    > 137 |         expect(queryByText('offline.message')).toBeNull();
          |                                                ^
      138 |     });
      139 | });
      140 |

      at Object.toBeNull (components/__tests__/OfflineNotice.test.tsx:137:48)
      at asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
      at _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:9)


Test Suites: 4 failed, 17 passed, 21 total
Tests:       12 failed, 155 passed, 167 total
Snapshots:   0 total
Time:        27.993 s
Ran all test suites.
```

### 13.2 Functions build

```text

> build
> tsc

src/index.ts(11,1): error TS6133: 'onRequest' is declared but its value is never read.
src/index.ts(12,1): error TS6133: 'logger' is declared but its value is never read.
```

### 13.3 Functions lint

```text

> lint
> eslint --ext .js,.ts .


/mnt/data/vocbee_work/vocbee-master/functions/src/index.ts
  11:9   warning  'onRequest' is defined but never used  @typescript-eslint/no-unused-vars
  12:13  warning  'logger' is defined but never used     @typescript-eslint/no-unused-vars
  27:19  error    There should be no space after '{'     object-curly-spacing
  27:36  error    There should be no space before '}'    object-curly-spacing

✖ 4 problems (2 errors, 2 warnings)
  2 errors and 0 warnings potentially fixable with the `--fix` option.

```

## 14. Sonuc

VocBee mimari olarak dogru yonde: Expo, Firebase, RevenueCat, AdMob, i18n, notification ve error boundary gibi production uygulamalarinda gereken parcalar mevcut. Ancak production hazirligi sadece bu parcalarin varligi degildir. Release icin otomatik kalite kapilari yesil olmali, server-side guvenlik kanitlanmali, veri sync tutarliligi saglanmali, privacy metinleri gercek veri akisina uygun olmali ve UI tum cihaz/dil kombinasyonlarinda test edilmelidir.

Bu rapordaki P0 maddeleri tamamlanmadan release onerilmez.
