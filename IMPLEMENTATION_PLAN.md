# VocBee Production-Ready İmplementasyon Planı

> **Tarih:** 11 Şubat 2026  
> **Kapsam:** deep-research-report (1).md ve (2).md bulgularının kod bazında doğrulanması + düzeltme planı  
> **İlke:** Uygulamanın mevcut yapısı korunacak, sadece tespit edilen sorunlar hedefli şekilde düzeltilecek

---

## BÖLÜM 1: BULGU DOĞRULAMA RAPORU

Her rapor bulgusunu kaynak kodda doğruladım. Aşağıda durum özeti:

### ✅ DOĞRULANAN SORUNLAR

| # | Bulgu | Dosya(lar) | Durum |
|---|-------|-----------|-------|
| 1 | **EXPO_PUBLIC_ Groq API Key istemcide gömülü** | `services/groqService.ts:3` | **DOĞRU** — `process.env.EXPO_PUBLIC_GROQ_API_KEY` doğrudan bundle'a inline ediliyor |
| 2 | **AdMob UMP/Consent akışı yok** | `services/adMobService.ts`, `components/SafeBannerAd.tsx` | **DOĞRU** — Hiçbir yerde `AdsConsent`, UMP veya ATT kodu bulunmuyor. `initializeAdMob()` rıza almadan direkt başlatılıyor |
| 3 | **Android 13+ POST_NOTIFICATIONS eksik** | `services/notificationService.ts:104-140` | **KISMEN DOĞRU** — `expo-notifications` kendi başına `requestPermissionsAsync()` ile Android 13+ izin istemi yapabiliyor ancak `app.json`'da `android.permissions: ["POST_NOTIFICATIONS"]` tanımlı değil. Kanal oluşturma var ama `channelId` bildirim planlamasında doğru şekilde kullanılıyor |
| 4 | **Bildirim "teslim" tespiti zamana dayalı** | `services/notificationService.ts:320-380` | **DOĞRU** — `scheduledTime < now` varsayımıyla "delivered" kabul ediliyor. DND/izin kapalı/batarya kısıtı durumlarında yanlış öğrenildi işaretleme riski var |
| 5 | **Tüm sözlük verisi tek JSON blob olarak AsyncStorage'da** | `services/vocabularyService.ts:334-346` | **DOĞRU** — `generateVocabulary()` tüm seviyeleri (A1-C1) tek bir `@vocabulary` anahtarına JSON.stringify ile yazıyor. 5 seviye × ~500 kelime × tam veri = potansiyel MB'lar |
| 6 | **RTL desteği yok** | Tüm ekranlar ve bileşenler | **DOĞRU** — `I18nManager` hiçbir yerde kullanılmıyor. `app.json`'da `supportsRTL` veya `supportedLocales` yok. Arapça, Farsça, Urduca gibi RTL dilleri destekleniyor ama UI tamamen LTR |
| 7 | **UI overflow / fontScale sorunları** | `components/UIComponents.tsx`, `screens/SettingsScreen.tsx`, `screens/SetupScreens.tsx` | **DOĞRU** — `height: 56` sabit yükseklik (minHeight olmalı), `fontSize` değerleri sabit, `PixelRatio.getFontScale()` kontrolü yok |
| 8 | **Firebase config istemcide açık** | `config/firebase.ts:9-17` | **BİLGİ** — Firebase web config anahtarları tasarım gereği paylaşılabilir (Security Rules ile korunur). Bu kritik risk değil ama Firestore kurallarının doğru yapılandırıldığından emin olunmalı |
| 9 | **iOS Info.plist izin açıklamaları eksik** | `app.json` | **DOĞRU** — `ios.infoPlist` altında `NSUserTrackingUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` tanımlı değil (SettingsScreen'de image picker kullanılıyor) |
| 10 | **Bildirim kanalı channelId kullanımı** | `services/notificationService.ts` | **DÜZGÜN** — Kanal `vocabulary` adıyla oluşturuluyor ve `scheduleNotificationAsync` içinde `channelId: 'vocabulary'` gönderiliyor. Bu bulgu zaten düzeltilmiş |

---

## BÖLÜM 2: ÖNCELİKLENDİRİLMİŞ DÜZELTME PLANI

### 🔴 P0 — KRİTİK (Mağaza reddi / Güvenlik riski)

---

#### P0-1: Groq API Anahtarının İstemciden Kaldırılması
**Risk:** Anahtar APK/IPA decompile ile çıkarılabilir → maliyet, abuse, servis engeli  
**Etkilenen dosya:** `services/groqService.ts`

**Implementasyon Adımları:**
1. Basit bir Cloudflare Worker / Vercel Edge Function / Firebase Cloud Function oluştur
2. Worker, Groq API'ye proxy olarak çalışsın (API key yalnızca sunucuda)
3. İstemcide `groqService.ts` güncelle: doğrudan Groq yerine proxy endpoint'e istek at
4. Rate limiting'i sunucu tarafına taşı (istemci tarafı zaten var ama bypass edilebilir)
5. `.env`'den `EXPO_PUBLIC_GROQ_API_KEY` kaldır, mevcut anahtarı Groq dashboard'dan revoke et ve yenisini sunucuya koy

**Değişiklik:**
```typescript
// services/groqService.ts — ÖNCE
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// services/groqService.ts — SONRA
const PROXY_API_URL = 'https://your-proxy.your-domain.com/api/grammar';
// API key artık istemcide yok — sunucu tarafında
```

**Ek dosya:** `proxy/` klasörü altında Cloudflare Worker veya Firebase Function kodu  
**Tahmini süre:** 4-8 saat (proxy deploy dahil)  
**Uygulamadaki yapıya etkisi:** Minimal — sadece `groqService.ts` request URL'i ve header'ları değişir

---

#### P0-2: AdMob UMP/Consent + iOS ATT Akışı
**Risk:** EEA/UK'de rıza olmadan kişiselleştirilmiş reklam → GDPR ihlali, Google politika ihlali, mağaza reddi  
**Etkilenen dosyalar:** `services/adMobService.ts`, `App.tsx`, `app.json`

**Implementasyon Adımları:**

**Adım 1 — `app.json` güncellemesi:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserTrackingUsageDescription": "This identifier will be used to deliver personalized ads to you.",
        "SKAdNetworkItems": [
          { "SKAdNetworkIdentifier": "cstr6suwn9.skadnetwork" }
        ]
      }
    },
    "plugins": [
      // mevcut plugin'ler...
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-3149431742550187~5197491242",
          "iosAppId": "ca-app-pub-3149431742550187~5197491242",
          "userTrackingUsageDescription": "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ]
  }
}
```

**Adım 2 — `services/adMobService.ts` güncelleme (consent akışı ekle):**
```typescript
// adMobService.ts'e eklenecek fonksiyon
export const requestConsent = async (): Promise<void> => {
    loadAdMobModule();
    if (!AdMobModule) return;

    try {
        const { AdsConsent, AdsConsentStatus } = require('react-native-google-mobile-ads');
        
        const consentInfo = await AdsConsent.requestInfoUpdate();
        
        if (consentInfo.isConsentFormAvailable && 
            consentInfo.status === AdsConsentStatus.REQUIRED) {
            await AdsConsent.showForm();
        }
    } catch (error) {
        console.error('Consent request failed:', error);
    }
};
```

**Adım 3 — `App.tsx` başlatma sırası düzeltme:**
```typescript
// ÖNCE (mevcut):
initializeAdMob().then(() => {
    checkAndShowAppOpenAd();
});

