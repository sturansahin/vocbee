# 04 — Screen / Component / Hook / Service Sorumluluk Ayrımı

## Mevcut Durum

Ekranlar hem UI hem state hem iş mantığı hem yan etki orkestrasyonu yapıyor. Ölçümler (gerçek):

| Ekran | useState | useEffect | useCallback | AsyncStorage çağrısı | Doğrudan Firestore |
|-------|---------:|----------:|------------:|---------------------:|:-------------------:|
| `screens/HomeScreen.tsx` (2391) | 18 | 11 | 21 | 13 | hayır (service üzerinden) |
| `screens/SettingsScreen.tsx` (2310) | 26 | 8 | 0 | birden çok | **evet** (`doc/setDoc`) |
| `screens/SetupScreens.tsx` (1240) | 13 | 7 | - | birden çok | **evet** (`doc/setDoc`) |
| `screens/AuthScreens.tsx` (876) | 14 | - | - | - | dolaylı (AuthContext) |

Hook katmanı yok. Tek `useDebounce` vb. yardımcı dahi ekran içinde tanımlı. `scale`/`moderateScale`
responsive yardımcıları dört ekranda kopyalanmış.

## Sorunlar

1. **Test edilemezlik:** İş mantığı render ağacına bağlı; saf birim testi yazmak için tüm ekranı mount
   etmek gerekiyor (bu yüzden `jest.config.js` bu ekranları coverage'tan **hariç tutmuş**).
2. **Tekrar:** Aynı davranış (sync tetikleme, ad gösterimi, AsyncStorage okuma) birden çok ekranda kopya.
3. **Katman ihlali:** Ekran -> Firestore doğrudan erişim (`SettingsScreen`, `SetupScreens`).
4. **Değişim riski:** 2000+ satırlık dosyada küçük değişiklik geniş yüzey etkiliyor.

## Önerilen Yaklaşım: 4 katmanlı sorumluluk sözleşmesi

```
screen   -> sadece kompozisyon + layout + navigation; "ne gösterilecek" kararı hook'tan gelir
component-> saf sunum (props in, callback out); yan etki yok
hook     -> ekran<->service köprüsü; state orkestrasyonu; yan etkiler (effect) burada
service  -> saf I/O + iş mantığı; React'a bağımlı değil; doğrudan test edilir
```

**Kural:** UI bileşenleri servisleri **doğrudan çağırmaz**; her zaman bir hook üzerinden. Firestore'a
ekrandan erişim yasak; sadece feature service'i üzerinden (bkz. `05`, `11`).

Örnek (HomeScreen — detay `07`'de):

```
features/learning/
  screens/HomeScreen.tsx                # ~250-400 satır hedef: layout + alt bileşen kompozisyonu
  components/{WordCard,WordCardHeader,HomeHeader,ProgressBar,TutorialOverlay}.tsx
  hooks/{useWordSession,useWordAudio,useHomeProgress,useHomeAds,useTutorial}.ts
  services/{wordSession,...}.ts
```

Örnek hook sözleşmeleri (public API):

```ts
// features/learning/hooks/useWordSession.ts
export function useWordSession(level: Level): {
  current: VocabularyItem | null
  next: () => void
  markLearned: (id: string) => Promise<void>
  loading: boolean
}

// features/learning/hooks/useWordAudio.ts (mevcut expo-speech akışını sarar)
export function useWordAudio(): { speak: (text: string, lang: string) => void; stop: () => void; speaking: boolean }
```

**Paylaşılan responsive hook** (kopyaların yerine):

```ts
// src/shared/hooks/useResponsive.ts  (mevcut scale/moderateScale mantığı birebir taşınır)
export function useResponsive(): { scale: (n:number)=>number; moderateScale:(n:number,f?:number)=>number; width:number; height:number }
```

## Alternatifler ve Neden Elendiler

- **Redux/MobX/Zustand ile global state'e taşı** — Elendi: mevcut state ekran-yereldir; global store
  gereksiz soyutlama getirir. Context (Auth/Theme/Monetization) zaten cross-cutting ihtiyacı karşılıyor.
  Gerekirse ileride sadece spesifik ihtiyaçta değerlendirilir.
- **Container/Presentational katı ayırım (ayrı *Container.tsx)** — Elendi: hook deseni aynı faydayı
  daha az dosyayla sağlar (React'ın idiomatik yolu).
- **Sadece bileşen bölme (hook'suz)** — Elendi: state hala ekranda kalır, test edilemezlik sürer.

## Migration / Implementasyon Adımları

> Strangler-fig: önce **saf, düşük riskli** parçalar çıkarılır; ekran küçültülür.

1. **PR-1 (paylaşılan responsive):** `scale`/`moderateScale` kopyalarını `shared/hooks/useResponsive.ts`'e
   topla; her ekranda yerel tanımı import ile değiştir. Hesap birebir aynı.
   - Komut: `npm run typecheck && npm run test:ci`
2. **PR-2 (saf sunum bileşenleri):** HomeScreen içindeki görsel parçaları (`WordCard`, `ProgressBar`)
   props alan saf bileşenlere çıkar. State henüz ekranda kalır (sadece JSX dışarı alınır).
3. **PR-3 (hook çıkarımı):** `useWordAudio` gibi en izole davranışı hook'a taşı; ekran hook'u tüketir.
4. **PR-4..N:** Sırayla `useWordSession`, `useHomeProgress`, `useHomeAds`, `useTutorial`.
   Her PR'da bir davranış hook'a taşınır; ekran satır sayısı düşer.
5. **PR-Firestore-kapatma:** `SettingsScreen`/`SetupScreens` içindeki doğrudan `setDoc` çağrılarını
   feature service fonksiyonlarına taşı (davranış ve yazılan alanlar aynı; bkz. `05`/`11`).

Her PR sonunda: `npm run typecheck && npm run test:ci`.

## Riskler

- **State'i hook'a taşırken render davranışı değişirse** (ör. effect bağımlılıkları) görünür hata.
  Azaltım: PR başına bir davranış; önce karakterizasyon testi (bkz. `14`).
- **`useCallback` referans eşitliği** ile memoize edilen alt bileşenlerde gereksiz render. Azaltım:
  hook çıkışlarında mevcut memoization korunur.

## Test ve Kabul Kriterleri

- Çıkarılan her hook/service için birim testi (RTL `renderHook` veya saf fonksiyon testi).
- Çıkarılan saf bileşenler `jest.config.js` coverage kapsamına **dahil edilir** (hariç listeden çıkarılır).
- Mevcut `screens/__tests__/HomeScreen.test.tsx` yeşil kalır (davranış değişmedi).

## Etkilenecek Dosyalar

```
screens/HomeScreen.tsx (yerel scale/moderateScale)        -> src/shared/hooks/useResponsive.ts
screens/SettingsScreen.tsx (yerel scale/moderateScale)    -> src/shared/hooks/useResponsive.ts
screens/SetupScreens.tsx (yerel scale/moderateScale)      -> src/shared/hooks/useResponsive.ts
screens/ExampleSentencesScreen.tsx (yerel scale)          -> src/shared/hooks/useResponsive.ts
screens/HomeScreen.tsx (UI parçaları)                      -> src/features/learning/components/*
screens/HomeScreen.tsx (state/effect)                     -> src/features/learning/hooks/*
screens/SettingsScreen.tsx (doğrudan setDoc)              -> src/features/settings/services/* (bkz. 08)
screens/SetupScreens.tsx (doğrudan setDoc)                -> src/features/setup/services/* (bkz. 08)
```
