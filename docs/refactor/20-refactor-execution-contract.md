# 20 — Production-Ready Refactor Execution Contract

Bu doküman refactor'un "kod taşındı ve test geçti" seviyesinde değil, production-ready mühendislik
seviyesinde yürütülmesi için bağlayıcı sözleşmedir. Refactor başlamadan önce Faz 0 içinde okunmalı ve
her PR açıklamasına ilgili maddeler taşınmalıdır.

## Amaç

- Mevcut kullanıcı verisini ve davranışı koruyarak `src/` tabanlı feature + shared mimariye geçmek.
- Dosya taşıma ile davranış değişikliğini aynı PR'da karıştırmamak.
- Storage, Firestore, notification, auth, monetization ve backend proxy sözleşmelerini testle kilitlemek.
- Refactor sonrası yeni feature eklemenin yolu belli, import grafiği anlaşılır, test kapsamı sürdürülebilir
  bir kod tabanı bırakmak.

## Ön Koşullar

1. **Mevcut durum snapshot'ı üretildi.**
   - Satır sayıları: büyük dosyalar ve refactor edilecek feature'lar.
   - Hook/side-effect sayıları: büyük ekranlar ve `App.tsx`.
   - Direct I/O noktaları: `AsyncStorage`, Firestore, native SDK, network.
   - Storage key inventory: `storageKeys` dışındaki literal key'ler ayrıca listelendi.
2. **Doğrulama ortamı hazır.**
   - `npm run typecheck`, `npm run typecheck:test`, `npm run test:ci` yerelde yeşil.
   - `npm run typecheck:rules` yeşil.
   - `npm run test:rules` için Java/JDK, Firebase CLI ve emulator portları hazır.
   - `npm run typecheck:worker`, `npm --prefix functions run build`, `npm --prefix functions run lint`
     backend değişikliklerinde yeşil.
3. **CI yoksa önce CI eklenir.**
   - Bu refactor'un ilk merge edilebilir PR'ı davranış değiştirmeyen verify workflow'u olmalıdır.
   - CI path-filter kullanabilir ama Faz 0 sonunda full verify manuel/CI olarak kanıtlanır.
4. **Artifact hijyeni sağlandı.**
   - Test/build çıktıları (`coverage/`, `config/coverage/`, generated reports) source control'a girmez.
   - Mevcut izlenen artifact varsa davranış değişikliğinden ayrı cleanup PR'ı açılır.

## Mimari Kurallar

### Import Yönü

```
src/app -> src/features -> src/shared
backend/* -> backend/shared
src/shared -> hiçbir feature import etmez
feature A -> feature B sadece public facade (`features/<name>/index.ts`) üzerinden
```

Yasaklar:
- Feature iç dosyasına başka feature'dan doğrudan import.
- UI component'ten doğrudan Firestore/AsyncStorage/native SDK çağrısı.
- `shared` içinden feature import'u.
- Yeni relative import zincirleriyle `../../../services/...` benzeri yolları büyütmek.

### Public API Kuralı

Her feature şu şekilde dışa açılır:

```
src/features/<feature>/index.ts
```

Ekranlar, hook'lar ve servisler feature dışına yalnızca bu facade üzerinden sunulur. İç klasör yapısı
refactor sonrasında güvenle değiştirilebilir.

## Sahiplik Matrisi

| Alan | Yeni sahiplik | Not |
|------|---------------|-----|
| App bootstrap, providers, navigation, lifecycle | `src/app/*` | `App.tsx` kökte shim kalır |
| Auth + native/social sign-in | `src/features/auth/*` | `nativeGoogleSignIn`, `googleAuthConfig` dahil |
| Profile cache/builders | `src/features/profile/*` | `socialAuthProfile` dahil |
| Sync orchestration | `src/features/auth/services/sync/*` | Dış API başlangıçta korunur |
| Learning UI + vocabulary | `src/features/learning/*` | `assetLoader` tek require kapısı |
| Grammar explanation | `src/features/grammar/*` | `groqService`, grammar cache, proxy client |
| Progress | `src/features/progress/*` | storage shape değişmez |
| Favorites | `src/features/favorites/*` | legacy `number[]` migration korunur |
| Streak | `src/features/streak/*` | normalize/derive/canonical testleri korunur |
| Notifications | `src/features/notifications/*` | facade eski API'ı korur |
| Settings | `src/features/settings/*` | stale Firestore import temizlenir |
| Setup | `src/features/setup/*` | direct `setDoc` kapanır |
| Monetization | `src/features/monetization/*` | native + web AdMob facade birlikte taşınır |
| Review prompt | `src/features/review/*` | `reviewPromptService`, `AppRatingPrompt` |
| Shared UI/theme/i18n/storage/firebase/config | `src/shared/*` | feature import etmez |
| Grammar proxy core | `backend/shared/*` | Vercel ve Worker ince adaptör olur |

## Veri Sözleşmeleri

### AsyncStorage

- String key değerleri değişmez.
- `storageKeys.ts` tek kaynak yapılır; mevcut literal key'ler ya buraya eklenir ya legacy cleanup
  listesine yazılır.
