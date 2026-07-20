# VocBee UI/UX Production Düzenleme Planı

Durum: Uygulamaya hazır plan  
Öncelik: Production hardening  
Ana platform: iOS  
Son güncelleme: 2026-07-20

Tek-phase uygulama promptu: `docs/ui-ux-production-implementation-prompt.md`

## 1. Yönetici özeti

VocBee'nin feature/layer mimarisi production geliştirmeye uygun durumdadır. UI kodu feature
presentation katmanlarına ayrılmış, kritik ekranların bir kısmı component ve hook'lara bölünmüş,
import sınırları otomatik testlerle korunmuştur.

Eksik olan katman, bütün uygulamanın aynı görsel ve etkileşim sözleşmesini kullandığı gerçek bir
design system'dir. Mevcut durumda yeni ekran eklemek mümkündür; ancak renk, spacing, typography,
responsive davranış, modal, list row veya erişilebilirlik standardında global değişiklik yapmak
birçok feature dosyasına ayrı ayrı müdahale gerektirir.

Bu planın hedefi görsel redesign yapmak değil; mevcut ürün kimliğini ve davranışı koruyarak UI/UX
altyapısını:

- merkezi,
- ölçülebilir,
- responsive,
- erişilebilir,
- test edilebilir,
- aşamalı migrate edilebilir,
- production rollout'a uygun

hâle getirmektir.

## 2. Mevcut durum baseline'ı

2026-07-20 kaynak ağacı incelemesindeki başlangıç metrikleri:

| Gösterge | Baseline |
|---|---:|
| Feature production TSX dosyası | 57 |
| `@shared/ui` kullanan feature TSX dosyası | 6 |
| Doğrudan `TouchableOpacity` kullanımı | 88 |
| Doğrudan `Pressable` kullanımı | 12 |
| Açık `accessibilityRole` kullanımı | 19 |
| Açık `accessibilityLabel` kullanımı | 12 |
| Modül seviyesinde `Dimensions.get('window')` kullanan dosya | 17 |
| Ayrı ayrı `393` tabanlı scaling tanımlayan dosya | 14 |
| Production UI içindeki ham hex renk kullanımı | 84 |
| Production UI içindeki farklı ham hex renk | 34 |
| `HomeScreen.tsx` | 404 satır |
| `LevelTestScreen.tsx` | 418 satır |
| `StreakCelebrationOverlay.tsx` | 443 satır |
| `HomeWordCardSection.tsx` | 421 satır |
| `useSettingsScreenController.ts` | 359 satır |

Doğrulanan güçlü baseline:

- TypeScript app typecheck geçiyor.
- ESLint sıfır hata ile geçiyor.
- Mimari sınır testleri 6/6 geçiyor.
- Seçili UI/presentation testleri 30 suite / 127 test geçiyor.
- Feature'lar arası import yalnız public barrel üzerinden yapılıyor.
- Presentation katmanı data implementasyonu ve side-effect SDK'larından ayrılmış durumda.

## 3. Başarı tanımı

Program tamamlandığında:

1. Production ekranları ham React Native primitive yerine ortak UI primitive'lerini kullanır.
2. Görsel kararlar semantic token'lardan gelir.
3. Light/dark tema, safe area, küçük/büyük telefon, landscape ve büyük font davranışı tek
   sözleşmeyle yönetilir.
4. Icon-only bütün aksiyonların erişilebilir adı ve yeterli touch target'ı vardır.
5. Loading, empty, error, offline, disabled ve destructive state'ler aynı pattern'i kullanır.
6. Screen'ler orchestration + composition sınırında kalır; büyük controller/view dosyaları küçük,
   test edilebilir parçalara ayrılır.
7. DevTools gerçek ekranların yanında component ve state kataloğu sunar.
8. UI değişiklikleri unit/integration, accessibility ve görsel smoke gate'lerinden geçmeden
   production'a çıkamaz.
9. Geçiş sırasında mevcut navigation, auth, progress, notification, monetization ve storage
   davranışı değişmez.

## 4. Kapsam dışı işler

Bu program aşağıdakileri kendiliğinden yetkilendirmez:

- marka/logo değişikliği,
- yeni renk paleti seçimi,
- yeni monetization modeli,
- navigation bilgi mimarisini değiştirme,
- Firestore veri migration'ı,
- auth veya notification iş kurallarını değiştirme,
- yeni analytics/third-party UI SDK ekleme,
- ürün metinlerini baştan yazma.

