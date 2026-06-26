# 33 — Layer Contracts & Import Rules (Katman Sözleşmeleri ve Import Kuralları)

> Bu bir **implementation-spec**tir. Tüm kod blokları **örnek/skeleton**dır, gerçek implementasyon değildir.
> Kaynak kod bu görevde değiştirilmemiştir. Bu doküman `02` ve `05`'in import yönü kurallarını **uygulanabilir kurala** çevirir.

## 1. Katmanlar ve sorumlulukları
Hedef feature içi yapı (`05`): `presentation / application / domain / data` + `index.ts`. Çapraz altyapı `shared`.

| Katman | Sorumluluk | İçinde olur | İçinde OLMAZ |
|---|---|---|---|
| **presentation** | UI: screen, component, hook (state binding) | React, RN, `shared/ui`, feature hook'ları | Firebase, AsyncStorage, Expo SDK, `fetch`, `data/*` doğrudan |
| **application** | use-case orkestrasyonu, facade | domain çağrısı, repository **interface** | doğrudan SDK çağrısı, UI, JSX |
| **domain** | saf iş kuralları + tip + sabit | yalnızca saf TypeScript | Firebase, AsyncStorage, Expo, React, `fetch`, `Timestamp` |
| **data** | repository/adapter/dto; dış dünya | Firebase, Firestore, AsyncStorage, API, asset, Expo SDK | UI iş kuralı, use-case mantığı |
| **shared** | çapraz altyapı (ui/theme/storage/firebase/i18n/utils/errors/types) | genel yardımcılar | **feature-specific iş mantığı** |

## 2. Import matrisi (bağlayıcı)
*Skeleton/contract — implementasyon değil.*

```text
                 │ app │ feat.presentation │ feat.application │ feat.domain │ feat.data │ shared │
─────────────────┼─────┼───────────────────┼──────────────────┼─────────────┼───────────┼────────┤
app              │  —  │  ✓ (barrel)        │  ✓ (barrel)      │   ✗         │   ✗       │   ✓    │
presentation     │  ✗  │   ✓ (aynı feature) │   ✓              │   ✓ (tip)   │   ✗       │   ✓*   │
application      │  ✗  │   ✗                │   ✓              │   ✓         │ ✓(iface)  │   ✓    │
domain           │  ✗  │   ✗                │   ✗              │   ✓         │   ✗       │   ✗**  │
data             │  ✗  │   ✗                │   ✗              │   ✓         │   ✓       │   ✓    │
shared           │  ✗  │   ✗                │   ✗              │   ✗         │   ✗       │   ✓    │

✓*  presentation → shared: yalnızca shared/ui, shared/theme, shared/i18n (SDK sarmalayan shared/firebase|storage HAYIR)
✓** domain → shared: KURAL DIŞI tutulur; domain saf kalmalı. Gerekirse shared/types (saf tip) tartışılır, SDK'lı shared YASAK.
✓(iface) application → data: yalnızca repository INTERFACE'i (domain'de veya data/contracts'ta tanımlı), implementasyon değil.
feature ↔ feature: yalnızca @features/<x> barrel (index.ts). Derin import (@features/x/data/...) YASAK.
```

