# VocBee Production-Ready Duzeltme Rehberi

Bu dokuman, denetim raporundaki bulgularin uygulanabilir duzeltme adimlarina indirgenmis halidir. Siralama, release blocker riskine gore yapildi.

## P0. Release gate i yesile cevir

### 1. Package scripts ekle

`package.json` icine:

```json
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.app.json --noEmit",
    "typecheck:test": "tsc -p tsconfig.test.json --noEmit",
    "test:ci": "jest --runInBand",
    "audit:prod": "npm audit --omit=dev --audit-level=high",
    "functions:lint": "npm --prefix functions run lint",
    "functions:build": "npm --prefix functions run build"
  }
}
```

### 2. tsconfig ayrimi

- Root `tsconfig.json` sadece ortak compilerOptions tutsun.
- App icin `tsconfig.app.json` tests/functions exclude etsin.
- Test icin `tsconfig.test.json` Jest tiplerini eklesin.
- Functions kendi tsconfig i ile derlensin, root include a girmesin.

### 3. Jest fail fixleri

#### storage.test.ts

Secenek A: Testleri yeni progressService davranisina tasi.  
Secenek B: Backward compatible wrapper ekle:

```ts
export const saveLocalProgress = async (progress: Partial<UserProgress>): Promise<void> => {
  const existing = await getLocalProgress();
  const next = { ...existing, ...progress, lastUpdated: new Date().toISOString() };
  await AsyncStorage.setItem(LOCAL_KEYS.USER_PROGRESS, JSON.stringify(next));
  await markAsUnsynced();
};

export const getLocalProgress = async (): Promise<UserProgress> => {
  try {
    const data = await AsyncStorage.getItem(LOCAL_KEYS.USER_PROGRESS);
    return data ? JSON.parse(data) : { currentLevel: 'A1', learnedWords: {}, lastUpdated: new Date().toISOString() };
  } catch {
    return { currentLevel: 'A1', learnedWords: {}, lastUpdated: new Date().toISOString() };
  }
};
```

#### ErrorBoundary.test.tsx

```ts
export class ErrorBoundaryInner extends Component<InnerProps, State> { ... }
export const ErrorBoundary = withThemeColors(ErrorBoundaryInner);
```

Test static method i `ErrorBoundaryInner.getDerivedStateFromError` uzerinden test etsin.

#### OfflineNotice.test.tsx

Product karari:

```tsx
if (isConnected && !hasEverBeenOffline) return null;
```

veya:

```tsx
<Animated.View
  accessibilityElementsHidden={isConnected}
  importantForAccessibility={isConnected ? 'no-hide-descendants' : 'auto'}
/>
```

#### streakService.test.ts

`getTodayKey(now = new Date())` veya service factory ile zaman inject et. Fake timers ile restore testini deterministik yap.

## P0. RevenueCat Android production key

`eas.json`:

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

Startup guard:

```ts
if (!__DEV__ && Platform.OS === 'android' && !process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY) {
  throw new Error('Missing Android RevenueCat key');
}
```

## P0. Grammar proxy hardening

### Server-side kontrol listesi

- [ ] POST disi 405.
- [ ] `Content-Type: application/json` zorunlu.
- [ ] Body max 2 KB.
- [ ] sentence1/sentence2 string, trim, 1-280 char.
- [ ] outputLanguage allowlist.
- [ ] Firebase ID token veya App Check token dogrulama.
- [ ] Durable rate limit: uid + ip bazli.
- [ ] AbortController timeout 10-15 sn.
- [ ] Groq error sanitize.
- [ ] JSON schema output validate.
- [ ] Audit logs PII siz.

### Cloudflare Worker shape

```ts
type GrammarResponse = {
  sentence1: { structure: string; grammar: string; reason: string };
  sentence2: { structure: string; grammar: string; reason: string };
};

function assertGrammarResponse(value: unknown): GrammarResponse {
  const v = value as any;
  for (const s of ['sentence1','sentence2']) {
    for (const k of ['structure','grammar','reason']) {
      if (typeof v?.[s]?.[k] !== 'string' || v[s][k].length > 1200) {
        throw new HttpError(502, 'BAD_AI_RESPONSE');
      }
    }
  }
  return v;
}
```

## P0. Firestore rules ve tests

Dosya ekle: `firestore.rules`. CI da emulator testlerini calistir.

Test senaryolari:

- Kendi dokumanini okuma/yazma success.
- Baska uid dokumanina read/write denied.
- Auth olmadan denied.
- `progress.learnedWords` invalid type denied.
- `preferences.level` invalid denied.
- `streak.currentStreak` negative denied.

## P1. Sync data integrity

### favorites sync throw etsin

```ts
export const syncFavoritesToFirebase = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const favorites = await getFavorites();
  await setDoc(doc(db, 'users', user.uid), { favorites, favoritesUpdatedAt: serverTimestamp() }, { merge: true });
};
```

### sync flag temizleme kuralı

```ts
const results = await Promise.allSettled([
  syncProgress(),
  syncFavoritesToFirebase(),
  syncStreak(),
]);
const failed = results.filter(r => r.status === 'rejected');
if (failed.length) throw new Error('PARTIAL_SYNC_FAILED');
await setLastSyncTime();
await clearSyncFlag();
```

### Conflict strategy

- Her domain icin `updatedAt` ve `version`.
- Local dirty ise cloud restore yapma; once merge.
- Multi-device conflict te son yazan degil, domain merge: favorites union, progress union, streak max/best, preferences explicit user action.

## P1. Account deletion

Onerilen akış:

1. Kullanici reauth yapar.
2. Server/callable deletion request olusturulur.
3. Cloud Function Firestore ve Storage cleanup yapar.
4. Auth user delete edilir.
5. Local full purge yapilir.

Client-only kalacaksa en azindan:

```ts
await reauthenticateUser();
await deleteUser(user);          // recent-login burada patlar; cloud silinmemis olur
await deleteDoc(userDocRef);     // sonra cloud cleanup
await clearAllLocalData({ fullPurge: true });
```

## P1. Privacy ve izinler

- `RECORD_AUDIO` kullanilmiyorsa `app.json` dan kaldir.
- In-app privacy modalini web policy ile ayni bilgilerle guncelle: Firebase, Firestore, RevenueCat, AdMob, Groq, Expo, local storage, deletion, retention.
- Store permission descriptions ile gercek feature lar ayni olsun.

## P2. UI/UX standardizasyon

- Module scope `Dimensions.get` yerine `useWindowDimensions`.
- Ana layoutlarda `maxWidth` ve tablet strategy.
- Display font sadece heading/brand; body metinlerde okunabilir font.
- Long translation snapshot: de/fr/tr/ar/ur/fa/hi.
- Large text accessibility: fontScale 1.3/1.6/2.0.
- RTL reload prompt.

## P2. Localization

- `accessibilityLabel` ve error mesajlarini locale e tasi.
- Same-as-English raporunu native speaker ile temizle.
- Pseudo-localization script ekle.

## Kabul kriteri

Aşağıdakiler yesil olmadan release yok:

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