Bu alanlardan biri gerekli olursa ayrı ürün kararı ve acceptance kriteri hazırlanır.

## 5. Değişmez ürün sözleşmeleri

- Route isimleri ve parametre contract'ları korunur.
- Kullanıcı verisi ve AsyncStorage key'leri değişmez.
- Existing facade/application contract'ları UI tarafından bypass edilmez.
- Free/premium görünürlük davranışı korunur.
- Notification permission yalnız mevcut kullanıcı aksiyonları üzerinden istenir.
- Destructive Settings aksiyonları confirmation olmadan çalışmaz.
- Tutorial ve swipe gesture sırası korunur.
- Dark/light temada içerik okunabilirliği korunur.
- Offline kullanılabilen akışlar yeni UI katmanı nedeniyle bloklanmaz.

## 6. Hedef UI klasör yapısı

```text
src/shared/
  theme/
    colors.ts
    semanticColors.ts
    spacing.ts
    radii.ts
    typography.ts
    shadows.ts
    motion.ts
    breakpoints.ts
    ThemeContext.tsx
    types.ts
    index.ts

  responsive/
    useResponsiveLayout.ts
    useReducedMotion.ts
    metrics.ts
    types.ts
    index.ts

  ui/
    primitives/
      AppText.tsx
      AppButton.tsx
      IconButton.tsx
      AppInput.tsx
      Surface.tsx
      Divider.tsx
      ProgressBar.tsx
      AppSwitch.tsx
    layout/
      Screen.tsx
      AppScrollView.tsx
      Stack.tsx
      Inline.tsx
      AppHeader.tsx
    feedback/
      AppModal.tsx
      AppAlert.tsx
      LoadingState.tsx
      EmptyState.tsx
      ErrorState.tsx
      OfflineState.tsx
      ToastRegion.tsx
    patterns/
      SectionCard.tsx
      SettingsRow.tsx
      SelectionRow.tsx
      FormField.tsx
      BottomActionBar.tsx
    index.ts
```

Feature'a özgü görsel bileşenler feature içinde kalır. Yalnız en az iki bağımsız feature tarafından
kullanılan veya bütün uygulama için davranış standardı taşıyan bileşen `shared/ui` içine alınır.

## 7. Design token sözleşmesi

### 7.1 Semantic renkler

UI, palette rengi yerine semantic rol ister:

```ts
interface SemanticColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  borderDefault: string;
  borderStrong: string;
  accent: string;
  accentPressed: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  onDanger: string;
  overlay: string;
  focusRing: string;
}
```

Kurallar:

- Feature UI içinde yeni ham hex değeri eklenmez.
- Beyaz/siyah varsayımı yerine `onAccent`, `textPrimary`, `overlay` gibi roller kullanılır.
- `COLORS = DARK_COLORS` compatibility alias'ı migration sonunda kaldırılır.
- Light/dark token setlerinin key'leri compile-time aynı interface'i karşılar.
- Transparan renk varyantları da token olarak tanımlanır.

### 7.2 Spacing ve radius

Önerilen spacing scale:

