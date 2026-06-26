# 22 — Phase 2: App Bootstrap / Navigation / Providers

1. **Amaç** — `App.tsx` (~560) god-component’ını `app/bootstrap`, `app/providers`, `app/navigation`, `app/lifecycle`, `app/config`’a bölmek.
2. **Kapsam** — Provider zinciri, RootNavigator, lifecycle (AppState, notif maintenance, ad init, sync, review) ayrımı.
3. **Kapsam dışı** — Feature içi mantık; notification/auth iç bölme (sonraki fazlar).
4. **Ön koşullar** — Phase 1 (shared + alias).
5. **Etkilenecek dosyalar** — `App.tsx`, navigation tanımları, `context/*` provider sarıcıları.
6. **Taşınacak/bölünecek dosyalar** — `App.tsx` → `app/App.tsx` (ince) + `app/providers/AppProviders.tsx` + `app/navigation/RootNavigator.tsx` + `app/lifecycle/useAppLifecycle.ts` + `app/bootstrap/*`. Kök `App.tsx` → shim re-export.
7. **Yeni hedef klasör yapısı** — `src/app/{App.tsx,bootstrap,providers,navigation,lifecycle,config}`.
8. **Adım adım işler** — (a) provider zincirini `AppProviders`’a taşı; (b) navigator’ı ayır + `RootStackParamList` tip dosyası; (c) lifecycle yan etkilerini `useAppLifecycle` hook’una taşı (facade çağrıları placeholder, gerçek facade sonraki fazlarda); (d) bootstrap (font/splash) ayır; (e) kök `App.tsx` shim.
9. **Kod davranışı korunacak noktalar** — Provider sırası (Theme>Alert>Auth>Monetization>ErrorBoundary); splash/font gate; lifecycle tetikleme sırası ve koşulları AYNEN.
10. **Firestore/Storage/Auth/Notification etkileri** — Dolaylı: lifecycle hook aynı çağrıları aynı sırayla yapar (init, maintenance, sync, review).
11. **Test gereksinimleri** — navigation smoke testi; provider render testi; lifecycle hook unit (mock yan etkiler).
12. **Manuel QA checklist** — [ ] soğuk açılış [ ] foreground/background geçişi [ ] app-open ad [ ] sync tetikleniyor [ ] review prompt.
13. **Riskler** — R2 (davranış regresyonu, lifecycle sırası). Azaltma: `03` sözleşmesi + QA.
14. **Rollback planı** — Kök `App.tsx` shim; eski yapıya dönüş.
15. **Kabul kriterleri** — `App.tsx` ince; lifecycle hook’ta toplanmış; davranış birebir; testler yeşil.
16. **Sonraki faza geçmeme şartları** — Lifecycle/navigation davranışında QA regresyonu varsa Phase 3’e geçme.


## Implementation-spec bağlantıları (v2 — `32`–`39`)
- **PR kırılımı:** `39` Phase 2 → PR-2.1 AppProviders, 2.2 RootNavigator+`RootStackParamList`, 2.3 useAppLifecycle, 2.4 bootstrap + kök `App.tsx` shim.
- **Gerçek yapı:** `App.tsx` = `App`(487-566) + `AppContent`(67-477). Route'lar (`types.ts`): Onboarding, Login, SignUp, ForgotPassword, NativeLanguage, LevelTest, MainTabs, Settings, Favorites, ExampleSentences.
- **Shim:** `36` (kök `App.tsx` → `export { default } from '@app/App'`).
- **Import sınırı:** `33` (`app → features (barrel) + shared`).
- **Korunan davranış (`03` §1):** provider sırası Theme→Alert→Auth→Monetization→ErrorBoundary; lifecycle tetik sırası AYNEN.
- **Gate:** soğuk açılış + foreground/background + ad/sync/review QA regresyonsuz.