- Bilinen eksik/literal noktalar:
  - `@app_launch_count`
  - `@profile_email`
  - `@profile_name`
  - ekranlarda kullanılan doğru değerli ama merkezi olmayan `@native_language`, `@target_language`,
    `@user_level`, `@shuffle_order_...`
- `typedStorage` migration'ı davranış değiştiren bir rewrite değil, tipli erişim katmanıdır. Her domain
  tek PR'da geçirilmeli ve round-trip testi eklenmelidir.

### Firestore

- Client yazımı tek kapı: `src/shared/firebase/userDoc.ts`.
- `UserDocPayload` alan listesi `firestore.rules` ile birebir eşleşir.
- `notificationSettings` partial yazılmaz. Disabled davranış için karar Faz 0'da sabitlenir:
  - önerilen varsayılan: `enabled: false` + diğer alanlar default değerlerle tam payload,
  - alternatif: alanı yazmamak veya `null` kullanmak; ancak bu karar Setup/Auth/Sync davranışıyla test edilir.
- `serverTimestamp()` gibi Firestore sentinel kullanımı `userDoc` helper'ının bilinçli API'ı içinde kalır.

### Backend / Env

- Client tarafında yalnızca public config okunur (`EXPO_PUBLIC_*`, Firebase client config, AdMob app id,
  RevenueCat public SDK key gibi).
- Server secret'ları (`GROQ_API_KEY`, service account JSON, Upstash token, Worker KV binding) client bundle'a
  giremez ve dokümana değer olarak yazılmaz.
- Vercel ve Worker grammar proxy davranışı ortak core testleriyle eşitlenir; platform farkları adaptörde kalır.

## PR Boyutu ve Sıralama

Her PR tek amaç taşır:

1. **Safety PR:** test/CI/snapshot/contract.
2. **Move-only PR:** `git mv` + shim + import update; davranış değişmez.
3. **Extraction PR:** saf fonksiyon/hook çıkarımı; önce golden test.
4. **Contract PR:** storage/firestore/env/backend sözleşmesi; rules/contract test zorunlu.
5. **Cleanup PR:** shim kaldırma, dead import temizliği, coverage exclude azaltma.

Tek PR'da yapılmamalı:
- Dosya taşıma + mantık rewrite + test framework değişikliği.
- Storage key migration + UI refactor.
- Native dependency/config değişikliği + lifecycle refactor.

## Karakterizasyon Testleri

Refactor başlamadan veya ilgili modül taşınmadan önce şu davranışlar testle kilitlenir:

- Initial route: onboarding/login/setup/home kararları.
- AppState foreground: sync + notification maintenance + ad refresh sırası.
- Notification slot planı: 64 toplam, 63 vocabulary, 1 streak, frekanslar.
- Notification response dedupe ve pending word tüketimi.
- Auth cache-first + device-id collision davranışı.
- Firestore user payload shape ve `notificationSettings` disabled path.
- Favorites legacy `number[]` migration.
- Vocabulary schema v2 migration ve asset loader coverage.
- App-open ad launch counter (`@app_launch_count`) ve premium -> no ads.
- Grammar cache + proxy error/rate-limit davranışı.
- Review prompt cooldown/launch-count/state davranışı.

## CI Gate

Minimum PR gate:

```bash
npm ci
npm run typecheck
npm run typecheck:test
npm run test:ci
```

Koşullu gate:

```bash
npm run typecheck:rules
npm run test:rules
npm run typecheck:worker
npm --prefix functions run build
npm --prefix functions run lint
npm run audit:prod
```

Rules gate sadece "rules değiştiyse" değil, client Firestore payload builder değiştiyse de çalışır.

## Review Checklist

Her PR review'unda şu sorular cevaplanır:

- Bu PR davranış değiştiriyor mu? Değiştiriyorsa onaylı mı?
- Eski import yolu için shim gerekiyor mu? Gerekiyorsa ne zaman kaldırılacak?
- Storage key değeri veya JSON shape değişti mi?
- Firestore payload rules'tan geçiyor mu?
- Native SDK çağrısı UI'dan adaptöre taşındı mı?
- Feature dışına açılan API facade üzerinden mi?
- Coverage exclude listesi kısaldı mı veya neden kısalmadı?
- Rollback tek `git revert` ile mümkün mü?

## Başarılı Refactor'un Tanımı

Refactor bittiğinde:

- Kök uygulama kodu `src/` altında; kök `App.tsx` sadece shim.
- Büyük ekranlar layout/composition seviyesine inmiş; domain state hook'larda, I/O servislerde.
- Storage ve Firestore sözleşmeleri tipli, testli ve tek kapıdan geçiyor.
- Notification, monetization, grammar proxy gibi riskli alanlar facade + saf core + adapter ayrımına sahip.
- CI tüm kritik matrisleri koşturuyor; coverage exclude listesi minimumda.
- Yeni feature ekleyen bir mühendis nereye dosya koyacağını, hangi facade'ı kullanacağını ve hangi testleri
  yazacağını dokümana bakarak anlayabiliyor.