```text
0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

Önerilen radius rolleri:

```text
none, xs, sm, md, lg, xl, pill
```

Feature kodunda aynı anlama gelen `12`, `16`, `20`, `24` değerlerinin yeniden tanımlanması yerine
semantic token kullanılır.

### 7.3 Typography

Typography token'ı en az şunları içerir:

```text
display
screenTitle
sectionTitle
body
bodyStrong
caption
button
input
metric
```

Her rol:

- font family,
- font size,
- line height,
- weight,
- letter spacing

değerlerini birlikte tanımlar.

Kurallar:

- Text bileşenleri mümkün olduğunca `AppText` kullanır.
- Font scaling varsayılan olarak açıktır.
- Kritik layout taşması `numberOfLines` ile gizlenmeden önce responsive layout çözülür.
- Büyük fontta birincil aksiyonlar erişilebilir kalır.

### 7.4 Shadow, elevation ve motion

- Shadow token'ları iOS shadow ve Android elevation karşılığını birlikte taşır.
- Modal, card ve floating control aynı elevation scale'i kullanır.
- Motion duration/easing token'ları merkezi tanımlanır.
- Dekoratif animasyonlar reduced-motion açıkken kapanır veya statik varyanta geçer.
- İşlemin tamamlandığını anlatan fonksiyonel feedback tamamen kaldırılmaz.

## 8. Responsive layout standardı

### 8.1 Tek responsive hook

`useResponsiveLayout()` aşağıdaki çıktıyı sağlar:

```ts
interface ResponsiveLayout {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  sizeClass: 'compact' | 'regular' | 'wide';
  isSmallHeight: boolean;
  contentMaxWidth: number;
  horizontalGutter: number;
  moderateScale: (value: number) => number;
}
```

Kurallar:

- Modül seviyesinde `Dimensions.get()` kullanılmaz.
- Width/height kullanan animation ve gesture hesapları hook output değiştiğinde güncellenir.
- Scaling sınırsız doğrusal büyümez; alt ve üst limit uygulanır.
- Tablet'te içerik sonsuza kadar genişlemez; merkezi `contentMaxWidth` kullanılır.
- Orientation değişikliği ekranı yeniden başlatmadan doğru layout üretir.

### 8.2 Test cihaz matrisi

Her ana akış en az aşağıdaki layout sınıflarında doğrulanır:

| Sınıf | Amaç |
|---|---|
| Küçük telefon | iPhone SE boyutu, kısa yükseklik |
| Standart telefon | 390–393 pt genişlik |
| Büyük telefon | Pro Max sınıfı |
| Landscape | Klavye, header ve bottom action taşması |
| Tablet/wide | Max-width ve merkezi içerik |
| Büyük font | En az iki erişilebilir font büyütme seviyesi |
| Dark/light | Her iki semantic token seti |
| RTL | Yön, ikon ve metin hizası |

### 8.3 Safe area ve keyboard

- Screen-level safe area yalnız `Screen`/`AppScrollView` tarafından yönetilir.
- React Native deprecated `SafeAreaView` kullanılmaz.
- Bottom action alanları home indicator ve banner ad ile çakışmaz.
- Form ekranları keyboard açıkken primary action'a kaydırılabilir.
- Modal içeriği küçük yükseklikte scroll edilebilir.

## 9. Ortak component contract'ları

### 9.1 `AppButton`

Desteklenen varyantlar:

```text
primary, secondary, outline, ghost, destructive
```

Zorunlu davranışlar:

- minimum 44×44 pt touch target,
- loading state,
- disabled state,
- pressed state,
- icon-leading/icon-trailing,
- erişilebilir label/state,
- full-width ve intrinsic-width,
- async double-submit koruması için loading sırasında press bloklama.

### 9.2 `IconButton`

- `accessibilityLabel` zorunlu prop olur.
- Görsel ikon label yerine geçmez.
- Default touch target 44×44 pt olur.
- pressed, disabled ve focus görünümü vardır.
- Back, close, favorite, settings, speech ve delete aksiyonları bu primitive'e migrate edilir.

### 9.3 `AppInput` ve `FormField`

- Visible label desteklenir.
- Error/help text ilişkilendirilir.
- Password visibility control erişilebilir olur.
- Keyboard type, return key ve autofill contract'ları ekran tarafından verilir.
- Error mesajı yalnız renkle anlatılmaz.

### 9.4 `AppModal`

- Backdrop press davranışı açık prop olur.
- iOS dismissal ve Android back davranışı aynıdır.
- Focus/VoiceOver modal içinde kalır.
- Küçük ekranda scroll ve max-height çalışır.
- Birincil/destructive action sırası tutarlıdır.
- Modal başlık, açıklama ve action alanı aynı spacing contract'ını kullanır.

### 9.5 `SettingsRow` ve `SelectionRow`

- Label, description, icon, value, trailing action ve destructive varyantları vardır.
- Bütün row tek touch target olur.
- Disabled/selected state erişilebilir olarak yayınlanır.
- Chevron, radio ve check görselleri semantic state ile eşleşir.

### 9.6 Async state pattern'leri

Her veri ekranı aşağıdaki açık state modeline sahip olur:

```text
idle/loading → ready
idle/loading → error → retry
ready + empty
ready + offline/cached
ready + refreshing
```

Spinner, skeleton, empty ve error component'leri feature'ların kendi içinde tekrar oluşturulmaz.

## 10. Erişilebilirlik standardı

Production acceptance:

- Icon-only aksiyonların tamamında label bulunur.
- Button, switch, header, link ve selection control doğru role kullanır.
- Selected, checked, disabled, expanded ve busy durumları `accessibilityState` ile yayınlanır.
- Touch target minimum 44×44 pt olur.
- Renk tek bilgi taşıyıcısı değildir.
- Light ve dark temada kritik metin/aksiyon kontrastı kontrol edilir.
- Screen açılışında anlamlı heading sırası bulunur.
- Modal açılış/kapanışında screen reader context kaybolmaz.
- Swipe-only işlemlerin erişilebilir alternatif aksiyonu bulunur.
- Tutorial overlay screen reader ve reduced-motion modunda kullanılabilir kalır.
- RTL'de back/directional ikonlar doğru yöne döner.

İlk düzeltme listesi:

- Home favorite/settings icon butonları,
- onboarding start/skip/next aksiyonları,
- Settings support/destructive row'ları,
- vocabulary card speech/favorite aksiyonları,
- modal close ikonları,
- custom alert button rolleri,
- animated switch label/state sözleşmesi.

## 11. Screen bazlı düzenleme planı

### 11.1 Auth

Dosyalar:

- Login
- Sign Up
- Forgot Password

İşler:

- Deprecated SafeAreaView kaldırılır.
- Ortak `Screen`, `FormField`, `AppButton`, `IconButton` kullanılır.
- Üç ekrandaki logo/form spacing aynı token'lara taşınır.
- Keyboard ve kısa ekran davranışı ortak form layout'unda çözülür.
- Validation ve async auth davranışı değişmeden controller/application tarafında kalır.
- Social login button pattern'i ortaklaştırılır.

Exit gate:

- küçük ekran + keyboard,
- loading/disabled,
- invalid form,
- auth error,
- dark/light,
- VoiceOver label/state testleri.

### 11.2 Onboarding

Hedef parçalar:

```text
OnboardingScreen
  useOnboardingController
  OnboardingCarousel
  OnboardingSlide
  PaginationDots
  OnboardingActions
