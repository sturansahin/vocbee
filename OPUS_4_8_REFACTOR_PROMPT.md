# Opus 4.8 Refactor Prompt

Asagidaki promptu Opus 4.8'e tek parca olarak ver.

```text
Sen senior bir React Native / Expo yazilim muhendisisin. Bu repo VocBee adli bir kelime ogrenme uygulamasi. Senden istedigim sey, benim verdigim hedef mimariyi uygulaman degil; projeyi bir muhendis gibi inceleyip, bu uygulama buyutulecek olsa nasil tasarlanmasi ve hangi sirayla refactor edilmesi gerektigine kendin karar vermen.

Yaniti ve olusturacagin dokumanlari Turkce yaz. Teknik terimleri gerekirse Ingilizce birakabilirsin. Repo icindeki gercek dosyalara, importlara, testlere, servis baglantilarina ve mevcut davranisa bakmadan varsayim yapma.

## Calisma Sekli

- Once projeyi analiz et.
- Sonra mevcut mimarinin guclu ve zayif taraflarini cikar.
- Ardindan bu uygulama icin en dogru gordugun hedef mimariyi kendin oner.
- Hedef mimariyi neden sectigini alternatiflerle birlikte acikla.
- Uygulamaya hazir, parca parca ilerleyen refactoring dokumanlari hazirla.
- Ilk asamada kodu tasima veya implementasyon yapma; once refactor planini ve dokumanlari olustur.
- Dokumanlar bittikten sonra uygulanacak ilk implementasyon fazini oner.

## Proje Baglami

Bu proje Expo / React Native tabanli bir mobil uygulama.

Bilinen teknolojiler:

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript strict
- React Navigation
- Firebase Auth / Firestore
- Firebase Functions / Firestore rules
- AsyncStorage
- Expo Notifications
- i18next / react-i18next
- AdMob
- RevenueCat
- Jest / React Native Testing Library
- EAS / Fastlane

Mevcut kok klasorlerde su yapilar bulunuyor:

- `App.tsx`
- `screens/`
- `components/`
- `services/`
- `context/`
- `utils/`
- `types/`
- `config/`
- `locales/`
- `assets/`
- `api/`
- `functions/`
- `proxy/`
- `tests/`

Buyume riski tasidigi dusunulen bazi dosyalar:

- `screens/SettingsScreen.tsx`
- `screens/HomeScreen.tsx`
- `screens/SetupScreens.tsx`
- `services/notificationService.ts`
- `screens/AuthScreens.tsx`
- `screens/ExampleSentencesScreen.tsx`
- `context/AuthContext.tsx`
- `services/adMobService.ts`
- `services/vocabularyService.ts`
- `App.tsx`

Bu liste sadece dikkat cekmek icindir. Nihai onceliklendirmeyi sen repo analizi sonucunda yap.

## Temel Beklenti

Bu uygulama ileride buyuyecek. Amac:

- Bakimi kolaylastirmak.
- Dosya ve sorumluluk karmasasini azaltmak.
- Test edilebilirligi artirmak.
- Mevcut kullanici verisini ve uygulama davranisini korumak.
- Refactoru riskli tek seferlik rewrite yerine kucuk, dogrulanabilir adimlara bolmek.

Hangi mimari yaklasimin uygun olduguna sen karar ver. Feature-based, domain-based, layered, hybrid veya baska bir yapi olabilir. Kararini mevcut kodun gercek ihtiyaclariyla gerekcelendir.

## Cok Onemli Kurallar

- Ilk asamada uygulama kodunu refactor etme. Once yalnizca Markdown dokumanlari olustur.
- Hedef mimariyi onceden verilmis kabul etme; kendin analiz edip sec.
- Mevcut davranisi koru.
- AsyncStorage keyleri, Firebase dokuman yapisi, notification schedule davranisi, auth akisi, streak/progress verisi, abonelik ve reklam akislari bozulmamali.
- Secret, API key, `.env`, plist/json degerlerini dokumana kopyalama.
- Yeni paket onermeden once mevcut paketlerle cozum mumkun mu degerlendir.
- Expo uyumlulugunu dikkate al.
- Her oneri gercek dosya yollarina dayansin.
- Dosya tasima onerilerinde `eski yol -> yeni yol` mapping ver.
- Her implementasyon adimini PR/commit boyutunda bol.
- Her adim icin rollback ve test stratejisi yaz.
- Gereksiz buyuk soyutlamalar onermekten kacin; problemi cozdukleri yerlerde soyutlama oner.

## Mevcut Test ve Kontrol Komutlari

Repo icindeki scriptleri kendin dogrula. Bilinen komutlar:

- `npm run typecheck`
- `npm run test:ci`
- `npm run typecheck:test`
- `npm run typecheck:rules`
- `npm run typecheck:worker`
- `npm --prefix functions run build`
- `npm --prefix functions run lint`

Hangi refactor fazinda hangi komutlarin calistirilmasi gerektigini sen belirle.

## Olusturulacak Dokumanlar

`docs/refactor/` klasoru altinda ayrintili Markdown dosyalari olustur. Dosya isimlerini sen belirleyebilirsin; ancak asagidaki konularin her biri ayri dokuman ya da cok net ayri bolum olarak yer almali.

Her dokumanda mumkun oldugunca su bolumler olsun:

- Mevcut Durum
- Sorunlar
- Onerilen Yaklasim
- Alternatifler ve Neden Elendiler
- Migration / Implementasyon Adimlari
- Riskler
- Test ve Kabul Kriterleri
- Etkilenecek Dosyalar

Kapsanmasi gereken alanlar:

1. Mevcut mimari audit'i.
2. Onerdigin hedef klasor ve modul yapisi.
3. App bootstrap, provider zinciri, navigation ve lifecycle ayrimi.
4. Screen/component/hook/service sorumluluk ayrimi.
5. Auth, profile ve Firebase sync mimarisi.
6. Notification mimarisi.
7. Learning, vocabulary, progress, favorites ve streak domainleri.
8. Settings ve setup ekranlarinin parcalanmasi.
9. UI component sistemi, tema, responsive davranis ve dark mode.
10. i18n/localization yapisi.
11. Storage, cache, offline ve migration stratejisi.
12. AdMob, RevenueCat ve monetization akisi.
13. Security, env ve Firebase rules riskleri.
14. Test stratejisi.
15. Performans stratejisi.
16. CI/CD, release ve versioning.
17. Risk register.
18. Phase-based implementation roadmap.
19. Definition of Done checklistleri.

Bu konu listesini dogrudan hedef mimari gibi alma. Bunlar incelenmesi gereken alanlar. Uygulama icin daha dogru gordugun dosya/dokuman ayrimini kendin yapabilirsin.

## Ozellikle Incele

Asagidaki dosyalari mutlaka incele, fakat sadece bunlarla sinirli kalma:

- `App.tsx`
- `screens/HomeScreen.tsx`
- `screens/SettingsScreen.tsx`
- `screens/SetupScreens.tsx`
- `screens/AuthScreens.tsx`
- `screens/ExampleSentencesScreen.tsx`
- `screens/LevelTestScreen.tsx`
- `services/notificationService.ts`
- `services/vocabularyService.ts`
- `services/progressService.ts`
- `services/SyncService.ts`
- `services/storage.ts`
- `services/adMobService.ts`
- `services/revenueCatService.ts`
- `context/AuthContext.tsx`
- `context/ThemeContext.tsx`
- `context/MonetizationContext.tsx`
- `components/UIComponents.tsx`
- `services/i18n.ts`
- `locales/*.ts`
- `package.json`
- `tsconfig.json`
- `jest.config.js`
- `firestore.rules`
- `functions/`

## Beklenen Ilk Cevap

Ilk cevapta sunlari yap:

1. Repo analizinden cikardigin kisa ozeti yaz.
2. Hangi dokumanlari olusturdugunu listele.
3. Kod refactoruna baslamadigini acikca belirt.
4. En riskli gordugun 5 alani yaz.
5. Kendi muhendislik kararina gore ilk uygulanmasi gereken implementasyon fazini oner.

## Implementasyon Icin Hazirlik

Dokumanlarda sadece fikir yazma; implementasyona hazir olacak kadar net yaz:

- Yeni dosya yollarini belirt.
- Eski dosyadan yeni dosyaya tasinacak sorumluluklari belirt.
- Public API / facade gerekiyorsa tasarla.
- Testleri nasil koruyacagini yaz.
- Hangi adimda hangi dosyalarin degisecegini belirt.
- Her phase sonunda calistirilacak komutlari yaz.

Ancak dokumanlar tamamlanmadan kodu tasima. Dokumanlari olusturduktan sonra benden onay iste. Onay gelirse once en dusuk riskli, en yuksek faydali implementasyon adimindan basla.
```
