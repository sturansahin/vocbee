# 32 — Implementation-Spec Index (Uygulama Sözleşmesi Haritası)

> Bu dosya bir **implementation-spec**tir. İçindeki ve atıf yaptığı tüm kod blokları **örnek / contract / skeleton**dır;
> gerçek implementasyon değildir. Bu görevde hiçbir kaynak kod, `firestore.rules` veya Firestore verisi değiştirilmemiştir.
> `32`–`39` dokümanları, `00`–`31` strateji dokümanlarının **"nasıl?"** katmanıdır.

## 1. Bu doküman setinin amacı
`00`–`31` "ne yapılacak?" sorusunu yanıtlıyor (strateji, faz, risk). Bu set (`32`–`39`) "nasıl yapılacak?" sorusunu
yanıtlar: somut TypeScript tipleri, repository/adapter sözleşmeleri, Firestore DTO'ları, legacy→v2 dönüşüm iskeletleri,
migration dry-run iskeleti, shim reçeteleri, import sınırları, ESLint/alias/CI konfig önerileri, test skeleton'ları ve
PR seviyesinde faz kırılımı. Hedef: Phase 0'dan başlayan kişi/model **kendi mimarisini uydurmadan** bu sözleşmeleri izlesin.

## 2. Hangi doküman ne için? (spec haritası)
| Spec | Başlık | Ne zaman kullanılır |
|---|---|---|
| `32` | Implementation-Spec Index (bu dosya) | Her zaman ilk; karar sırası ve zorunlu okuma listesi |
| `33` | Layer Contracts & Import Rules | Her PR'da; bir dosyanın hangi katmana ait olduğu ve neyi import edebileceği |
| `34` | Firestore Types / Rules / Migration Spec | Phase 3 (`23`); v2 tipleri, rules skeleton, dry-run iskeleti |
| `35` | Repository & Adapter Contracts | Phase 3-8; her feature'ın `data/` katmanı yazılırken |
| `36` | Shim & File-Move Recipes | Her taşıma PR'ında; eski yolu kırmadan dosya taşıma |
| `37` | Testing Code Templates | Her PR'da; domain/adapter/repo/rules/hook test iskeletleri |
| `38` | CI / ESLint / Alias Config Spec | Phase 0-1; alias, lint sınırı, CI pipeline |
| `39` | Phase PR Breakdown | Her faz başında; fazı küçük PR'lara bölme |

## 3. Hangi fazda hangi spec okunmalı?
| Faz | Önce oku |
|---|---|
| Phase 0 (`20`) | `32`, `38` (CI/secret), `37` (baseline test komutları) |
| Phase 1 (`21`) | `32`, `33`, `38` (alias), `36` (shared shim) |
| Phase 2 (`22`) | `33`, `36`, `39` (App.tsx kırılımı) |
| Phase 3 (`23`) | `34`, `35` (ProgressRepository), `37` (migration/rules test), `39` |
| Phase 4 (`24`) | `33`, `35` (Auth/Profile/Sync repo), `36`, `37`, `39` |
| Phase 5 (`25`) | `35` (Vocabulary/Progress repo), `33`, `36`, `37`, `39` |
| Phase 6 (`26`) | `35` (Notification repo), `33`, `37`, `39` |
| Phase 7 (`27`) | `33`, `35` (Settings/Preferences repo), `36`, `39` |
| Phase 8 (`28`) | `35` (Monetization repo), `33`, `37`, `39` |
| Phase 9 (`29`) | `36` (shim silme), `34` (eski alan cleanup), `38` (coverage sertleştirme) |

## 4. Refactor'a başlamadan önce okunması ZORUNLU dosyalar
Sırasıyla:
1. `03-current-app-behavior.md` — değişmez davranış sözleşmesi (regresyon referansı).
2. `02-target-architecture.md` + `05-folder-structure-plan.md` — hedef yapı.
3. `33-layer-contracts-and-import-rules.md` — katman/import kuralları.
4. `34` + `35` — veri modeli + repository/adapter sözleşmeleri.
5. `18-definition-of-done.md` — her PR/faz DoD.
6. İçinde bulunulan fazın dokümanı (`20`–`29`) + `39` ilgili bölümü.

## 5. Kod yazarken takip edilecek karar sırası (decision flow)
Her yeni/taşınan kod parçası için, sırayla şu soruları yanıtla:

```text
1. Bu kod hangi feature'a ait?            → 04-feature-boundaries.md
2. Hangi katman?                          → 33 (presentation / application / domain / data / shared)
3. Bu katman neyi import edebilir?        → 33 import matrisi
4. Dış SDK'ya mı dokunuyor?               → EVET ise data/ katmanı + repository (35)
5. Saf iş kuralı mı (SDK'sız)?            → EVET ise domain/ (saf TS, test-first)
6. UI mi?                                 → presentation/ (yalnızca application+domain çağırır)
7. Firestore şekli değişiyor mu?          → 34 (DTO + adapter + dual-read)
8. Eski import yolu kırılır mı?           → 36 (shim koy)
9. Test nasıl?                            → 37 (uygun skeleton)
10. PR çok mu büyük?                      → 39 (daha küçük PR'a böl)
```

