# 06 — Clean Code, SOLID ve Design Patterns

## A. Clean Code kuralları (bu projeye özgü)
- **Tek sorumluluk:** Screen dosyası yalnızca kompozisyon yapar; veri/akış hook+use-case'e taşınır.
  Hedef: hiçbir screen > 400 satır (şu an Home 2391, Settings 2310).
- **Uzun fonksiyon parçalama:** `App.tsx` lifecycle, `AuthContext` cache-first fetch, `notificationService`
  schedule fonksiyonları küçük saf birimlere bölünür.
- **Magic number/string:** 64 (max notif), 1000 (favori limiti), 5 dk (recent-auth), frequency dakikaları,
  CEFR seviyeleri → `domain/constants.ts`. Storage key string'leri zaten merkezi (`storageKeys.ts`) — korunur.
- **Tekrar (DRY):** profil avatar, dil etiketleri, error toast örüntüleri ortaklaştırılır.
- **Dead code:** `SettingsScreen`/`SetupScreens` içindeki kullanılmayan/eski Firestore import izleri (`01`/`13`)
  temizlik fazında kaldırılır.
- **Error handling standardı:** `shared/errors/AppError` — `code`, `userMessage` (i18n key), `devMessage`,
  `cause`. Kullanıcıya gösterilen mesaj (`CustomAlert`) ile geliştirici log (console/Sentry) ayrılır.

## B. SOLID uygulaması
| Prensip | Mevcut ihlal | Hedef |
|---|---|---|
| **SRP** | `AuthContext` (auth+profile+notif+device+delete), god-screen'ler | screen/hook/use-case/repository ayrımı |
| **OCP** | yeni login provider/bildirim tipi eklerken çekirdek değişiyor | Strategy/Factory ile genişletme |
| **LSP** | repository soyutlaması yok | repository interface'leri + Firestore/AsyncStorage/fake implementasyonlar |
| **ISP** | `notificationService` ~30 export tek yüzey | Permission/Scheduler/Tracker/Responder ayrı arayüzler |
| **DIP** | ekranlar doğrudan Firebase/AsyncStorage'a bağlı | presentation → application → repository interface |

## C. Design Patterns — nerede / nerede değil / risk

### Repository Pattern
- **Nerede:** Firestore (`SyncService`, `favoritesService`, `AuthContext.deleteDoc`), AsyncStorage,
  local asset (`vocabularyService`), API (`groqService`) erişimi.
- **Nerede DEĞİL:** saf hesap (progress yüzde, streak normalize) — onlar domain.
- **Uygulanacak dosya:** `data/repositories/*Repository.ts` her feature'da.
- **Azalttığı risk:** SDK sızıntısı, test edilemezlik, Firestore model değişiminin her yere yayılması.
- **Over-engineering riski:** tek çağrılık trivial wrapper'lar; çözüm: yalnızca >1 tüketici olunca repository aç.

### Adapter Pattern
- **Nerede:** Firestore DTO ↔ app model, local vocabulary `.txt` JSON ↔ `Word` modeli, Groq API response ↔ app.
- **Nerede DEĞİL:** model zaten birebir eşleşiyorsa.
- **Dosya:** `data/adapters/*.ts`, `data/dto.ts`.
- **Risk azaltır:** `07` migration sırasında dual-read (eski/yeni şekil) tek noktada.
- **Over-engineering:** şekil aynıyken adapter; gereksiz.

### Facade Pattern
- **Nerede:** `notifications` setup (permission+schedule+track), app startup (`app/lifecycle`),
  auth/profile sync. Karmaşık alt sistemleri tek sade arayüzle sunar.
- **Nerede DEĞİL:** tek adımlı işlemler.
- **Dosya:** `features/notifications/application/NotificationFacade.ts`, `app/lifecycle/useAppLifecycle.ts`.
- **Risk azaltır:** screen/context'in alt sistem detayını bilmesi.
- **Over-engineering:** facade içi tek fonksiyon çağırıyorsa gereksiz.

### Factory Pattern
- **Nerede:** login provider (email/google/apple), bildirim tipi (kelime/streak/test), review stratejisi.
- **Nerede DEĞİL:** sabit tek varyant.
- **Risk azaltır:** yeni provider/tip eklerken switch'lerin çoğalması.
- **Over-engineering:** iki sabit seçenek için factory; basit map yeter.

### Strategy Pattern
- **Nerede:** kelime seçim/shuffle algoritması, tekrar (review) algoritması, notification scheduling,
  premium/free davranışı.
- **Nerede DEĞİL:** tek algoritma.
- **Dosya:** `features/learning/domain/rules.ts` + strateji arayüzleri.
- **Risk azaltır:** algoritma değişiminin UI'a sızması.
- **Over-engineering:** hipotetik gelecek algoritma için soyutlama; şimdi gerekmez.

### Dependency Injection
- **Nerede:** repository'lerin use-case'lere geçirilmesi (constructor/param/React context).
- **Hafif yaklaşım:** ağır DI container yok; basit factory + React context provider.
- **Risk azaltır:** test'te fake repository; Firebase'siz unit test.
- **Over-engineering:** InversifyJS gibi container; bu ölçekte gereksiz.

### Observer / Event Pattern
- **Nerede:** auth state (zaten `onAuthStateChanged`), RevenueCat listener, network/AppState, sync status.
- **Dosya:** mevcut listener'lar `data` katmanına sarılır; UI hook ile abone olur.
- **Risk azaltır:** dengesiz manuel polling.
- **Over-engineering:** global event bus; gerekmedikçe React state/context yeter.

## Kabul kriterleri
- `domain/` dosyalarında 0 SDK import (lint).
- Her god-dosya `01`'deki hedef satır altına iner.
- Pattern'ler yalnızca >1 tüketici/varyant olan yerde uygulanır (over-engineering checklist'i `18`).
