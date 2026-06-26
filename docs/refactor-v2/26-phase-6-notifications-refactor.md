# 26 — Phase 6: Notifications Refactor

1. **Amaç** — `notificationService` (1355) tek yüzeyini facade + permission/scheduler/response/tracking arayüzlerine bölmek (`12`).
2. **Kapsam** — NotificationFacade, domain scheduling rules (saf), PermissionRepository, Scheduler, TrackingRepository, ResponseHandler, useNotificationSettings hook.
3. **Kapsam dışı** — Settings UI bölme (Phase 7); monetization.
4. **Ön koşullar** — Phase 2 (lifecycle hook), Phase 4 (auth/notificationSettings).
5. **Etkilenecek dosyalar** — `services/notificationService.ts`, `services/notificationFrequency.ts`, `app/lifecycle/useAppLifecycle.ts`, `App.tsx` listener’ları (Phase 2’de taşınmış).
6. **Taşınacak/bölünecek dosyalar** — notificationService → 4 arayüz + facade + domain rules; frequency → domain.
7. **Yeni hedef klasör yapısı** — `features/notifications/{application,domain,data,presentation}` (bkz. `12`).
8. **Adım adım işler** — (a) scheduling hesabını saf domain fonksiyonuna çıkar (pencere+frequency+64-slot+streak rezerv); (b) PermissionRepository; (c) Scheduler (expo-notifications); (d) TrackingRepository (AsyncStorage); (e) ResponseHandler (pending word→navigation); (f) NotificationFacade; (g) lifecycle facade’ı çağırsın; (h) shim.
9. **Kod davranışı korunacak noktalar** — 64-slot + 1 streak rezerv; `NOTIFICATION_CONTENT_VERSION=4` yeniden planlama; tek-kez permission; `@pending_notification_word`; foreground/background zaman damgaları; tüm storage key’leri.
10. **Firestore/Storage/Auth/Notification etkileri** — Notification: davranış birebir; Storage: tracking key’leri aynı; Auth: notificationSettings okuma korunur.
11. **Test gereksinimleri** — scheduling domain (≥%85): pencere/frequency→slot, 64 taşma, streak rezerv; frequency; response handler hedefi.
12. **Manuel QA checklist** — [ ] frequency değiştir→sayı beklenen [ ] bildirime tıkla→doğru kelime/ekran [ ] permission reddi graceful [ ] foreground bakımı [ ] streak hatırlatıcı.
13. **Riskler** — R3 (zamanlama bozulması). Azaltma: domain testleri + staged rollout.
14. **Rollback planı** — Shim ile eski notificationService.
15. **Kabul kriterleri** — 4 arayüze bölünmüş; domain coverage ≥%85; davranış birebir.
16. **Sonraki faza geçmeme şartları** — Zamanlama/teslimat QA regresyonu varsa Phase 7’ye geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 6 → PR-6.1 scheduling domain rules, 6.2 PermissionRepository, 6.3 Scheduler, 6.4 TrackingRepository, 6.5 ResponseHandler, 6.6 Facade+lifecycle+shim.
- **4 alt-arayüz:** `35` §6 (Permission/Scheduler/Tracking/Response + `NotificationFacade`).
- **Korunan sabitler (`domain/constants`):** `MAX_SCHEDULED_NOTIFICATIONS=64`, rezerv `1`, `MAX_VOCABULARY_NOTIFICATIONS=63`, `NOTIFICATION_CONTENT_VERSION=4`, freq `60/120/180/360/1440`, streak `21:00`, id `vocbee-vocab-`/`vocbee-streak-reminder`/legacy `vocbee-refill-`, kanal `vocabulary`/`streak`.
- **Shim:** `36` §7.6 (`notificationService` `export *`).
- **Testler:** `37` §7 (scheduling saf, ≥%85; ≤63 vocab slot, streak rezervi).
- **Gate:** 4 arayüze bölünmüş; domain coverage ≥%85; zamanlama/teslimat QA regresyonsuz.
