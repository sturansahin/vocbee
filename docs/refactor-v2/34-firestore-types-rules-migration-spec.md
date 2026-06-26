# 34 — Firestore Types / Rules / Migration Spec

> Bu bir **implementation-spec**tir. Tüm kod blokları **örnek/contract/skeleton**dır; gerçek implementasyon değildir.
> Bu görevde `firestore.rules`, Firestore verisi ve hiçbir migration script'i DEĞİŞTİRİLMEMİŞ / ÇALIŞTIRILMAMIŞTIR.
> Bu dosya `07` (veri modeli) ve `08` (migration stratejisi) planlarının tip/kod seviyesine indirgenmiş halidir.

## 1. Tasarım kararları (binding — `07` §4-5, `08`)
1. 5500+ kelime **local** kalır (`assets/vocabulary/*.txt`); Firestore'a sözlük taşınmaz.
2. Her kelime için Firestore doc açılmaz (550K+ doc anti-pattern).
3. Ana `users/{uid}` doc **küçük** kalır.
4. Büyüyen `progress.learnedWords[level]` → `users/{uid}/progressByLevel/{level}` subcollection'a taşınır.
5. `wordProgress` yalnızca SRS özelliği gelirse açılır (şimdi AÇILMAZ).
6. Migration sırası: **copy → verify → cleanup** (cleanup Phase 9).
7. Eski `progress.learnedWords`/`favorites` hemen silinmez; **dual-read** yapılır.
8. **Dual-write** gerekiyorsa sınırlı/geçici, `schemaVersion` gating ile.

## 2. Domain modelleri (saf TS — `domain/`, SDK YOK)
Domain katmanında Firestore `Timestamp` **kullanılmaz**; tarih `string (ISO) | number (epoch)` taşınır, dönüşüm adapter'da yapılır.
*Skeleton/contract — implementasyon değil.*

```ts
// features/progress/domain/types.ts — SKELETON (saf TS, no SDK)
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';   // gerçek: services/vocabularyService.ts
export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

// Tek seviyenin domain modeli (UI ve use-case bunu görür)
export type LevelProgress = {
  level: Level;
  learnedWordIds: number[];
  lastWordIndex: number;
  learnedCount: number;
  favoriteWordIds?: number[];
};

// Ana doc'taki özet (profil okumaları ucuzlasın diye)
export type ProgressSummary = {
  byLevel: Partial<Record<Level, { learnedCount: number; totalCount: number; percent: number }>>;
  overallPercent: number;
};
```

## 3. Firestore DTO tipleri (data/dto.ts — Firestore şekli)
DTO'lar Firestore'a yazılan/okunan **ham** şekildir. Burada `Timestamp` ve `FieldValue` (serverTimestamp) görünebilir.
*Skeleton/contract — implementasyon değil.*

```ts
// features/progress/data/dto.ts — SKELETON
import type { Timestamp, FieldValue } from 'firebase/firestore';  // SADECE data katmanında

// users/{uid} ana doc (v2). Mevcut firestore.rules validUserDocument ile uyumlu kalmalı + schemaVersion eklenir.
export type UserDocV2 = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  createdAt?: Timestamp | FieldValue;
  lastActiveAt?: Timestamp | FieldValue;        // 07 §3 (yeni; rules'a eklenmeli)
  setupCompleted?: boolean;
  preferences?: { nativeLanguage: string; targetLanguage: string; level: string };
  notificationSettings?: NotificationSettingsDoc;   // değişmeden taşınır
  streak?: StreakDoc;                                // küçük; ana doc'ta kalır
  progressSummary?: ProgressSummaryDoc;              // 07 §3 (yeni)
  syncMeta?: { version?: number; updatedAt?: Timestamp | FieldValue; updatedByDeviceId?: string };
  lastActiveDeviceId?: string;
  schemaVersion?: 2;                                 // 07/08; rules hasOnly listesine eklenmeli
  // GEÇİŞ DÖNEMİ: eski 'progress' alanı dual-read/write için bir süre KORUNUR (silinmez)
  progress?: LegacyProgressDoc | null;
  favorites?: Array<{ id: number; level: Level }>;   // mevcut; max 1000 (rules)
};

// users/{uid}/progressByLevel/{level}  (level doc id = 'A1'..'C1')
export type ProgressByLevelDoc = {
  level: Level;
  learnedWordIds: number[];
  favoriteWordIds?: number[];
  wrongWordIds?: number[];                 // OPSIYONEL — SRS gelirse
  lastWordIndex: number;
  learnedCount: number;
  updatedAt: Timestamp | FieldValue;
  updatedByDeviceId?: string;
  version?: number;
};

export type ProgressSummaryDoc = {
  byLevel: Partial<Record<Level, { learnedCount: number; totalCount: number; percent: number }>>;
  overallPercent: number;
};

// notificationSettings/streak DTO'ları mevcut firestore.rules ile birebir (services/notificationService.ts, streakService.ts)
export type NotificationSettingsDoc = {
  enabled: boolean; startHour: number; startMinute: number;
  endHour: number; endMinute: number; frequencyMinutes: number; autoMarkLearned: boolean;
};
export type StreakDoc = {
  currentStreak: number; longestStreak: number; brokenStreak: number | null;
  lastQualifiedDay: string | null; lastQualifiedAt: string | null;
};

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
```