## 3. Doğru / yanlış import örnekleri (projeye özgü)
Aşağıdaki örnekler gerçek dosyalara dayanır: `screens/HomeScreen.tsx`, `services/progressService.ts`,
`services/favoritesService.ts` (şu an `firebase/firestore`'u doğrudan import ediyor), `config/firebase.ts`.

### presentation katmanı
*Skeleton/contract — implementasyon değil.*

```ts
// ❌ KÖTÜ — presentation doğrudan SDK'ya bağlanıyor (mevcut favoritesService deseninin ekrana sızması)
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/firebase';

// ✅ İYİ — presentation yalnızca feature barrel + application/hook çağırır
import { useLesson } from '@features/learning';          // hook (presentation→application)
import { Word } from '@features/vocabulary';             // domain tipi (saf)
import { Button } from '@shared/ui';
```

### application katmanı
*Skeleton/contract — implementasyon değil.*

```ts
// ❌ KÖTÜ — application doğrudan Firestore çağırıyor (SyncService.syncToFirestore deseni)
import { doc, setDoc } from 'firebase/firestore';

// ✅ İYİ — application repository interface'ine bağımlı (DIP)
import type { ProgressRepository } from '@features/progress';   // interface (data değil)
import { calcLevelPercent } from '@features/progress';          // domain kuralı

export function makeCompleteWord(progressRepo: ProgressRepository) {
  return async function completeWord(userId: string, level: Level, wordId: number): Promise<void> {
    // orchestration: domain kuralı + repository çağrısı (SDK YOK)
  };
}
```

### domain katmanı
*Skeleton/contract — implementasyon değil.*

```ts
// ❌ KÖTÜ — domain'de SDK / Timestamp / AsyncStorage
import { Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ İYİ — domain saf TS; yalnızca kendi tip/sabitleri
import type { Level } from './types';
export function calcLevelPercent(learnedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((learnedCount / totalCount) * 100);   // progressService.getLevelProgress kuralının saf hali
}
```

### data katmanı
*Skeleton/contract — implementasyon değil.*

```ts
// ✅ İYİ — data SDK'yı kullanır, domain modeline çevirir (adapter), interface'i implemente eder
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@shared/firebase';
import type { ProgressRepository } from '@features/progress';   // interface
import { fromProgressByLevelDoc, toProgressByLevelDoc } from '../adapters/progressAdapters';
```

## 4. `index.ts` barrel sözleşmesi
Her feature dışarıya yalnızca `index.ts`'ten verir: domain tipleri/kuralları, application facade/use-case factory'leri,
presentation hook/screen'leri, repository **interface**'leri. `data` implementasyonları (Firestore repository sınıfı)
**barrel'dan ihraç edilmez** — yalnızca feature içi composition root (`application` veya `app/providers`) bağlar.

*Skeleton/contract — implementasyon değil.*

```ts
// features/progress/index.ts (barrel) — SKELETON
export type { Level, LevelProgress, ProgressSummary } from './domain/types';
export { calcLevelPercent, isLevelComplete } from './domain/rules';
export type { ProgressRepository } from './data/contracts';      // interface OK
export { useProgress } from './presentation/hooks/useProgress';
// NOT: FirestoreProgressRepository (implementasyon) BARREL'DA YOK.
```

## 5. ESLint ile import sınırını zorlama
Projede ESLint config **yok** (`01`/`16`). Eklenecek (plan, `38`'de tam config). Anahtar kurallar:
- `import/no-cycle` — barrel döngülerini engeller (R10).
- `import/no-restricted-paths` — katman yönünü zorlar.
- `no-restricted-imports` — `domain/**` içinde SDK paketlerini yasaklar.

*Skeleton/contract — implementasyon değil; tam dosya `38`'de.*

```jsonc
// .eslintrc.cjs (PLAN) — katman sınırı parçası
{
  "plugins": ["import"],
  "rules": {
    "import/no-cycle": ["error", { "maxDepth": 1 }],
    "import/no-restricted-paths": {
      "zones": [
        { "target": "src/features/*/domain", "from": "src/features/*/data",        "message": "domain → data YASAK" },
        { "target": "src/features/*/domain", "from": "src/features/*/application",  "message": "domain → application YASAK" },
        { "target": "src/features/*/domain", "from": "src/features/*/presentation", "message": "domain → presentation YASAK" },
        { "target": "src/features/*/presentation", "from": "src/features/*/data",   "message": "presentation → data YASAK (application kullan)" },
        { "target": "src/features",          "from": "src/app",                     "message": "feature → app YASAK" }
      ]
    }
  },
  "overrides": [
    {
      "files": ["src/features/*/domain/**/*.ts"],
      "rules": {
        "no-restricted-imports": ["error", {
          "patterns": [
            "firebase", "firebase/*", "@react-native-async-storage/*",
            "expo", "expo-*", "react", "react-native", "react-native-*"
          ]
        }]
      }
    }
  ]
}
```

> Geçiş döneminde derin import'ları yasaklamak yıkıcı olabilir; kuralları önce `warn`, shim temizliği (Phase 9) sonrası
> `error` yap. Kök `@/*` → `./*` aliası geçiş boyunca korunur, `@features/@shared/@app` eklenir (`38`).

## 6. Katman ihlali nasıl tespit edilir (manuel/CI)
- `grep` ile: `domain/` altında `from 'firebase` / `AsyncStorage` / `expo-` araması 0 sonuç vermeli.
- CI: `eslint .` adımı (`38`) kırmızıysa merge yok (`18` DoD).
- PR review: `33` import matrisi + `35` repository sözleşmesi PR şablonunda checkbox.

## 7. Kabul kriterleri
- `domain/**` içinde 0 SDK import (lint + grep yeşil).
- presentation `data/*` veya `firebase`/`AsyncStorage`/`expo-notifications` import etmiyor.
- feature'lar arası yalnızca barrel; `import/no-cycle` temiz.

## İlgili dokümanlar
`02` (hedef mimari), `05` (klasör), `06` (SOLID/DIP), `35` (repository interface), `36` (shim), `38` (ESLint/alias tam config).
