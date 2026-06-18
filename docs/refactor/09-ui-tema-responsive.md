# 09 — UI Component Sistemi, Tema, Responsive ve Dark Mode

## Mevcut Durum

- **`components/UIComponents.tsx`:** paylaşılan UI bileşenleri (test edilmiş: `components/__tests__/UIComponents.test.tsx`).
- **`context/ThemeContext.tsx` (32 satır):** dark mode SADECE sistem `useColorScheme`'e bağlı (manuel
  override yok). Renkler `constants.ts`'teki `DARK_COLORS` / `LIGHT_COLORS`'tan gelir.
- **`constants.ts`:** `DARK_COLORS`, `LIGHT_COLORS`, `LANGUAGES` (21), `LEVELS`, TTS dil haritası.
- **Responsive:** `scale`/`moderateScale` `BASE_WIDTH` tabanlı; HomeScreen/SettingsScreen/SetupScreens/
  ExampleSentencesScreen içinde **kopyalanmış**.
- **NativeWind ^2.0.11** (+ tailwindcss ^3.3.2) bağımlılık olarak var; tsconfig `nativewind` tiplerini içerir.
  Ancak kaynak kodda aktif `className`/utility kullanımı, `tailwind.config.*` veya `nativewind-env.d.ts`
  bulunmuyor.

## Sorunlar

1. **Tema token'ları dağınık:** renk `constants.ts`'te, spacing/typography ekranlara gömülü; tek tasarım
   sistemi yok.
2. **Responsive kopya kod** (4 ekran) — tutarsızlık ve bakım yükü.
3. **Dark mode manuel seçim yok** (sadece sistem); kullanıcı talebi gelirse yapı hazır değil.
4. **NativeWind bağımlılığı atıl/yarım yapılandırılmış görünüyor.** İkili stil sistemi fiilen yok;
   asıl risk kullanılmayan bağımlılık ve eksik config'in kafa karıştırması.

## Önerilen Yaklaşım: `shared/ui` design-system + `shared/theme` token'ları

```
shared/theme/
  ThemeContext.tsx         # mevcut; ileride manuel override eklenebilir (şimdilik davranış aynı)
  colors.ts                # DARK_COLORS / LIGHT_COLORS (constants.ts'ten taşınır)
  spacing.ts, typography.ts # ekranlardaki sabitler buraya toplanır (kademeli)
  useTheme.ts              # renkler + token erişimi
shared/ui/
  Button.tsx, Input.tsx, Card.tsx, Header.tsx, Chip.tsx, ...   # UIComponents.tsx'ten bölünür
  index.ts                 # design-system facade
shared/hooks/
  useResponsive.ts         # scale/moderateScale TEK kaynak (bkz. 04)
```

**Dark mode:** Mevcut sistem-tabanlı davranış **korunur**. Manuel override istenirse, `ThemeContext`'e
`mode: 'system'|'light'|'dark'` eklenir; varsayılan `'system'` (mevcut davranış). Bu ayrı ve opsiyonel
bir özellik; refactor onu zorlamaz.

**NativeWind kararı:** Mevcut kod StyleSheet + tema token'ları yönünde standardize edilir. NativeWind
aktif kullanılmadığı için refactor sırasında yeni `className` kullanımı eklenmez. Ayrı bir cleanup PR'ında
NativeWind ya doğru config ile sahiplenilir ya da bağımlılık olarak kaldırılır; bu karar native build etkisi
kontrol edilerek verilir.

## Alternatifler ve Neden Elendiler

- **Yeni UI kit (Tamagui, gluestack, RN Paper)** — Elendi: büyük bağımlılık + görsel regresyon riski;
  mevcut `UIComponents` zaten test edilmiş.
- **NativeWind'i tamamen benimse (her şey utility class)** — Elendi (şimdilik): geniş rewrite; v2→v4
  geçişi ayrı risk. Karar ertelenir.
- **NativeWind'i hemen kaldır** — Elendi (şimdilik): bağımlılık/build etkisi ayrı doğrulanmalı; refactor
  davranış değiştirmemeli.
- **Tema'yı `constants.ts`'te bırak** — Elendi: tasarım token'ları dil/seviye sabitleriyle aynı dosyada
  karışık; ayırmak netlik sağlar.

## Migration / Implementasyon Adımları

1. **PR-1:** `useResponsive` ortak hook (bkz. `04` PR-1).
2. **PR-2:** `DARK_COLORS`/`LIGHT_COLORS` -> `shared/theme/colors.ts`; `constants.ts`'te re-export shim.
   `ThemeContext` yeni yoldan okur. Davranış aynı.
3. **PR-3:** `UIComponents.tsx`'i `shared/ui/*` bileşenlerine böl; `index.ts` facade eski isimleri ihraç eder.
   Mevcut `UIComponents.test.tsx` import yolu güncellenir, testler yeşil kalır.
4. **PR-4 (opsiyonel):** `spacing.ts`/`typography.ts` token'larını ekranlardan kademeli topla.
5. **PR-5 (opsiyonel, talep üzerine):** `ThemeContext`'e manuel `mode` override ekle (varsayılan `system`).

Her PR sonunda: `npm run typecheck && npm run test:ci`.

## Riskler

- **Renk/Token taşıma görsel regresyon** yaratabilir. Azaltım: değerler birebir taşınır; shim ile
  eski importlar çalışır; snapshot/manuel kontrol.
- **UIComponents bölünürken prop API değişirse** tüm ekranlar etkilenir. Azaltım: facade aynı isim/prop'ları korur.
- **NativeWind config/bağımlılık kararı** native build'i etkileyebilir. Azaltım: bu refactorda yeni
  NativeWind kullanımı eklenmez; kaldırma/sahiplenme ayrı PR.

## Test ve Kabul Kriterleri

- `components/__tests__/UIComponents.test.tsx` (yeni yolla) yeşil.
- `useResponsive` birim testi: çeşitli ekran genişliklerinde `scale` çıktısı eski kopyalarla aynı.
- Dark/light render snapshot'ları (en az Button/Header) yeşil.
- `npm run typecheck`, `npm run test:ci` yeşil.

## Etkilenecek Dosyalar

```
components/UIComponents.tsx     -> src/shared/ui/* (+ index.ts facade)
context/ThemeContext.tsx        -> src/shared/theme/ThemeContext.tsx (+ useTheme.ts)
constants.ts (DARK/LIGHT_COLORS)-> src/shared/theme/colors.ts (+ shim)
(4 ekrandaki scale/moderateScale)-> src/shared/hooks/useResponsive.ts
components/__tests__/UIComponents.test.tsx -> import yolu güncellenir
```