## 4. Legacy model tipleri (mevcut Firestore şekli)
Mevcut `users/{uid}.progress` alanı (kaynak: `firestore.rules → validProgress`, `services/SyncService.ts`,
`progressService.restoreProgressFromFirebase`).
*Skeleton/contract — implementasyon değil.*

```ts
// features/progress/data/dto.ts — LEGACY SKELETON
export type LegacyProgressDoc = {
  currentLevel?: string;                        // 'A1'..'C1'
  learnedWords?: Record<string, number[]>;      // { A1: [1,2,3], A2: [...] }  ← büyüyen alan
  lastWordIndex?: number;
  lastSync?: unknown;                            // Timestamp | string (tutarsız — 07 §2)
};

// AsyncStorage tarafındaki legacy (services/storage.ts UserProgress + progressService.UserProgress)
export type LegacyLocalUserProgress = {
  currentLevel: string;
  learnedWords: { [level: string]: number[] };  // progressService PROGRESS_KEY ile aynı şekil
  lastUpdated: string;
};
```

## 5. Legacy → V2 adapter iskeletleri (data/adapters)
Adapter'lar **data** katmanındadır; domain modeli Firestore DTO'ya bağımlı değildir (`35` §adapter kuralı).
*Skeleton/contract — implementasyon değil.*

```ts
// features/progress/data/adapters/progressAdapters.ts — SKELETON
import { serverTimestamp } from 'firebase/firestore';

// Legacy users/{uid}.progress.learnedWords → progressByLevel doc listesi
export function adaptLegacyLearnedWordsToProgressByLevelDocs(
  legacy: LegacyProgressDoc,
  deviceId?: string
): ProgressByLevelDoc[] {
  // skeleton only — gerçek mantık Phase 3'te yazılır
  // 1. legacy.learnedWords yoksa [] döndür
  // 2. her level için: id'leri dedupe + number filtrele + sırala
  // 3. lastWordIndex'i uygun level doc'una koy (legacy tek lastWordIndex → currentLevel'e)
  // 4. learnedCount = learnedWordIds.length
  // 5. updatedAt = serverTimestamp(), updatedByDeviceId = deviceId
  return [];
}

// Domain ↔ DTO (35 §adapter ile aynı sözleşme)
export function toProgressByLevelDoc(model: LevelProgress, deviceId?: string): ProgressByLevelDoc {
  // skeleton only
  return {} as ProgressByLevelDoc;
}
export function fromProgressByLevelDoc(doc: ProgressByLevelDoc): LevelProgress {
  // skeleton only
  return {} as LevelProgress;
}

// progressByLevel doc'larından ana doc progressSummary üretimi (totalCount LOCAL vocabulary'den gelir)
export function buildProgressSummary(
  docs: ProgressByLevelDoc[],
  totalCountByLevel: Partial<Record<Level, number>>
): ProgressSummaryDoc {
  // skeleton only
  return { byLevel: {}, overallPercent: 0 };
}
```

