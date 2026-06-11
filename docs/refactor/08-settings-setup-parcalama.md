# 08 — Settings ve Setup Ekranlarının Parçalanması

## Mevcut Durum

- **`screens/SettingsScreen.tsx` (2310 satır):** 26 `useState`, 8 `useEffect`, doğrudan Firestore
  (`doc/setDoc`) yazımı. İçeriği: profil görünümü, dil seçimi (native/target), bildirim ayarları
  (saat/frekans/autoMark), tema/görünüm, abonelik/premium durumu, hesap (çıkış/silme), hakkında/links.
- **`screens/SetupScreens.tsx` (1240 satır):** 13 `useState`, 7 `useEffect`, doğrudan Firestore yazımı.
  Çok adımlı ilk kurulum: dil seçimi, seviye/level test girişi, bildirim izni/tercihleri, `setupCompleted`.
- Her ikisi de kendi `scale`/`moderateScale` kopyasını içerir (bkz. `04`).

## Sorunlar

1. İki en büyük 1. ve 4. dosya; tek ekranda çok bağımsız bölüm iç içe.
2. **Katman ihlali:** ekrandan doğrudan Firestore yazımı (sync sözleşmesini baypas; bkz. `05`).
3. Aynı ayar mantığı (bildirim/dil) hem Setup hem Settings'te tekrar ediyor.
4. Test edilemez: `jest.config.js` ikisini de coverage'tan hariç tutuyor.

## Önerilen Yaklaşım: Bölüm-bazlı alt bileşenler + paylaşılan ayar hook'ları

Her mantıksal bölümü kendi bileşenine ayır; ortak ayar mantığını (dil, bildirim) Setup ve Settings'in
paylaştığı hook'lara koy. Firestore yazımı feature service üzerinden `shared/firebase/userDoc.ts`'e gider.

```
features/settings/
  screens/SettingsScreen.tsx          # sadece bölümleri dizen kompozisyon + ScrollView
  components/
    ProfileSection.tsx
    LanguageSection.tsx
    NotificationSection.tsx
    AppearanceSection.tsx
    SubscriptionSection.tsx           # monetization feature'ından veri alır (bkz. 12)
    AccountSection.tsx                # signOut + hesap silme (auth feature; bkz. 05)
    AboutSection.tsx
  hooks/{useSettingsActions,useLanguageSettings,useAppearanceSettings}.ts
  services/settingsRepository.ts      # userDoc üzerinden okuma/yazma (doğrudan setDoc YOK)
features/setup/
  screens/SetupScreen.tsx             # adım makinesi (step state) + ilerleme çubuğu
  steps/{LanguageStep,LevelStep,NotificationStep,SummaryStep}.tsx
  hooks/useSetupFlow.ts               # adım geçişleri + setupCompleted yazımı
shared/settings/ (ortak)
  useNotificationSettings.ts          # Setup ve Settings aynı hook'u kullanır
  useLanguagePreferences.ts           # @native_language / @target_language
```

**Paylaşılan hook prensibi:** Bildirim ve dil ayarı mantığı tek yerde (`shared/settings/`), hem
ilk kurulum hem ayarlar ekranı aynı kaynağı tüketir → tekrar biter, davranış tutarlı olur.

## Alternatifler ve Neden Elendiler

- **Form kütüphanesi (Formik/React Hook Form) ekle** — Elendi: mevcut state basit; yeni bağımlılık gereksiz.
- **Settings'i tek dev bileşen olarak bırak, sadece Firestore'u service'e al** — Kısmen; ama 2310 satır
  okunamazlık sorununu çözmez; bölümlere ayırma şart.
- **Setup'ı ayrı navigator (çoklu route) yap** — Elendi (şimdilik): mevcut tek-ekran adım makinesi davranışı
  korunmalı; route ekleme initial-route mantığını (bkz. `03`) etkiler. İleride düşünülebilir.

## Migration / Implementasyon Adımları

1. **PR-1:** `scale/moderateScale` -> `shared/hooks/useResponsive` (bkz. `04` PR-1; ortak adım).
2. **PR-2 (Firestore kapatma):** `SettingsScreen` ve `SetupScreens` içindeki doğrudan `setDoc` çağrılarını
   `settingsRepository`/`setup` service'ine taşı; bunlar `shared/firebase/userDoc.ts` kullanır. Yazılan
   alanlar **birebir** aynı (rules uyumu; bkz. `13`).
   - Komut: `npm run typecheck && npm run test:ci && npm run test:rules`
3. **PR-3:** `SettingsScreen` bölümlerini saf bileşenlere çıkar (her PR'da 1-2 bölüm). State önce ekranda
   kalır, props ile geçilir.
4. **PR-4:** Ortak `useNotificationSettings` / `useLanguagePreferences` hook'larını çıkar; Settings tüketir.
5. **PR-5:** `SetupScreens` -> `SetupScreen` + `steps/*` + `useSetupFlow`; Setup aynı ortak hook'ları tüketir.
6. **PR-6:** Kalan bölümleri (Subscription/Account) ilgili feature facade'larına bağla.

Her PR sonunda: `npm run typecheck && npm run test:ci`.

## Riskler

- **Firestore yazımı service'e taşınırken alan/zamanlama değişirse** kullanıcı ayarı kaybolur veya rules reddi.
  Azaltım: `userDoc` tek kapı; `test:rules` her PR'da; yazılan alanlar diff'te gözden geçirilir.
- **Setup adım sırası/`setupCompleted` bayrağı** kırılırsa yeni kullanıcı akışı bozulur (initial-route; bkz. `03`).
  Azaltım: akış testi; bayrak yazım zamanlaması korunur.
- **Ortak hook'a geçiş** Setup ve Settings davranışını farklılaştırabilir. Azaltım: önce iki ekrandaki
  mantığın aynı olduğu doğrulanır; değilse hook paramıyla fark korunur.

## Test ve Kabul Kriterleri

- Bölüm bileşenleri coverage'a dahil edilir (hariç listeden çıkarılır).
- `settingsRepository` ve `useSetupFlow` birim testleri.
- `test:rules` yeşil: Settings/Setup yazımları rules'tan geçer.
- `npm run typecheck`, `npm run test:ci` yeşil.

## Etkilenecek Dosyalar

```
screens/SettingsScreen.tsx  -> src/features/settings/screens/SettingsScreen.tsx
                            -> src/features/settings/components/{Profile,Language,Notification,Appearance,Subscription,Account,About}Section.tsx
                            -> src/features/settings/{hooks,services}/*
screens/SetupScreens.tsx    -> src/features/setup/screens/SetupScreen.tsx
                            -> src/features/setup/steps/{Language,Level,Notification,Summary}Step.tsx
                            -> src/features/setup/hooks/useSetupFlow.ts
(yeni ortak)                -> src/shared/settings/{useNotificationSettings,useLanguagePreferences}.ts
(Firestore yazımı)          -> src/shared/firebase/userDoc.ts (bkz. 05)
```