// SONRA:
requestConsent().then(() => {
    initializeAdMob().then(() => {
        checkAndShowAppOpenAd();
    });
});
```

**Tahmini süre:** 6-10 saat (test dahil)  
**Uygulamadaki yapıya etkisi:** Minimal — `adMobService.ts`'e yeni bir export fonksiyon ekleniyor, `App.tsx`'de init sırası değişiyor

---

#### P0-3: Android 13+ Bildirim İzin Akışı Güçlendirme
**Risk:** Android 13+ cihazlarda bildirimler sessizce devre dışı kalabilir  
**Etkilenen dosyalar:** `services/notificationService.ts`, `app.json`

**Implementasyon Adımları:**

**Adım 1 — `app.json`'a izin ekle:**
```json
{
  "expo": {
    "android": {
      "permissions": ["POST_NOTIFICATIONS"]
    }
  }
}
```

**Adım 2 — İzin durumu kontrolü güçlendir (`notificationService.ts`):**
```typescript
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync({
                android: {
                    // Expo SDK 54+ Android 13 desteği
                },
            });
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permissions not granted');
            return false;
        }

        // Android kanalı oluştur (mevcut kod zaten doğru)
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('vocabulary', {
                name: 'Vocabulary Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FFD700',
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}
```

**Adım 3 — Reddedilme UX'i geliştir (SetupScreens.tsx zaten iyi, SettingsScreen.tsx'e de ekle):**
- SettingsScreen'de bildirim toggle açılırken izin reddedilmişse `Linking.openSettings()` yönlendirmesi ekle
- Mevcut SetupScreen mantığı (zaten var: `handleNotificationPermission → Linking.openSettings()`) korunsun

**Tahmini süre:** 2-4 saat  
**Uygulamadaki yapıya etkisi:** `app.json` + `notificationService.ts`'de minimal değişiklik

---

### 🟡 P1 — YÜKSEK ÖNCELİK (Performans / Kararlılık)

---

#### P1-1: Bildirim Teslim Tespitini İyileştirme
**Risk:** DND/izin kapalı/batarya kısıtı durumunda yanlış "öğrenildi" işaretleme  
**Etkilenen dosya:** `services/notificationService.ts`

**Implementasyon Adımları:**
```typescript
// processDeliveredNotifications() içinde ek kontrol
export async function processDeliveredNotifications(): Promise<number> {
    // ... mevcut kod ...
    
    // YENİ: OS'den gerçekten teslim edilen bildirimleri al
    const osDelivered = await Notifications.getPresentedNotificationsAsync();
    const deliveredIds = new Set(osDelivered.map(n => n.request.identifier));
    
    for (const notification of delivered) {
        // Mevcut foreground/level/language kontrolleri...
        
        // YENİ: OS teyidi — bildirim gerçekten teslim edilmiş mi?
        if (!deliveredIds.has(notification.notificationId)) {
            // OS bildirim tepsisinde yok — muhtemelen teslim edilmedi
            // "Güvenli mod": öğrenildi olarak işaretleme, bir sonraki sefere bırak
            console.log(`[Notifications] SKIPPED "${notification.word}" - not confirmed by OS`);
            skippedCount++;
            continue;
        }
        
        // ... mevcut işaretleme kodu ...
    }
}
```

**Tahmini süre:** 3-5 saat (edge case testleri dahil)  
**Uygulamadaki yapıya etkisi:** Sadece `processDeliveredNotifications()` fonksiyonuna ek kontrol

---

#### P1-2: Sözlük Verisini Level-Bazlı AsyncStorage Anahtarlarına Böl
**Risk:** Tek `@vocabulary` anahtarı MB'larca JSON → AsyncStorage Android limiti (~6MB toplam, ~2MB tek kayıt), yavaş okuma  
**Etkilenen dosyalar:** `services/vocabularyService.ts`

**İmplementasyon Adımları:**

```typescript
// vocabularyService.ts — Değişiklikler

// ÖNCE: Tek anahtar
const VOCABULARY_KEY = STORAGE_KEYS.VOCABULARY; // '@vocabulary'

// SONRA: Level bazlı anahtarlar
function getVocabularyLevelKey(level: Level): string {
    return `${STORAGE_KEYS.VOCABULARY}_${level}`;
}

// generateVocabulary — her seviyeyi ayrı kaydet
export async function generateVocabulary(
    nativeLanguage: string,
    targetLanguage: string
): Promise<void> {
    await AsyncStorage.setItem(NATIVE_LANGUAGE_KEY, nativeLanguage);
    await AsyncStorage.setItem(TARGET_LANGUAGE_KEY, targetLanguage);

    for (const level of LEVELS) {
        const merged = await mergeVocabulary(nativeLanguage, targetLanguage, level);
        // Her seviye ayrı bir anahtar
        await AsyncStorage.setItem(getVocabularyLevelKey(level), JSON.stringify(merged));
        console.log(`  ${level}: ${merged.length} words`);
    }
    
    // Migration: eski tek-blob anahtarını temizle
    await AsyncStorage.removeItem(STORAGE_KEYS.VOCABULARY);
    console.log('Vocabulary saved (per-level keys)');
}

// getStoredVocabulary — level bazlı oku
export async function getStoredVocabulary(level: Level): Promise<VocabularyWord[]> {
    try {
        // Önce yeni format dene
        const levelData = await AsyncStorage.getItem(getVocabularyLevelKey(level));
        if (levelData) {
            return JSON.parse(levelData);
        }
        
        // Eski format fallback (migration)
        const legacyData = await AsyncStorage.getItem(STORAGE_KEYS.VOCABULARY);
        if (legacyData) {
            const allVocab = JSON.parse(legacyData);
            if (allVocab[level]) {
                // Eski formatı yeni formata migrate et
                for (const lvl of LEVELS) {
                    if (allVocab[lvl]) {
                        await AsyncStorage.setItem(
                            getVocabularyLevelKey(lvl as Level),
                            JSON.stringify(allVocab[lvl])
                        );
                    }
                }
                await AsyncStorage.removeItem(STORAGE_KEYS.VOCABULARY);
                return allVocab[level];
            }
        }
        
        return [];
    } catch (error) {
        console.error('Error getting stored vocabulary:', error);
        return [];
    }
}

// isVocabularyGenerated — herhangi bir level varsa true
export async function isVocabularyGenerated(): Promise<boolean> {
    try {
        // Yeni format kontrolü
        for (const level of LEVELS) {
            const data = await AsyncStorage.getItem(getVocabularyLevelKey(level));
            if (data) return true;
        }
        // Eski format fallback
        const legacy = await AsyncStorage.getItem(STORAGE_KEYS.VOCABULARY);
        return legacy !== null;
    } catch (error) {
        return false;
    }
}

// clearVocabulary — tüm level anahtarlarını temizle
export async function clearVocabulary(): Promise<void> {
    try {
        const keys = LEVELS.map(l => getVocabularyLevelKey(l));
        keys.push(STORAGE_KEYS.VOCABULARY); // eski anahtar da
        keys.push(NATIVE_LANGUAGE_KEY);
        keys.push(TARGET_LANGUAGE_KEY);
        await AsyncStorage.multiRemove(keys);
    } catch (error) {
        console.error('Error clearing vocabulary:', error);
    }
}
```

**Ayrıca `services/storage.ts` `clearAllLocalData`'ya yeni anahtarları ekle:**
```typescript
// storage.ts — clearAllLocalData içine ekle
...allKeys.filter(key => key.startsWith(STORAGE_KEYS.VOCABULARY + '_')),
```

**Tahmini süre:** 4-6 saat (migration test dahil)  
**Uygulamadaki yapıya etkisi:** `vocabularyService.ts` iç mantığı değişir ama export API aynı kalır — tüm çağıranlar (`notificationService`, `HomeScreen`, `progressService`) aynı fonksiyonları kullanmaya devam eder

---

#### P1-3: iOS Info.plist İzin Açıklamaları
**Risk:** Image picker (profil fotoğrafı) için kamera/galeri izinleri tanımlı değil → App Store reddi  
**Etkilenen dosya:** `app.json`

**Implementasyon:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "VocBee needs camera access to take a profile photo.",
        "NSPhotoLibraryUsageDescription": "VocBee needs photo library access to choose a profile photo."
      }
    },
    "plugins": [
      // mevcut plugin'ler +
      [
        "expo-image-picker",
        {
          "photosPermission": "VocBee needs photo library access to choose a profile photo.",
          "cameraPermission": "VocBee needs camera access to take a profile photo."
        }
      ]
    ]
  }
}
```

**Tahmini süre:** 30 dakika  
**Uygulamadaki yapıya etkisi:** Sadece `app.json` config değişikliği

---

#### P1-4: UI Responsive / fontScale İyileştirmeler
**Risk:** Büyük font ölçeğinde metin taşması, sabit yükseklikli bileşenler  
**Etkilenen dosyalar:** `components/UIComponents.tsx`, `screens/SettingsScreen.tsx`, `screens/SetupScreens.tsx`

**Implementasyon Adımları:**

**UIComponents.tsx:**
```typescript
// ÖNCE:
buttonBase: { height: 56 }
inputWrapper: { height: 56 }

// SONRA:
buttonBase: { minHeight: 56 }  // height → minHeight
inputWrapper: { minHeight: 56 }  // height → minHeight
```

**SetupScreens.tsx ve SettingsScreen.tsx:**
- Sabit `height` değerlerini `minHeight`'a çevir
- `moderateScale()` ile zaten ölçeklenen font boyutları koru
- `SetupScreens.tsx`'teki sabit font boyutlarına (`fontSize: 28`, `fontSize: 16`) `moderateScale` uygula

**Text sayısal overflow koruması:**
```typescript
// Mevcut text alanlarına ekle
numberOfLines={2}
adjustsFontSizeToFit={true}
minimumFontScale={0.7}
```

**Tahmini süre:** 3-5 saat  
**Uygulamadaki yapıya etkisi:** Sadece stil değişiklikleri — mantık değişmiyor

---

### 🟢 P2 — ORTA ÖNCELİK (Yerelleştirme / Kullanılabilirlik)

---

#### P2-1: RTL Desteği
**Risk:** Arapça, Farsça, Urduca kullanan kullanıcılarda bozuk UI  
**Etkilenen dosyalar:** `app.json`, yeni `utils/rtl.ts`, çeşitli ekranlar

**Implementasyon Adımları:**

**Adım 1 — `app.json`:**
```json
{
  "expo": {
    "extra": {
      "supportsRTL": true
    }
  }
}
```

**Adım 2 — RTL utility oluştur:**
```typescript
// utils/rtl.ts
import { I18nManager } from 'react-native';

const RTL_LANGUAGES = ['ar', 'fa', 'ur', 'he'];

export function isRTL(): boolean {
    return I18nManager.isRTL;
}

export function shouldBeRTL(languageCode: string): boolean {
    return RTL_LANGUAGES.includes(languageCode);
}

export function getFlexDirection(): 'row' | 'row-reverse' {
    return I18nManager.isRTL ? 'row-reverse' : 'row';
}

export function getChevronIcon(): string {
    return I18nManager.isRTL ? 'chevron-left' : 'chevron-right';
}
```

**Adım 3 — Kritik bileşenlerde RTL uygula:**
- `UIComponents.tsx`: `Button`, `Header`, `Input` — `flexDirection: getFlexDirection()`
- `SettingsScreen.tsx`: `settingItem` row'ları
- `OnboardingScreen.tsx`: Navigation butonları

**Tahmini süre:** 4-8 saat  
**Uygulamadaki yapıya etkisi:** Style-level değişiklikler + yeni utility dosya

---

#### P2-2: `app.json` supportedLocales Ekleme
**Risk:** iOS per-app language seçimi çalışmayabilir  
**Etkilenen dosya:** `app.json`

```json
{
  "expo": {
    "locales": {
      "en": "./locales/en.ts",
      "tr": "./locales/tr.ts",
      "de": "./locales/de.ts",
      "fr": "./locales/fr.ts",
      "es": "./locales/es.ts",
      "it": "./locales/it.ts",
      "pt": "./locales/pt.ts",
      "ru": "./locales/ru.ts",
      "ja": "./locales/ja.ts",
      "ko": "./locales/ko.ts",
      "zh": "./locales/zh.ts",
      "ar": "./locales/ar.ts",
      "hi": "./locales/hi.ts",
      "id": "./locales/id.ts",
      "fa": "./locales/fa.ts",
      "sr": "./locales/sr.ts",
      "sw": "./locales/sw.ts",
      "th": "./locales/th.ts",
      "ur": "./locales/ur.ts",
      "vi": "./locales/vi.ts",
      "am": "./locales/am.ts"
    }
  }
}
```

**Tahmini süre:** 1 saat  
**Uygulamadaki yapıya etkisi:** Sadece config

---

## BÖLÜM 3: UYGULAMA SIRASI

```
Hafta 1 (Acil):
  ├── P0-1: Groq API proxy (backend deploy)
  ├── P0-2: AdMob UMP/Consent + ATT
  └── P0-3: Android 13+ bildirim izni

Hafta 2 (Yüksek):
  ├── P1-1: Bildirim teslim tespiti iyileştirme
  ├── P1-2: Sözlük verisi level-bazlı bölme
  ├── P1-3: iOS Info.plist izin açıklamaları
  └── P1-4: UI responsive/fontScale düzeltmeleri

Hafta 3 (Orta):
  ├── P2-1: RTL desteği
  └── P2-2: supportedLocales ekleme
```

---

## BÖLÜM 4: HER DEĞİŞİKLİĞİN ETKİ ANALİZİ

| Değişiklik | Etkilenen Dosyalar | Mevcut API Değişir mi? | Breaking Change? |
|---|---|---|---|
| P0-1 Groq proxy | `groqService.ts` | Hayır (iç URL değişir) | Hayır |
| P0-2 UMP/Consent | `adMobService.ts`, `App.tsx`, `app.json` | Yeni export ekleniyor | Hayır |
| P0-3 Android bildirim | `notificationService.ts`, `app.json` | Hayır | Hayır |
| P1-1 Bildirim teslim | `notificationService.ts` | Hayır | Hayır |
| P1-2 Sözlük bölme | `vocabularyService.ts`, `storage.ts`, `storageKeys.ts` | Hayır (migration ile) | Hayır |
| P1-3 iOS izinler | `app.json` | N/A | Hayır |
| P1-4 UI responsive | `UIComponents.tsx`, ekranlar | Hayır (stil) | Hayır |
| P2-1 RTL | Yeni utility + stil | Hayır | Hayır |
| P2-2 Locales | `app.json` | N/A | Hayır |

**Tüm değişiklikler geriye uyumludur.** Mevcut kullanıcı verisi migration ile korunur (özellikle P1-2 sözlük bölme).

---

## BÖLÜM 5: TEST STRATEJİSİ

### P0 Testleri
- [ ] Groq proxy: İstemcide API key olmadığını doğrula (bundle inspect)
- [ ] Groq proxy: Rate limiting sunucu tarafında çalışıyor mu?
- [ ] UMP: EEA simülatör/VPN ile consent form gösteriliyor mu?
- [ ] ATT: iOS 14.5+ cihazda tracking prompt gösteriliyor mu?
- [ ] AdMob: Consent sonrası reklam yükleniyor mu?
- [ ] Android 13 emülatör: Bildirim izin istemi gösteriliyor mu?
- [ ] İzin reddi sonrası `Linking.openSettings()` çalışıyor mu?

### P1 Testleri
- [ ] Bildirim teslim: DND modda bildirim → öğrenildi olarak işaretlenmemiş
- [ ] Bildirim teslim: Normal modda bildirim → doğru işaretleme
- [ ] Sözlük: Eski formattan migration (tek blob → level bazlı)
- [ ] Sözlük: Migration sonrası tüm seviyeler doğru yükleniyor
- [ ] Sözlük: `clearVocabulary()` tüm anahtarları temizliyor
- [ ] UI: Büyük font ölçeğinde (Android: Huge, iOS: AX5) metin taşması yok
- [ ] UI: `UIComponents.tsx` buton/input `minHeight` ile doğru render

### P2 Testleri
- [ ] RTL: Arapça seçildiğinde layout doğru yansıyor
- [ ] RTL: Chevron ikonları doğru yönde
- [ ] Locales: iOS per-app language ayarında tüm diller görünüyor

---

## NOTLAR

1. **`requestNonPersonalizedAdsOnly: true`** şu anda `adMobService.ts`'de hardcoded. UMP consent sonucuna göre dinamik hale getirilmeli.
2. **Firebase Security Rules** ayrıca gözden geçirilmeli (bu rapor kapsamı dışında ancak `config/firebase.ts`'deki açık config ile birlikte önemli).
3. **Mevcut test coverage** korunmalı — her P0/P1 değişikliği için ilgili `__tests__` dosyalarına yeni test eklenmeli.
4. **EAS build** sonrası native modüller (AdMob consent, notification permissions) gerçek cihazda test edilmeli — Expo Go'da çalışmaz.