## 6. Migration dry-run script iskeleti (backend/admin — ÇALIŞTIRILMAZ)
Script mobil bundle'a girmez; `functions/` veya ayrı bir admin script olarak service-account ile sunucuda çalışır (`09`).
Bu doküman yalnızca **iskelet** tanımlar; gerçek script Phase 3'te yazılır ve **önce `--dry-run`** ile koşulur.
*Skeleton/contract — implementasyon değil; çalıştırılmaz.*

```ts
// scripts/migrateProgressByLevel.ts — DRY-RUN SKELETON (admin SDK, sunucuda)
// KULLANIM (PLAN): DRY_RUN=1 node migrateProgressByLevel.js   → hiçbir yazma yapmaz, rapor üretir
const DRY_RUN = process.env.DRY_RUN !== '0';   // varsayılan: güvenli (dry-run)

async function main(): Promise<void> {
  // 1) Backup ön-koşulu: gcloud firestore export tamamlanmadan ÇALIŞTIRMA (08 §1)
  let scanned = 0, planned = 0, mismatched = 0, skipped = 0;

  // 2) users koleksiyonunu sayfa sayfa tara (batch + checkpoint/resume — idempotent)
  //    for await (const userSnap of iterateUsers()) {
  //      scanned++;
  //      const legacy = userSnap.get('progress');                 // LegacyProgressDoc
  //      if (!legacy?.learnedWords) { skipped++; continue; }
  //      const docs = adaptLegacyLearnedWordsToProgressByLevelDocs(legacy);
  //      const oldTotal = sumLearned(legacy.learnedWords);
  //      const newTotal = docs.reduce((n, d) => n + d.learnedWordIds.length, 0);
  //      const ok = oldTotal === newTotal;                         // verify (08 §7)
  //      if (!ok) mismatched++;
  //      planned += docs.length;
  //      report(maskUid(userSnap.id), legacy, docs, ok);           // PII maskeli log
  //      if (!DRY_RUN && ok) {
  //        // 3) GERÇEK migration: subcollection'a YAZ, ESKİ alanı SİLME (copy-only)
  //        // await writeProgressByLevel(userSnap.ref, docs);
  //        // await userSnap.ref.set({ schemaVersion: 2 }, { merge: true });
  //      }
  //    }

  // 4) Özet rapor: scanned/planned/mismatched/skipped — mismatched>0 ise DURDUR
  console.log(JSON.stringify({ mode: DRY_RUN ? 'DRY_RUN' : 'WRITE', scanned, planned, mismatched, skipped }));
}

function maskUid(uid: string): string {                 // PII koruması (08 §PII)
  return uid.length <= 6 ? '***' : `${uid.slice(0, 4)}…${uid.slice(-2)}`;
}
```

