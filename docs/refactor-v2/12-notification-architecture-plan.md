# 12 — Notification Mimari Planı

## Mevcut durum
`services/notificationService.ts` (1355) tek dosyada: permission, settings, scheduling, refill,
tracking (`@tracked_notifications`), response handling, test notification, streak reminder.
`services/notificationFrequency.ts` (33) frequency yardımcısı. `App.tsx` listener’ları ve maintenance’ı tetikliyor.

Sabitler: `MAX_SCHEDULED_NOTIFICATIONS=64`, streak reserve=1, `NOTIFICATION_CONTENT_VERSION=4`,
`frequencyMinutes ∈ {60,120,180,360,1440}`, gün içi pencere (start/end saat).

## Problem
- ISP ihlali: ~30 export tek yüzey. Coverage dışı (en riskli kod en az test).
- Permission + scheduling + response iç içe; UI (`App.tsx`) SDK’ya doğrudan bağlı.

## Hedef yapı (`features/notifications/`)
```
notifications/
  application/ NotificationFacade (sade API: setup, reschedule, handleResponse, sendTest)
               useCases/(enableNotifications, refillSchedule, maintainOnForeground)
  domain/      rules(scheduling: pencere+frequency+64-slot+streak-rezerv — SAF), constants
  data/        NotificationPermissionRepository, NotificationScheduler(expo-notifications),
               NotificationTrackingRepository(AsyncStorage), NotificationResponseHandler
  presentation/ hooks/(useNotificationSettings)
```
- **Facade** karmaşık alt sistemi sade arayüzle sunar; `App.tsx` yalnızca facade çağırır (`app/lifecycle`).
- Bildirim tipi (kelime/streak/test) **Factory**; scheduling algoritması **Strategy**.
- Scheduling hesabı (kaç slot, hangi saatler) **saf domain fonksiyonu** → yüksek coverage.

## Davranış korunacak noktalar
- 64-slot limiti + 1 streak rezervi; `NOTIFICATION_CONTENT_VERSION` değişince yeniden planlama.
- Permission tek kez sorma (`@notification_permission_prompted_${uid}`).
- Pending word (`@pending_notification_word`) → ilgili ekran. Foreground/background zaman damgaları.
- Tüm storage key’leri aynen.

## Test gereksinimleri
- domain scheduling: pencere+frequency → doğru slot listesi; 64 taşma; streak rezervi (saf, kritik).
- frequency hesabı (`notificationFrequency`).
- response handler: pending word → navigation hedefi.

## Manuel QA
- Frequency değiştir → zamanlanmış bildirim sayısı beklenen.
- Bildirime tıkla → doğru kelime/ekran.
- Permission reddi → graceful.

## Riskler / rollback
- Risk: zamanlama regresyonu (kullanıcı bildirim alamaz) → domain testleri + staged rollout.
- Rollback: shim ile eski `notificationService` davranışı.

## Kabul kriterleri
- `notificationService` mantığı 4 arayüze bölünmüş; domain coverage ≥ %85; davranış birebir.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **4 alt-arayüz sözleşmesi:** `35-repository-adapter-contracts.md` §6 — `NotificationPermissionRepository`, `NotificationScheduler`, `NotificationTrackingRepository`, `NotificationResponseHandler` + `application/NotificationFacade`.
- **Korunacak sabitler (domain/constants):** `MAX_SCHEDULED_NOTIFICATIONS=64`, `STREAK_NOTIFICATION_RESERVED_SLOTS=1`, `MAX_VOCABULARY_NOTIFICATIONS=63`, `NOTIFICATION_CONTENT_VERSION=4`; frequency `60/120/180/360/1440` (`notificationFrequency.ts` keyleri); streak reminder `21:00`; id prefix'leri `vocbee-vocab-`/`vocbee-streak-reminder`/legacy `vocbee-refill-`; Android kanalları `vocabulary`/`streak`.
- **Saf domain scheduling testi:** `37` §7 (pencere/frequency→slot listesi; ≤63 vocab slot; streak rezervi). Hedef coverage ≥%85.
- **PR kırılımı:** `39` Phase 6 (PR-6.1 domain rules → 6.2 permission → 6.3 scheduler → 6.4 tracking → 6.5 response → 6.6 facade+lifecycle+shim).
- **Shim:** `36` §7.6 (`notificationService` ~48 named export → `export *` barrel).
