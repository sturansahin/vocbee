# 07 — Firestore Veri Modeli v2

> Bu doküman yalnızca **plan**dır. `firestore.rules` ve Firestore verisi bu aşamada DEĞİŞTİRİLMEZ.

## 1. Mevcut Firestore modeli
Tek doc: `users/{uid}` (kaynak: `firestore.rules → validUserDocument`, `services/SyncService.ts`).
Alanlar (rules `hasOnly` ile katı):
- `email, displayName, photoURL, createdAt, setupCompleted`
- `preferences { nativeLanguage, targetLanguage, level }`
- `progress { currentLevel, learnedWords: { [level]: number[] }, lastWordIndex, lastSync }`
- `streak { currentStreak, longestStreak, brokenStreak, lastQualifiedDay, lastQualifiedAt }`
- `notificationSettings { enabled, startHour, startMinute, endHour, endMinute, frequencyMinutes, autoMarkLearned }`
- `lastActiveDeviceId`
- `favorites: Array<{ id, level }>` (maks 1000)
- `syncMeta { version, updatedAt, updatedByDeviceId }`
- Catch-all: `match /{document=**} { allow read, write: if false }`

## 2. Mevcut modelin riskleri
- `progress.learnedWords[level]` sınırsız büyüyen dizi (5500+ kelimede A1..C1 toplamı binlerce id) → tek doc 1MB limitine yaklaşma riski, her güncellemede tüm dizi yeniden yazılır (yazma maliyeti + çakışma).
- `favorites` aynı doc'ta (maks 1000) → aynı yazma çakışması.
- Atomik olmayan kısmi güncellemeler: progress + streak + favorites tek doc → son yazan kazanır (device çakışması).
- `lastSync` string vs timestamp tutarsızlığı riski (`SyncService` analizi) → tarih tipleri standartlaşmalı.

## 3. Hedef Firestore modeli
```
users/{uid}
  displayName, email, photoURL, createdAt, lastActiveAt
  setupCompleted
  preferences { nativeLanguage, targetLanguage, level }
  notificationSettings { ... }       # değişmeden taşınır
  streak { ... }                      # küçük, sabit boyut — ana doc'ta kalır
  progressSummary { [level]: { learnedCount, totalCount, percent }, overallPercent }
  syncMeta { version, updatedAt, updatedByDeviceId }
  schemaVersion: 2
  lastActiveDeviceId

users/{uid}/progressByLevel/{level}        # A1..C1
  level, learnedWordIds: number[], lastWordIndex, learnedCount,
  favoriteWordIds?: number[], wrongWordIds?: number[],
  updatedAt, updatedByDeviceId?, version?

users/{uid}/wordProgress/{wordId}          # OPSIYONEL — sadece SRS gerekirse
  wordId, level, status, correctCount?, wrongCount?,
  learnedAt?, lastReviewedAt?, nextReviewAt?, updatedAt

users/{uid}/favorites/{wordId}             # OPSIYONEL — favori sayısı büyürse
  wordId, level, addedAt

users/{uid}/sessions/{sessionId}           # OPSIYONEL — history gerekirse
  startedAt, endedAt, level, totalWords, correctAnswers, wrongAnswers, score
```

## 4. Neden kelimeler local kalmalı?
5500+ kelime statik içerik (`assets/vocabulary/*.txt`, ~28MB). Değişmez, kullanıcıya özel değil. Firestore'a
taşımak: gereksiz okuma maliyeti, offline kaybı, app boyutu yerine network bağımlılığı. Local-first doğru karar.

## 5. Neden her kelime için document açılmamalı?
100+ kullanıcı × 5500 kelime = 550K+ doc; her "öğrendim" 1 yazma; liste/sayfalama maliyeti; okuma N+1.
Değişen state düşük hacimli olduğu için seviye-bazlı toplu doc yeterli.

## 6. `progressByLevel` neden daha uygun?
- En fazla 5 doc/kullanıcı (A1..C1). Yazma seviye bazında izole → çakışma azalır.
- `learnedWordIds` dizisi seviye başına sınırlı (her seviye ~1000-1500 kelime) → doc boyutu yönetilebilir.
- Ana doc küçülür → profil okumaları ucuzlar.

## 7. `wordProgress` hangi durumda kullanılmalı?
Yalnızca kelime bazında SRS (correct/wrong sayısı, nextReviewAt) ürün özelliği gelirse. Şu an ürün bunu
gerektirmiyor → açılmaz (varsayımsal özellik eklenmez kuralı).

