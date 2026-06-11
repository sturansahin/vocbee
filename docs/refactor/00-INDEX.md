# VocBee Refactor Dokümantasyonu

Bu klasör, VocBee (Expo SDK 54 / React Native 0.81 / React 19 / TypeScript strict) uygulamasının
büyümeye hazır hâle getirilmesi için hazırlanmış **uygulamaya hazır** refactor planlarını içerir.

> ⚠️ Bu dokümanlar yalnızca **plan**dır. Bu aşamada hiçbir uygulama kodu taşınmamış veya değiştirilmemiştir.
> Kod refactor'una yalnızca, planlar onaylandıktan ve `18-roadmap.md`'deki sıralama kabul edildikten sonra başlanmalıdır.

## Okuma sırası

| # | Doküman | Konu |
|---|---------|------|
| 01 | `01-mimari-audit.md` | Mevcut mimari audit'i (güçlü/zayıf yönler) |
| 02 | `02-hedef-mimari.md` | Önerilen hedef klasör ve modül yapısı + gerekçe |
| 03 | `03-bootstrap-provider-navigation.md` | App bootstrap, provider zinciri, navigation, lifecycle |
| 04 | `04-sorumluluk-ayrimi.md` | Screen / component / hook / service sorumluluk ayrımı |
| 05 | `05-auth-profile-sync.md` | Auth, profile ve Firebase sync mimarisi |
| 06 | `06-notification-mimarisi.md` | Notification mimarisi |
| 07 | `07-learning-domainleri.md` | Learning, vocabulary, progress, favorites, streak domainleri |
| 08 | `08-settings-setup-parcalama.md` | Settings ve Setup ekranlarının parçalanması |
| 09 | `09-ui-tema-responsive.md` | UI component sistemi, tema, responsive, dark mode |
| 10 | `10-i18n.md` | i18n / localization yapısı |
| 11 | `11-storage-cache-offline-migration.md` | Storage, cache, offline ve migration stratejisi |
| 12 | `12-monetization-admob-revenuecat.md` | AdMob, RevenueCat ve monetization akışı |
| 13 | `13-security-env-rules.md` | Security, env ve Firebase rules riskleri |
| 14 | `14-test-stratejisi.md` | Test stratejisi |
| 15 | `15-performans.md` | Performans stratejisi |
| 16 | `16-cicd-release-versioning.md` | CI/CD, release ve versioning |
| 17 | `17-risk-register.md` | Risk register |
| 18 | `18-roadmap.md` | Phase-based implementation roadmap |
| 19 | `19-definition-of-done.md` | Definition of Done checklist'leri |

## Her dokümanın ortak bölümleri

Konuya uygun olduğu ölçüde her doküman şu bölümleri içerir:

- **Mevcut Durum** — repodaki gerçek dosya ve davranışlar
- **Sorunlar**
- **Önerilen Yaklaşım**
- **Alternatifler ve Neden Elendiler**
- **Migration / Implementasyon Adımları** (PR/commit boyutunda)
- **Riskler**
- **Test ve Kabul Kriterleri**
- **Etkilenecek Dosyalar** (`eski yol -> yeni yol` mapping ile)

## Değişmez kabuller (tüm dokümanlar için bağlayıcı)

Aşağıdakiler refactor sırasında **bozulmamalıdır**. Her PR bu listeye karşı doğrulanmalıdır:

1. **AsyncStorage key string değerleri** — `services/storageKeys.ts` içindeki tüm string'ler birebir korunur.
   (`@VocBee:hasSeenOnboarding`, `@vocbee_user_data`, `@user_progress`, `@streak`, `@vocabulary_`,
   `@notification_settings`, `profile_`, `@favorites`, vb.)
2. **Firebase Firestore doküman yapısı** — `users/{uid}` dokümanının alanları ve şekli
   (`firestore.rules` `validUserDocument` ile sözleşmelidir): `email`, `displayName`, `photoURL`,
   `createdAt`, `setupCompleted`, `preferences`, `progress`, `streak`, `notificationSettings`,
   `lastActiveDeviceId`, `favorites`, `syncMeta`.
3. **Notification schedule davranışı** — `services/notificationService.ts` içindeki slot hesaplaması,
   64 bildirim limiti, streak rezervasyonu ve içerik versiyonu mantığı korunur.
4. **Auth akışı** — `context/AuthContext.tsx`'teki onAuthStateChanged cache-first stratejisi,
   device-id kontrolü ve setup yönlendirmesi korunur.
5. **Streak / progress verisi** — `services/streakService.ts` ve `services/progressService.ts`
   normalize/derive mantığı ve sakladığı şekiller korunur.
6. **Abonelik ve reklam akışları** — RevenueCat entitlement (`premium`) ve AdMob consent/ATT/
   gösterim mantığı korunur.

## Güvenlik notu

Bu dokümanlara **hiçbir secret, API key, `.env`, `plist` veya `json` değeri kopyalanmamıştır**.
Dosya referansları yalnızca yapısal amaçlıdır. Bkz. `13-security-env-rules.md`.

## Doğrulama komutları (repoda mevcut)

```bash
npm run typecheck            # tsc -p tsconfig.app.json --noEmit
npm run test:ci              # jest --runInBand
npm run typecheck:test       # tsc -p tsconfig.test.json --noEmit
npm run typecheck:rules      # tsc -p tsconfig.rules.json --noEmit
npm run typecheck:worker     # proxy/grammar-worker.ts tip kontrolü
npm --prefix functions run build
npm --prefix functions run lint
```