Dry-run çıktısı satır formatı (PII'siz, `08` §dry-run):
```text
uidMask=ab12…cd, A1: 312→312, A2: 90→90, status=OK
SUMMARY mode=DRY_RUN scanned=124 planned=420 mismatched=0 skipped=7
```
**Kural:** `mismatched > 0` ise migration durdurulur, incelenir; cleanup (eski alan silme) Phase 9 öncesi ASLA çalıştırılmaz.

## 7. Security rules skeleton (v2 — UYGULANMAZ, plan)
Mevcut `firestore.rules` katı `validUserDocument` `hasOnly` kullanır. v2'de:
(a) ana doc `hasOnly` listesine `schemaVersion`, `lastActiveAt`, `progressSummary` eklenir;
(b) `progressByLevel` subcollection kuralı eklenir; (c) catch-all `false` korunur.
*Skeleton/contract — implementasyon değil; `firestore.rules` bu görevde değiştirilmedi.*

```js
// firestore.rules (v2 PLAN parçası) — mevcut helper'lar (signedIn/isOwner/has) korunur
function validLevelId(level) {
  return level in ['A1', 'A2', 'B1', 'B2', 'C1'];
}

function validProgressByLevel(data) {
  return data.keys().hasOnly([
           'level','learnedWordIds','favoriteWordIds','wrongWordIds',
           'lastWordIndex','learnedCount','updatedAt','updatedByDeviceId','version'
         ])
      && data.level is string && validLevelId(data.level)
      && data.learnedWordIds is list
      && data.lastWordIndex is int && data.lastWordIndex >= 0
      && data.learnedCount is int && data.learnedCount >= 0
      && (!has(data, 'favoriteWordIds') || data.favoriteWordIds is list)
      && (!has(data, 'updatedAt') || data.updatedAt is timestamp)
      && optionalString(data, 'updatedByDeviceId', 120)
      && (!has(data, 'version') || (data.version is int && data.version >= 1));
}

match /users/{userId} {
  // ... mevcut validUserDocument kuralları + schemaVersion/lastActiveAt/progressSummary genişletmesi ...

  match /progressByLevel/{level} {
    allow read: if isOwner(userId);
    allow create, update: if isOwner(userId)
                          && validLevelId(level)
                          && request.resource.data.level == level
                          && validProgressByLevel(request.resource.data);
    allow delete: if isOwner(userId);          // cleanup/reset için
  }
}

// match /{document=**} { allow read, write: if false; }   // KORUNUR
```

### Rules doğrulama önerileri (binding)
- `learnedWordIds` **list** olmalı (boş liste kabul). İçerik tipi rules'ta zorlanamaz → adapter/repository number filtreler.
- `lastWordIndex` **int >= 0** olmalı.
- `learnedCount` **int >= 0** olmalı (adapter `learnedWordIds.length` ile tutar).
- Kullanıcı yalnızca kendi `users/{userId}/progressByLevel/**` path'ine yazar (`isOwner`).
- `schemaVersion` ana doc'ta gating için izlenir; rules `hasOnly` listesine eklenmeden client yazarsa create/update reddedilir
  (bu yüzden rules genişletmesi dual-write açılmadan ÖNCE deploy edilmeli — `08`/`23` sırası).

## 8. Index gereksinimleri
- `progressByLevel/{level}` ve `favorites/{wordId}` (açılırsa) **tekil doc erişimi** (id ile) → özel index gerekmez.
- `wordProgress` (açılırsa) `nextReviewAt` sıralaması → tek-alan index (otomatik).
- `sessions` (açılırsa) `startedAt desc` → tek-alan index.
- Mevcut repoda `firestore.indexes.json` **yok** (`00`/`09`). v2'de yalnızca `sessions`/`wordProgress` gelirse eklenir;
  `progressByLevel` için **gerekmez**.

## 9. Dual-read / dual-write akışı (repository seviyesi — `35`)
```text
READ (getProgressByLevel):
  1. users/{uid}/progressByLevel/{level} oku → varsa fromProgressByLevelDoc → döndür
  2. yoksa users/{uid}.progress.learnedWords[level] (legacy) → adapt → döndür (fallback)

WRITE (saveProgressByLevel) — dual-write penceresi:
  1. progressByLevel/{level} yaz (yeni model, ana kaynak)
  2. (pencere açıkken) users/{uid}.progress.learnedWords[level] de güncelle (eski app uyumu)
  3. ana doc progressSummary + schemaVersion=2 güncelle
  pencere kapanınca: yalnızca adım 1 + 3.
```

## 10. Kabul kriterleri
- v2 tipleri (`domain` saf, `data` DTO) ayrıştırılmış; domain'de `Timestamp` yok.
- Legacy→V2 adapter test edilebilir saf fonksiyon (`37` migration edge-case listesi).
- Dry-run iskeleti `mismatched>0` → durdurma kuralını içerir; eski alan silme yok.
- Rules v2 skeleton'ı `progressByLevel` sahiplik + tip doğrulaması içerir; emulator testi (`37`/`tests/firestoreRules.ts` deseni).

## İlgili dokümanlar
`07` (veri modeli), `08` (migration), `09` (rules/secret), `23` (Phase 3), `35` (repository/adapter), `37` (test).