```

İşler:

- Step spec veri olarak kalır.
- Inline responsive hesaplar ortak hook'a taşınır.
- Dots selected state erişilebilir olur.
- Skip/next/start ortak button contract'ını kullanır.
- Büyük font ve kısa ekran için carousel copy/visual alanı scroll/flex ile dengelenir.

### 11.3 Setup ve Level Test

İşler:

- Setup step shell ortaklaştırılır.
- Native/target language seçim row'ları tek `LanguageSelectionRow` kullanır.
- Level seçimi `SelectionRow`/radio contract'ına taşınır.
- Notification time picker tekrarları tek wheel picker pattern'ında birleşir.
- Absolute bottom action `BottomActionBar` ile safe area uyumlu hâle gelir.
- `LevelTestScreen` controller + question view + result view olarak ayrılır.
- Test state geçişleri explicit reducer/state machine ile modellenir.

Exit gate:

- bütün setup step testleri,
- geri/ileri state korunumu,
- notification permission denied,
- küçük ekran,
- büyük font,
- route params doğrulaması.

### 11.4 Home ve vocabulary card

Hedef ayrım:

```text
HomeScreen
  useHomeController
  useHomeEngagementFlow
  HomeHeader
  HomeProgressSection
  VocabularyDeck
    VocabularyCard
    VocabularyCardActions
    VocabularyCardMetadata
  HomeBannerRegion
  HomeOverlays
```

İşler:

- Review, streak celebration ve interstitial orchestration ayrı engagement hook'una alınır.
- Swipe width modül sabiti olmaktan çıkar; responsive hook ile güncellenir.
- Swipe-only learn/skip işlemlerine erişilebilir buton alternatifi eklenir.
- Card height küçük ekran ve landscape için clamp edilir.
- Home header icon aksiyonları `IconButton` kullanır.
- Streak accent ham renk yerine semantic token olur.
- Loading/error/empty ortak async state pattern'ına taşınır.
- Tutorial ölçüm/overlay davranışı orientation ve reduced motion ile uyumlu hâle gelir.

Davranış kilidi:

- sağ/sol swipe anlamı,
- favorite,
- speech,
- example navigation,
- learned count,
- streak increment,
- review prompt,
- interstitial sırası

mevcut testlerle birebir korunur.

### 11.5 Settings

Hedef controller ayrımı:

```text
useSettingsScreenController
  useProfileSettingsController
  useNotificationSettingsController
  useLanguageSettingsController
  useProgressSettingsController
  useSettingsModalState