*Skeleton/contract — implementasyon değil.* Aşağıdaki dosya başlık yorumu, her yeni dosyanın başına eklenebilecek
katman etiketi örneğidir:

```ts
// SKELETON — implementasyon değil, hedef contract örneğidir.
// Layer: domain | Feature: progress | Pure TS (no SDK imports)
```

## 6. "Kararsız kalınca ne yapılmalı?" kuralları
- **Katman belirsizse:** En kısıtlı katmanı seç. SDK'ya dokunuyorsa `data`; saf hesapsa `domain`; ikisi arası
  orkestrasyon ise `application`. Şüphede UI'a iş mantığı koyma.
- **Yeni soyutlama gerekli mi belirsizse:** `06` ve `18` "over-engineering checklist"ini uygula — soyutlamanın
  **>1 gerçek tüketicisi/varyantı** yoksa açma. Trivial tek-çağrı wrapper'ı yazma.
- **Feature sınırı belirsizse:** `04`'e bak; orada da yoksa dosyayı en çok tüketen ekrana/akışa göre yerleştir,
  kararı PR açıklamasına yaz.
- **Davranış değişecek gibi görünüyorsa:** DURMA kuralı — `03` sözleşmesini ihlal eden hiçbir değişiklik yapma;
  refactor davranışı korumalıdır, "iyileştirme" başka PR/iştir.
- **Firestore şekli/alan adı belirsizse:** Mevcut `firestore.rules → validUserDocument` `hasOnly` listesi
  bağlayıcıdır; `34` dışına çıkan alan ekleme.
- **İki yol da makulse:** Daha az dosya dokunan, shim ile geri alınabilir olanı seç; kararı not et (`autonomy`).

## 7. Uygulama davranışını koruma kuralı (binding)
- `03-current-app-behavior.md` içindeki 17 başlık **değişmez sözleşmedir**. Refactor sonrası bunlar **birebir** çalışmalı.
- `services/storageKeys.ts` içindeki tüm string değerleri AYNEN korunur (kullanıcı verisi bunlara bağlı).
- Firestore'a yazılan her payload `firestore.rules` ile uyumlu kalır.
- Bildirim 64-slot + 1 streak rezervi, `NOTIFICATION_CONTENT_VERSION=4`, RevenueCat `premium` entitlement,
  device-id tabanlı sync çakışma çözümü korunur.

## 8. Firestore veri kaybı önleme kuralı (binding)
- Sıra **her zaman**: **kopyala → doğrula → en son temizle** (`08`).
- Eski `progress.learnedWords` / `favorites` alanları migration doğrulanana ve uyumluluk penceresi kapanana kadar
  **silinmez** (cleanup yalnızca Phase 9 / `29`).
- Yeni app bir süre **dual-read** yapar (yeni `progressByLevel` → boşsa eski alana fallback).
- **Dual-write** gerekiyorsa sınırlı ve geçicidir; `schemaVersion` ile yönetilir.
- Hiçbir migration script'i bu doküman setinde çalıştırılmaz; yalnızca `--dry-run` iskeleti tanımlanır (`34`).

## 9. Import sınırları (özet — tam kurallar `33`)
```text
app          → features, shared
presentation → application, domain, shared/ui|theme|i18n
application   → domain, data (repository interface), shared
domain        → (yalnızca kendi tipleri) — Firebase/AsyncStorage/Expo/React YASAK
data          → domain, shared/firebase|storage|api + dış SDK'lar
shared        → shared (feature-specific iş mantığı YASAK)
feature ↔ feature → yalnızca index.ts barrel üzerinden
```

## 10. Test-first yaklaşım önerisi
- **Domain ve adapter** kodu test-first yazılır: önce `37`'deki ilgili skeleton'dan test, sonra implementasyon.
  Bunlar saf/SDK'sız olduğu için en yüksek ROI'li ve `jest.config.js` exclude listesi dışına çıkarılabilecek ilk kodlardır.
- **Repository** kodu fake/mock ile sözleşme testiyle gelir (`37` §3).
- **Migration transform** kodu, `37` §migration edge-case listesi tamamlanmadan "bitti" sayılmaz.
- Firestore rules değişiklikleri `tests/firestoreRules.ts` desenine eklenen emulator testleriyle doğrulanır (`34`/`37`).
- Komutlar (gerçek `package.json`): `npm run typecheck`, `npm run test:ci`, `npm run test:rules` (bkz. `38`).

## İlgili dokümanlar
`00`–`31` (strateji + faz), `33`–`39` (diğer spec'ler), `18` (DoD), `03` (davranış sözleşmesi).
