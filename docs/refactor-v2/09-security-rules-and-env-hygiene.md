# 09 — Security Rules ve Env/Secret Hijyeni

> Bu aşamada `firestore.rules` DEĞİŞTİRİLMEZ. Aşağısı plan ve risk raporudur. Gerçek secret değerleri YAZILMAZ.

## A. Security rules durumu
- `firestore.rules` katı: `validUserDocument` `hasOnly` ile alanları sınırlıyor; dil/level/frequency doğrulama var.
- Catch-all `match /{document=**} { allow read, write: if false }` — iyi varsayılan.
- `tests/firestoreRules.ts` mevcut (emulator). Korunur ve `15`/`16`’da genişletilir.

### v2 için rules planı (uygulanmayacak, planlanacak)
- Yeni `match /users/{uid}/progressByLevel/{level}` → `allow read, write: if request.auth.uid == uid` + alan tip doğrulaması.
- (Açılırsa) `wordProgress`, `favorites`, `sessions` için aynı sahiplik kuralı.
- Dual-write penceresinde ana doc kuralları korunur; `schemaVersion` alanı `hasOnly` listesine eklenir.
- `firestore.indexes.json` yok → v2’de gerekirse (sessions/wordProgress) eklenir; şimdilik gerekmez.

## B. Secret / env hijyeni (RAPOR — değerler yazılmaz)
| Öğe | Konum | Risk | Öneri |
|---|---|---|---|
| Firebase web config | `config/firebase.ts` (hardcoded) | Düşük-orta (web config public sayılır ama repoda olmamalı) | env’e taşı, `app.config` extra ile ver |
| RevenueCat iOS public key | `eas.json` | Düşük (public SDK key) ama görünür | EAS secret / env değişkeni |
| `GoogleService-Info.plist`, `google-services.json` | kök | Orta | gitignore + EAS’e secure file olarak |
| `.env`, `.env.local` | kök | **Yüksek** (zip’te) | repodan çıkar, gitignore, rotate değerlendir |
| Service account / admin key | (varsa) | **Kritik** | asla repoda; rotate |
| `firebase-debug.log`, `coverage/`, `.idea/`, `.vercel/` | kök | Hijyen | gitignore + temizle |

### `firebase-admin` mobil dependency riski
- `firebase-admin ^13.6.0` mobil `dependencies` içinde. Admin SDK yalnızca sunucu (Vercel `api/`, `functions/`) içindir.
- **Öneri:** admin’i mobil bundle’dan ayır; `functions/` ve `api/` kendi `package.json`’ında tutsun. Mobil tarafta yalnızca Firebase Web SDK.
- Risk: yanlışlıkla admin kodu/credential’ın istemciye sızması; bundle şişmesi.

## C. `.gitignore` önerileri (plan)
```
.env*
GoogleService-Info.plist
google-services.json
*.keystore
*.jks
firebase-debug.log
coverage/
config/coverage/
.idea/
.vercel/
```

## D. Secret scanning
- CI’ye `gitleaks`/`trufflehog` adımı (`16`).
- Geçmişte commit’lenmiş secret varsa: rotate + `git filter-repo` ile geçmiş temizleme (ayrı planlı iş).

## Kabul kriterleri
- Hiçbir gerçek key/secret dokümanda yok.
- Secret’ler env/EAS secret’e taşınmış, gitignore güncel, CI secret-scan yeşil.
- `firebase-admin` mobil bundle’dan ayrışmış.


---

## Implementation-spec detayları (v2 — `32`–`39`)
- **Rules v2 skeleton (UYGULANMAZ, plan):** `34-firestore-types-rules-migration-spec.md` §7 — `validProgressByLevel` + `match /users/{userId}/progressByLevel/{level}` (`isOwner` + tip doğrulaması); ana doc `hasOnly` listesine `schemaVersion`/`lastActiveAt`/`progressSummary` eklenmesi; catch-all `false` KORUNUR. Rules genişletmesi dual-write açılmadan ÖNCE deploy edilmeli (`34` §7 sıra notu).
- **Secret scanning + CI:** `38-ci-eslint-alias-config-spec.md` §6-7 (gitleaks job + `.gitignore` sertleştirme). Bu dokümanlara hiçbir gerçek key/secret/OAuth client id değeri YAZILMAZ — yalnızca dosya adı/risk.
- **`firebase-admin` ayrımı (R7):** mobil `dependencies`'ten çıkar; yalnızca `functions/`+`api/`. Migration script'i de admin SDK ile sunucuda çalışır (`34` §6).
- **Emulator rules testi:** mevcut `tests/firestoreRules.ts` desenine ek (`37` §5); komut `npm run test:rules`.