```

İşler:

- Çok sayıdaki boolean modal state tek discriminated union/reducer ile yönetilir.
- `SettingsRow`, `SectionCard`, `AppSwitch`, `AppModal` ve `FormField` kullanılır.
- Section'ların ayrı ayrı tanımladığı `393` scaling kaldırılır.
- Destructive action semantiği ve confirmation sırası ortaklaştırılır.
- Time/language/level/avatar modal shell tekrarları kaldırılır.
- Premium ve restore purchase feedback state'leri açık biçimde gösterilir.

Exit gate:

- mevcut section testleri korunur,
- her modal aç/kapa testi,
- logout/delete/reset confirmation,
- permission denied,
- free/premium,
- dark/light ve büyük font.

### 11.6 Favorites ve Example Sentences

İşler:

- `Screen`, `AppHeader`, async state ve `IconButton` kullanılır.
- Empty/loading/error durumları ortak pattern'e taşınır.
- Favorite row/card touch target ve labels düzeltilir.
- Speech aksiyonları icon-only contract'a geçirilir.
- AI açıklama modal'ı ortak modal shell kullanır.
- Uzun çeviri ve cümleler büyük font/RTL altında test edilir.

### 11.7 Streak, rating ve diğer overlay'ler

İşler:

- `StreakCelebrationOverlay` animation hook + presentational view olarak ayrılır.
- Konfeti/dekoratif animasyon reduced-motion'da statik varyanta geçer.
- `AppRatingPrompt` ortak modal/action primitives kullanır.
- Modal stacking engellenir.
- Overlay lifecycle tamamlanma callback'i idempotent olur.

## 12. Uygulama fazları

### Faz 0 — Baseline ve davranış kilidi

İşler:

- Baseline metrik script'i veya dokümante edilmiş komutları ekle.
- Ana ekran/state matrisi oluştur.
- Mevcut ekranların dark/light ve küçük/standart telefon referans görüntülerini al.
- Route, facade ve kritik interaction testlerini kilitle.
- Yeni ham renk ve yeni modül-seviyesi Dimensions kullanımını geçici lint/audit gate ile raporla.

Çıkış kriteri:

- Davranış regression'ı ile görsel değişiklik ayrıştırılabiliyor.

### Faz 1 — Theme ve token foundation

İşler:

- Semantic colors.
- Spacing/radius/typography/shadow/motion/breakpoint token'ları.
- Theme type'ları.
- Light/dark eşit key testi.
- Compatibility mapping.

Çıkış kriteri:

- Yeni primitive'ler ham değer kullanmadan geliştirilebilir.

### Faz 2 — Responsive ve accessibility foundation

İşler:

- `useResponsiveLayout`.
- `useReducedMotion`.
- Shared touch-target yardımcıları.
- Screen reader state helpers gerekiyorsa yalnız shared katmanda.
- Device matrix test fixture'ları.

Çıkış kriteri:

- Primitive'ler orientation ve font scaling'e tepki verir.

### Faz 3 — Shared primitives

Sıra:

1. AppText
2. AppButton
3. IconButton
4. AppInput/FormField
5. Screen/AppScrollView/AppHeader
6. Surface/SectionCard/Divider
7. AppSwitch/ProgressBar
8. AppModal/AppAlert
9. Async states
10. SettingsRow/SelectionRow/BottomActionBar

Her primitive için:

- prop contract,
- unit test,
- accessibility test,
- dark/light state,
- disabled/loading/pressed state,
- DevTools catalog örneği

zorunludur.

### Faz 4 — Düşük riskli pilot migration

Pilot ekranlar:

- Forgot Password
- Connection Error
- Favorites

Amaç:

- primitive contract'larını gerçek ekranlarda doğrulamak,
- eksik API'leri tüm uygulamaya yaymadan düzeltmek.

Çıkış kriteri:

- Davranış ve navigation regression'ı yok.
- Pilot ekranlarda doğrudan style/primitive tekrarı belirgin biçimde azalmış.

### Faz 5 — Auth ve onboarding

- Login/Sign Up/Forgot Password ortak form system'ına taşınır.
- Onboarding responsive/accessibility migration'ı yapılır.
- Screenshot ve manual QA matrisi geçer.

### Faz 6 — Setup ve Level Test

- Setup step pattern'ları birleştirilir.
- Level Test bölünür.
- Permission/time picker edge-case'leri doğrulanır.

### Faz 7 — Home ve learning

- Home orchestration ayrılır.
- Vocabulary card responsive ve accessible yapılır.
- Gesture/tutor/ads/streak/review davranış kilitleri doğrulanır.

Bu faz en yüksek regression riskine sahip olduğu için tek büyük PR yerine bağımsız dilimlere ayrılır.

### Faz 8 — Settings

- Controller bölünür.
- Section/row/modal primitive migration'ı yapılır.
- Destructive ve premium akışları hedefli test edilir.

### Faz 9 — Overlay, cleanup ve enforcement

- Streak/rating/AI modal migration'ı.
- Kullanılmayan compatibility stilleri kaldırılır.
- `COLORS` dark alias kaldırılır.
- Ham hex ve modül-level Dimensions gate'i blocking yapılır.
- UI public API ve dead code audit'i yapılır.

## 13. PR dilimleme kuralları

- Bir PR tek primitive ailesi veya tek ekran ailesi taşır.
- Token foundation ile ekran redesign aynı PR'da yapılmaz.
- Business rule değişikliği UI migration PR'ına eklenmez.
- Her PR önce mevcut davranış testini ekler/güçlendirir, sonra migration yapar.
- Compatibility export yalnız kullanan son ekran migrate edilene kadar korunur.
- PR açıklaması before/after state matrisi ve çalıştırılan gate'leri içerir.
- Riskli Home/Settings değişiklikleri kolay revert edilebilecek bağımsız commit'lere bölünür.

## 14. Test stratejisi

### 14.1 Primitive unit testleri

Her shared primitive için:

- render,
- press,
- disabled,
- loading,
- accessibility role/label/state,
- theme variant,
- style contract'ın kritik kısmı

test edilir.

### 14.2 Feature presentation testleri

- Controller state transition'ları hook testleriyle doğrulanır.
- View testleri facade/SDK yerine typed props kullanır.
- Navigation interaction testleri gerçek navigation context ile yapılır.
- Async state'lerin tamamı kapsanır.

### 14.3 Görsel regression

Referans matris:

```text
screen × state × theme × size class
```

İlk zorunlu kapsam:

- Login: idle/error/loading
- Onboarding: first/last
- Setup: language/level/permission/time
- Home: loading/empty/error/ready/tutorial
- Settings: free/premium + temel modallar
- Favorites: empty/ready
- Example Sentences: ready/loading/error modal

Görsel fark otomatik artifact üretir; kabul veya ret PR içinde açıkça kaydedilir.

### 14.4 Manual production smoke

- Fresh install.
- Logged-out auth flow.
- Existing cached user.
- Offline cached startup.
- Setup complete.
- Home swipe/favorite/speech.
- Streak/review/ad sıralaması.
- Settings notification/profile/language.
- Logout/delete confirmation.
- Light/dark ve büyük font.
- iOS VoiceOver temel akış.

## 15. DevTools UI kataloğu

Mevcut Screen Tester korunur ve genişletilir:

```text
Developer Test Panel
  Screens
  Components
  States
  Theme
  Responsive
  Accessibility
  Motion
