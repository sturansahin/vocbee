# 00 — Analiz Metodolojisi

## Amaç
Refactor kararlarının varsayıma değil, repodaki **gerçek koda** dayanmasını sağlamak; analiz sürecinin
tekrar üretilebilir olmasını garanti etmek.

## Analiz kapsamı ve kaynaklar
Zip açıldı (`/vocbee`) ve aşağıdaki gerçek dosyalar incelendi:

- **Yapı/konfig:** `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.test.json`,
  `tsconfig.rules.json`, `app.json`, `eas.json`, `firebase.json`, `.firebaserc`, `metro.config.js`,
  `babel.config.js`, `jest.config.js`, `jest.setup.js`, `vercel.json`, `.gitignore`, `.env.example`.
- **Çekirdek uygulama:** `App.tsx`, `context/*`, `services/*`, `screens/*` (boyut analizi), `components/*`,
  `utils/*`, `config/firebase.ts`, `constants.ts`, `types.ts`.
- **Backend:** `functions/src/index.ts`, `api/deleteAccount.js`, `api/grammarProxy.js`, `proxy/grammar-worker.ts`.
- **Veri/güvenlik:** `firestore.rules`, `assets/vocabulary/*` (105 dosya), `locales/*` (22 dil).
- **Mevcut dokümanlar:** `docs/refactor/00..20` (v1 plan seti).

## Aranan ama bulunamayan dosyalar (önemli)
| Beklenen | Durum | Sonuç |
|---|---|---|
| `CLAUDE.md` | **Yok** | Proje-özel AI kuralı yok; bu doküman seti bağlayıcı kabul kabulleri kendi tanımlar. |
| `README.md` | **Yok** | Onboarding/çalıştırma bilgisi dağınık; `19`/`31` içinde özetlenir. |
| `firestore.indexes.json` | **Yok** | v2 subcollection sorguları için index ihtiyacı `07` içinde tanımlanır. |
| `src/` | **Yok** | Flat kök yapı; hedef `src/` iskeleti `05` içinde. |
| `hooks/` (kök) | **Yok** | Hook'lar ekran/servis içine gömülü; ayrıştırma `04`/`06`. |
| `.github/workflows/*` | **Boş/etkisiz** | Pratikte CI yok; `16` bunu ele alır. |

## Ölçüm yöntemi
- **Dosya boyutu:** `wc -l` ile satır sayısı (büyük dosya tespiti, `01`).
- **Dış sistem sızıntısı:** `grep` ile `firebase/firestore`, `AsyncStorage`, `expo-notifications`,
  `react-native-purchases`, `react-native-google-mobile-ads` import'larının screen/context içinde aranması.
- **Export şişmesi:** servis dosyalarında `export` sayımı (Interface Segregation ihlali tespiti).
- **Storage key envanteri:** `services/storageKeys.ts` + literal key taraması.
- **Firestore yüzeyi:** `doc(`, `setDoc(`, `getDoc(`, `deleteDoc(` çağrılarının dosya bazlı dağılımı.

## Çıktı ilkeleri
1. **Kod değiştirilmez** — yalnızca markdown üretilir.
2. **Gerçek isim referansı** — genel ifade yerine `services/SyncService.ts → syncToFirestore` gibi.
3. **Secret yazılmaz** — değerler maskelenir; yalnızca dosya varlığı/risk raporlanır.
4. **Snapshot tarihliliği** — satır/sayı metrikleri refactor başında yeniden üretilmelidir (`20`).

## Alt-analiz başlıkları (bu set içindeki dağılım)
- screens analizi → `01`, `04`, `11`, `13`
- services analizi → `01`, `06`, `10`, `11`, `12`, `14`
- Firebase/Firestore analizi → `07`, `08`, `09`, `10`
- notification analizi → `12`
- auth/sync analizi → `10`
- storage/cache analizi → `11`
- test/CI analizi → `15`, `16`
- docs uyum analizi → `existing-docs-alignment.md`