## 8. Ana user document'te kalabilecek alanlar
`displayName, email, photoURL, createdAt, lastActiveAt, setupCompleted, preferences, notificationSettings,
streak, progressSummary, syncMeta, schemaVersion, lastActiveDeviceId`.

## 9. Subcollection'a taşınması gereken alanlar
`progress.learnedWords[level]` → `progressByLevel/{level}.learnedWordIds`; `progress.lastWordIndex` →
seviye doc'una; `favorites[]` → (büyürse) `favorites/{wordId}`, aksi halde `progressByLevel.favoriteWordIds`.

## 10. Index gereksinimleri
- `progressByLevel` ve `favorites` tekil doc erişimi (id ile) → özel index gerekmez.
- `wordProgress` (açılırsa) `nextReviewAt` sıralaması → tek alan index (otomatik).
- `sessions` (açılırsa) `startedAt desc` → tek alan index. **Yeni `firestore.indexes.json` planı `09`'da.**

## 11. Security rules stratejisi (plan)
- Yeni subcollection'lar için `match /users/{uid}/progressByLevel/{level}` → `request.auth.uid == uid`.
- Alan doğrulaması (`hasOnly`, tip, frequency aralıkları) ana doc'taki katı stille sürürülür.
- Catch-all `false` korunur. Detay + dual-write penceresi rules'ı `09`.

## 12. Backup stratejisi
Migration öncesi: GCP/Firebase yönetilen export (`gcloud firestore export gs://...`) ile tam yedek. Plan `08`.

## 13. Dual-read stratejisi
Repository önce `progressByLevel/{level}` okur; boşsa ana doc `progress.learnedWords[level]`'e fallback.
Adapter her iki şekli aynı app modeline çevirir.

## 14. Dual-write stratejisi
Geçiş penceresinde yazma hem yeni subcollection'a hem (eski app uyumu için) ana doc alanına yapılır;
`schemaVersion` ile kontrol. Pencere kapanınca yalnızca yeni şekil.

## 15. Migration dry-run stratejisi
Script (sadece plan, `08`) `--dry-run` ile yazmadan kullanıcı başına dönüşüm özeti üretir; çıktıda PII yok (uid maskeli).

## 16. Rollback stratejisi
Eski alanlar silinmediği için rollback = yeni app sürümünü geri çekmek + dual-write'ı kapatmak. Veri kaybı olmaz.

## 17. Eski alanların ne zaman temizleneceği
Tüm aktif kullanıcılar yeni şemaya geçti + en eski desteklenen app sürümü dual-read'i bıraktıktan sonra
(ör. 2-3 sürüm / 60-90 gün). Temizlik ayrı planlı iş, Phase 9 (`29`).

## 18. Veri kaybı önleme kriterleri
- "Önce kopyala, doğrula, en son temizle" (`08`).
- Dry-run + rastgele kullanıcı doğrulama + metrik eşleşmesi (eski learnedCount == yeni learnedCount).
- Eski alan silme yalnızca %100 doğrulama + geri alınamaz onaydan sonra.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Somut TypeScript tipleri (domain vs DTO):** `34-firestore-types-rules-migration-spec.md` §2-4 — `LevelProgress`/`ProgressSummary` (domain, saf, `Timestamp` YOK) ve `UserDocV2`/`ProgressByLevelDoc`/`ProgressSummaryDoc` (data/DTO, `Timestamp`/`FieldValue` burada).
- **Legacy tipleri:** `34` §4 — `LegacyProgressDoc { currentLevel?, learnedWords?: Record<string, number[]>, lastWordIndex?, lastSync? }` (mevcut `firestore.rules → validProgress` ile uyumlu).
- **Repository sözleşmesi:** `35` §3 `ProgressRepository` (dual-read: yeni `progressByLevel` → boşsa legacy fallback).
- **Rules v2 + index:** `34` §7-8 (`progressByLevel` sahiplik/tip doğrulaması; tekil doc erişimi → özel index gerekmez).
- **Bağlayıcı karar netleştirmesi:** Kelimeler local kalır; her kelime için doc açılmaz; ana doc küçük kalır; `learnedWords`→`progressByLevel`; `wordProgress` yalnızca SRS gelirse; copy→verify→cleanup; eski alan hemen silinmez; dual-read; dual-write sınırlı/geçici. (Tam liste `32` §8 + `34` §1.)
