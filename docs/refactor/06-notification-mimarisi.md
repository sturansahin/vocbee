# 06 — Notification Mimarisi

## Mevcut Durum

Tüm bildirim mantığı `services/notificationService.ts` (1176 satır) içinde. Gerçek davranışlar:

- **Sabitler:** `NOTIFICATION_CONTENT_VERSION = 4`, `MAX_SCHEDULED = 64` (Expo/iOS limiti),
  1 slot streak için rezerve → `MAX_VOCABULARY = 63`.
- **Varsayılan ayarlar:** başlangıç 09:00, bitiş 21:00, frekans 120 dk, `autoMark = true`.
  İzinli frekanslar: `[60, 120, 180, 360, 1440]` dk.
- **Streak reminder:** her gün 21:00.
- **Android kanalları:** `vocabulary` ve `streak`.
- **Sorumluluklar:** permission isteme/kontrol, izin gate (`ensureAuthenticatedUserNotificationPermission`),
  slot zaman hesaplaması, kelime seçimi + içerik şablonu, schedule/iptal, teslim edilenleri işleme
  (`processDelivered`), tracked-notification kaydı (`@tracked_notifications`), foreground bakımı
  (`runNotificationMaintenance`), response tüketimi (`consumeNotificationResponse`).
- Settings (`@notification_settings`) ile sürülen davranış; `SyncService` ile Firestore'a yazılır.

## Sorunlar

1. **Tek dosyada çok ilgi alanı:** permission, scheduling, içerik, tracking, bakım iç içe.
2. **Saf hesaplamalar (slot zamanı, kelime seçimi) yan etkilerle karışık** → izole test zor.
3. **`jest.config.js` bu dosyayı coverage'tan hariç tutmuş** (kısmen test var: `notificationService.test.ts`,
   `notificationFrequency.test.ts`) ama kapsam düşük.
4. **`App.tsx` ile sıkı bağ:** maintenance/response/permission doğrudan `App.tsx` lifecycle'ından çağrılıyor (bkz. `03`).

## Önerilen Yaklaşım: Tek facade, içeride saf/IO ayrımı

Dış API (çağrı imzaları) **birebir** korunur; iç modüllere bölünür. Slot/içerik hesapları **saf**
fonksiyonlara çıkar (kolay test); SDK erişimi tek adaptörde toplanır.

```
features/notifications/
  index.ts                       # public facade: eski notificationService API'ı (aynı imzalar)
  services/
    permission.ts                # izin iste/kontrol + ensureAuthenticatedUser... gate
    scheduler.ts                 # schedule/iptal; MAX_SCHEDULED/streak rezervasyonu burada
    slotPlanner.ts               # SAF: başlangıç/bitiş/frekanstan slot zamanları (test edilebilir)
    contentBuilder.ts            # SAF: kelime + i18n -> bildirim başlık/gövde (CONTENT_VERSION burada)
    tracking.ts                  # @tracked_notifications okuma/yazma + processDelivered
    maintenance.ts               # runNotificationMaintenance (foreground/resume orkestrasyonu)
    responses.ts                 # consumeNotificationResponse + dedupe
    streakReminder.ts            # 21:00 streak reminder zamanlaması
    channels.ts                  # Android kanal kurulumu (vocabulary/streak)
    expoAdapter.ts               # expo-notifications çağrıları tek yerde (mock'lanabilir)
  constants.ts                   # MAX_SCHEDULED=64, MAX_VOCABULARY=63, izinli frekanslar, default settings
  types.ts                       # NotificationSettings, TrackedNotification, ...
```

**Kritik:** `constants.ts`'teki sayılar (64, 63, frekans listesi, 09:00/21:00, version=4) **değişmez**.
`slotPlanner` ve `contentBuilder` saf olduğu için mevcut davranışı önce **golden test** ile sabitlenir,
sonra taşınır. Schedule edilen bildirim sayısı, saatleri ve içerik anahtarları korunur.

## Alternatifler ve Neden Elendiler

- **3. parti scheduling kütüphanesi** — Elendi: Expo Notifications yeterli; yeni bağımlılık + risk.
- **Notification'ı backend'e (FCM push) taşı** — Elendi (kapsam dışı): mevcut lokal-schedule davranışı
  korunmalı; push'a geçiş ayrı ürün kararı.
- **Tek dosyayı bölmeden bırak** — Elendi: en büyük 3. dosya; büyüdükçe dokunulamaz hale gelir.
- **Saf hesapları ekran hook'una taşı** — Elendi: scheduling cross-cutting; feature service'te kalmalı.

## Migration / Implementasyon Adımları

1. **PR-1 (golden test):** Mevcut slot zamanı ve içerik üretimi davranışı için kapsamlı testler ekle
   (çeşitli frekans/başlangıç/bitiş kombinasyonları; `MAX_VOCABULARY` sınırı; streak slotu). Kod taşınmadan.
   - Komut: `npm run typecheck && npm run test:ci`
2. **PR-2:** `constants.ts` ve `types.ts`'i ayır (değerler aynı); dosya içinden import et.
3. **PR-3:** Saf `slotPlanner.ts` ve `contentBuilder.ts`'i çıkar; golden testler bunlara yönlendirilir.
4. **PR-4:** `expoAdapter.ts` + `channels.ts` (SDK erişimi tek kapı).
5. **PR-5:** `permission.ts`, `scheduler.ts`, `tracking.ts` ayır.
6. **PR-6:** `maintenance.ts`, `responses.ts`, `streakReminder.ts` ayır; `index.ts` facade eski API'ı yeniden ihraç eder.
7. **PR-7:** `App.tsx` lifecycle hook'ları (bkz. `03`) facade'tan tüketir; eski `notificationService.ts` shim re-export olur, sonra kaldırılır.

Her PR sonunda: `npm run typecheck && npm run typecheck:test && npm run test:ci`.

## Riskler

- **Schedule sayısı/zamanı kayarsa** kullanıcı yanlış saatte/eksik bildirim alır. Azaltım: golden testler
  (PR-1) davranışı kilitler; `MAX_SCHEDULED`/`MAX_VOCABULARY` sabit kalır.
- **`@tracked_notifications` şeması değişirse** teslim işleme bozulur. Azaltım: storage anahtarı ve JSON
  şekli korunur (bkz. `11`).
- **Permission gate sırası** değişirse izin istemi yanlış anda çıkar. Azaltım: `03`'teki effect sırası korunur.
- **Android kanal id'leri** (`vocabulary`/`streak`) değişmemeli (mevcut planlanmış bildirimlerle uyum).

## Test ve Kabul Kriterleri

- `slotPlanner`/`contentBuilder` saf birim testleri (golden) yeşil; coverage hariç listesinden çıkarılır.
- Mevcut `notificationService.test.ts` ve `notificationFrequency.test.ts` yeşil kalır.
- `scheduler` testi: `MAX_VOCABULARY=63` + 1 streak slotu = 64 sınırı aşılmaz.
- `npm run typecheck`, `npm run test:ci` yeşil.

## Etkilenecek Dosyalar

```
services/notificationService.ts -> src/features/notifications/index.ts (facade)
                                 -> src/features/notifications/services/{permission,scheduler,slotPlanner,
                                    contentBuilder,tracking,maintenance,responses,streakReminder,channels,expoAdapter}.ts
                                 -> src/features/notifications/{constants,types}.ts
App.tsx (notif çağrıları)         -> src/app/lifecycle/* (facade'tan tüketir; bkz. 03)
services/__tests__/notificationService.test.ts        -> import yolu güncellenir
services/__tests__/notificationFrequency.test.ts      -> import yolu güncellenir
```
