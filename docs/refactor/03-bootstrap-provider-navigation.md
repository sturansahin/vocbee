# 03 — App Bootstrap, Provider Zinciri, Navigation ve Lifecycle

## Mevcut Durum

Tüm bootstrap, provider, navigation ve lifecycle mantığı tek dosyada: `App.tsx` (486 satır).

- **Modul seviyesi yan etkiler:** `configureNotifications()` (sat. 55) ve
  `SplashScreen.preventAutoHideAsync()` (sat. 58) import anında çalışıyor.
- **`AppContent` bileşeni** (sat. 67-477): `useAuth/useMonetization/useTheme` tüketir;
  navigation theme'i kurar; **8+ useEffect** ile:
  - initial route belirleme (`determineInitialRoute`, `STORAGE_KEYS.HAS_SEEN_ONBOARDING`)
  - `autoSync(user.uid)` (mount + foreground)
  - notification maintenance (`runNotificationMaintenance`: processDelivered + setLastForegroundTime + refill)
  - notification permission gate (`ensureAuthenticatedUserNotificationPermission`)
  - AdMob init zinciri (`initializeAdMob` + `refreshAdInventoryOnForeground` + `checkAndShowAppOpenAd`)
  - cold-start & live notification response tüketimi (`consumeNotificationResponse`, retry'lı)
  - `AppState` change listener (background/foreground; sync + notif + ads)
  - review app launch kaydı (`recordReviewAppLaunch`)
- **`App` default export** (sat. 487-565): font yükleme (`useFonts`, `Font.loadAsync`), Android
  navigation bar, splash gizleme, ve provider zinciri:
  `SafeAreaProvider > ThemeProvider > AlertProvider > AuthProvider > MonetizationProvider > ErrorBoundary > GestureHandlerRootView > (OfflineNotice + AppContent)`.
- Navigation: `createStackNavigator<RootStackParamList>`; Stack.Screen listesi `App.tsx` içinde sabit.

## Sorunlar

1. Tek dosyada çok sorumluluk → okunamaz, test edilemez, çakışma riski yüksek.
2. Lifecycle yan etkileri (notif/ads/sync) UI bileşeniyle iç içe; sıralama hatası zamanlamayı bozar.
3. Navigation tanımı ekranların implementasyonuyla aynı yerde; route ekleme = `App.tsx` değişikliği.
4. Modul-seviyesi yan etkiler (`configureNotifications`, splash) test ve tekrar kullanımı zorlaştırır.

## Önerilen Yaklaşım

`App.tsx`'i **ince bir kompozisyon köküne** indir; sorumlulukları `src/app/` altına ayır.
Davranış ve **effect sırası** birebir korunur — sadece yer değişir.

```
src/app/
  App.tsx                 # <AppProviders><RootGate/></AppProviders>
  bootstrap/
    useAppFonts.ts        # useFonts + Font.loadAsync (icon fontları)
    useSplashGate.ts      # preventAutoHide + hideAsync (fontlar hazır olunca)
    useAndroidNavBar.ts   # NavigationBar ayarları (Platform.OS === 'android')
    configureNotifications.ts  # modul yan etkisi yerine açık çağrılan init
  providers/
    AppProviders.tsx      # SafeArea>Theme>Alert>Auth>Monetization>ErrorBoundary>GestureHandler
  navigation/
    RootNavigator.tsx     # Stack.Navigator + Stack.Screen listesi
    routes.ts             # route adları (RootStackParamList ile uyumlu)
    useNavigationTheme.ts # isDarkMode + colors -> NavigationContainer theme
    useInitialRoute.ts    # determineInitialRoute mantığı (hasSeenOnboarding/user/setup)
  lifecycle/
    useAppLifecycle.ts    # AppState orkestrasyonu (tek çatı)
    useNotificationMaintenance.ts
    useNotificationResponses.ts   # cold-start + listener + resume
    useNotificationPermissionGate.ts
    useStartupAds.ts
    useAutoSyncOnForeground.ts
    useReviewLaunch.ts
```

- `RootGate` bileşeni: splash/connection-error kararı + `<RootNavigator initialRoute=.../>`.
  (Mevcut `AppContent`'in render kısmı; ama lifecycle hook'ları artık ayrı dosyalarda.)
- Her lifecycle hook, mevcut `App.tsx`'teki ilgili `useEffect`'in **birebir** taşınmış hâlidir
  (aynı koşullar, aynı ref guard'lar: `notificationMaintenanceInFlight`, `adStartupUserId`, vb.).
- `configureNotifications()` artık `bootstrap`'ta açık çağrılır (modul import yan etkisi değil).

## Alternatifler ve Neden Elendiler

- **`App.tsx`'i olduğu gibi bırak** — Elendi: tek dosya tıkanıklığı büyümeyi engelliyor.
- **Lifecycle'ı tek dev hook'ta birleştir** — Kısmen; ama her ilgi alanı ayrı hook olursa test ve
  okunabilirlik artar. `useAppLifecycle` sadece bunları çağıran ince orkestratör.
- **Navigation kütüphanesini v7'ye yükselt** — Elendi (şimdilik): kapsam dışı, ayrı risk; önce yapısal ayrışma.
- **expo-router'a geç** — Elendi: büyük davranış değişikliği + deep-link/route sözleşmesi riski;
  mevcut `RootStackParamList` akışı korunmalı.

## Migration / Implementasyon Adımları

1. **PR-1:** `src/app/providers/AppProviders.tsx` oluştur; `App.tsx`'in provider zincirini buraya taşı.
   `App.tsx` artık `<AppProviders>{<AppContent/>}</AppProviders>` render eder. (Sadece JSX taşıma.)
   - Komut: `npm run typecheck && npm run test:ci`
2. **PR-2:** Bootstrap hook'larını (`useAppFonts`, `useSplashGate`, `useAndroidNavBar`) ayır;
   `App` default export bunları çağırır. Davranış aynı.
3. **PR-3:** `navigation/RootNavigator.tsx` + `useNavigationTheme` + `useInitialRoute` ayır.
   `RootStackParamList` `src/app/navigation/routes.ts`'e taşınır (eski `types.ts`'ten re-export).
4. **PR-4:** Lifecycle effect'lerini tek tek hook'lara taşı (her PR'da 1-2 effect). Her taşımada
   ilgili karakterizasyon testi (bkz. `14`) koşulur.
5. **PR-5:** `configureNotifications()` modul yan etkisini açık çağrıya dönüştür (`bootstrap` içinde).

Her PR sonunda: `npm run typecheck && npm run typecheck:test && npm run test:ci`.

## Riskler

- **Effect sırası/bağımlılık dizisi değişirse** notification refill veya app-open ad zamanlaması kayar.
  Azaltım: hook'lara taşırken `useEffect` dependency array'leri **birebir** kopyala; ref guard'ları koru.
- **Splash gizleme yarışı:** fontlar yüklenmeden `hideAsync` çağrılırsa beyaz ekran. Azaltım: mevcut
  `fontsLoaded && iconFontsLoaded` koşulu korunur.
- **Provider sırası:** `MonetizationProvider` `useAuth`'a bağlı (profile/email). Sıra korunmalı:
  Auth önce, Monetization sonra.

## Test ve Kabul Kriterleri

- Karakterizasyon testi: cold-start → doğru initial route (onboarding/login/setup/home) seçimi.
- `AppState` `background->active` geçişinde `autoSync` + `runNotificationMaintenance('resume')` çağrıldığı
  doğrulanır (mock'lu).
- Notification response dedupe davranışı (`handledNotificationResponses`) korunur.
- `npm run typecheck`, `npm run test:ci` yeşil.

## Etkilenecek Dosyalar

```
App.tsx -> src/app/App.tsx
        -> src/app/providers/AppProviders.tsx
        -> src/app/bootstrap/{useAppFonts,useSplashGate,useAndroidNavBar,configureNotifications}.ts
        -> src/app/navigation/{RootNavigator,routes,useNavigationTheme,useInitialRoute}.ts
        -> src/app/lifecycle/{useAppLifecycle,useNotificationMaintenance,useNotificationResponses,
                              useNotificationPermissionGate,useStartupAds,useAutoSyncOnForeground,useReviewLaunch}.ts
types.ts (RootStackParamList) -> src/app/navigation/routes.ts (eski types.ts re-export shim)
kök App.tsx -> ince shim: export { default } from './src/app/App'
```

Not: `package.json` `main: expo/AppEntry.js` `./App`'i import ettiği için kök `App.tsx` shim olarak korunur.