```

Component catalog:

- bütün button varyantları,
- input durumları,
- settings/selection row,
- modal/alert,
- loading/empty/error,
- typography scale,
- color semantic rolleri,
- spacing/radius örnekleri.

State senaryoları gerçek SDK çağrısı yapmaz. Mock provider'lar Firebase, RevenueCat, AdMob veya
notification write çalıştırmaz.

## 16. CI ve quality gate'leri

Başlangıçta raporlayıcı, migration sonunda blocking olacak kontroller:

1. Feature presentation'da yeni ham hex renk yok.
2. Yeni `Dimensions.get('window')` yok.
3. Icon-only control'de accessibility label zorunlu.
4. Shared primitive test coverage eşiği.
5. Import boundary testi.
6. Typecheck, lint, Prettier ve `git diff --check`.
7. UI test suite.
8. Görsel artifact üretimi.

Önerilen migration-sonu bütçeleri:

| Metrik | Hedef |
|---|---:|
| Feature UI'da ham hex | 0; yalnız açık allowlist |
| Modül-level `Dimensions.get` | 0 |
| Tekrarlanan `393` scaling helper | 0 |
| Label'sız icon-only production action | 0 |
| Deprecated React Native SafeAreaView | 0 |
| Yeni production UI dosyası | tercihen `<300` satır |
| Screen/controller hard limit | `<400` satır |
| Shared primitive unit testleri | tüm public varyantlar |

## 17. Performans bütçesi

- Theme veya responsive context değişimi bütün app ağacında gereksiz rerender oluşturmamalı.
- Token objeleri render içinde yeniden üretilmemeli.
- Büyük listelerde inline component closure ve ölçüm işlemleri profile edilmelidir.
- Animation `useNativeDriver` desteklediği yerde kullanılır.
- Home gesture sırasında JS thread'e yeni ağır iş eklenmez.
- Görsel asset boyutu ve Lottie/animation kullanımında mevcut production bundle sınıfı korunur.
- Screen açılışında layout thrash ve gereksiz ölçüm döngüsü oluşturulmaz.

Performans değişikliği ölçüm olmadan “optimizasyon” kabul edilmez; before/after profil veya render count
kanıtı gerekir.

## 18. Rollout yaklaşımı

- UI migration feature flag gerektirmiyorsa ekran bazlı release edilir.
- Home veya Settings gibi yüksek riskli ekranlarda compatibility component'i bir release boyunca
  korunabilir.
- Crash-free/session, navigation failure ve kritik aksiyon tamamlama oranları izlenir.
- İlk production dalgasında küçük kapsamlı pilot ekranlar gözlenir.
- Regression görülürse business/data migration gerektirmeden ilgili ekran commit'i revert edilebilir.
- Token ve primitive API'leri migration bitmeden gereksiz breaking değişikliğe uğratılmaz.

## 19. Riskler ve önlemler

| Risk | Önlem |
|---|---|
| Görsel migration sırasında iş davranışı değişmesi | Davranış testi önce, UI değişikliği sonra |
| Light theme regression | Semantic token key testi + ekran matrisi |
| Küçük ekranda taşma | Size-class testleri + scroll fallback |
| Büyük fontta aksiyon kaybı | Dynamic type acceptance |
| Home gesture regression | Mevcut swipe testleri + cihaz smoke |
| Modal stacking/focus problemi | Tek modal state reducer + AppModal contract |
| Primitive'in aşırı generic olması | Gerçek pilot ekranlardan sonra API sabitleme |
| Büyük tek PR | Faz ve ekran bazlı küçük PR |
| Design token bypass | Önce raporlayıcı, sonra blocking lint/audit |
| Performance düşüşü | Render/profile baseline ve bütçe |

## 20. Production Definition of Done

Bir ekran migration'ı tamamlanmış sayılmaz, eğer:

- ortak token ve uygun primitive'leri kullanmıyorsa;
- loading/empty/error/offline durumları tanımlı değilse;
- küçük/standart/büyük layout doğrulanmadıysa;
- light/dark doğrulanmadıysa;
- icon-only aksiyon label'sızsa;
- büyük font ve safe area smoke yapılmadıysa;
- navigation ve business behavior testleri geçmiyorsa;
- yeni ham renk veya modül-level Dimensions eklediyse;
- DevTools catalog/state kaydı eksikse;
- typecheck, lint, Prettier, boundary ve hedefli testler geçmiyorsa.

Program tamamlanmış sayılmaz, eğer:

- `COLORS` dark compatibility alias hâlâ production UI tarafından kullanılıyorsa;
- 393 tabanlı yerel scaling helper'ları kalmışsa;
- deprecated SafeAreaView kalmışsa;
- Home/Settings kritik akışları production smoke'tan geçmemişse;
- rollback/revert yolu doğrulanmamışsa;
- bu belgede tanımlanan migration-sonu quality gate'leri blocking değilse.

## 21. Uygulama sırası özeti

```text
Baseline
  → Tokens
    → Responsive/accessibility foundation
      → Shared primitives
        → Pilot screens
          → Auth/onboarding
            → Setup/level test
              → Home/learning
                → Settings
                  → Overlays/cleanup
                    → Blocking enforcement
```

İlk uygulanacak teknik iş paketi:

1. semantic theme token dosyaları,
2. responsive/reduced-motion hook'ları,
3. `AppText`, `AppButton`, `IconButton`, `Screen`,
4. primitive testleri ve DevTools component catalog,
5. Forgot Password pilot migration'ı.

Bu sıra, yüksek riskli Home ve Settings ekranlarına geçmeden önce design-system API'sinin gerçek bir
production ekranında doğrulanmasını sağlar.
