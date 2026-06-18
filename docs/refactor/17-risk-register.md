# 17 — Risk Register

Bu doküman tüm refactor boyunca izlenecek riskleri tek tabloda toplar. Şiddet (S) ve Olasılık (O):
Düşük/Orta/Yüksek. Öncelik = S × O.

## Veri ve Davranış Koruma Riskleri (en kritik)

| # | Risk | S | O | Azaltım | Tespit |
|---|------|---|---|---------|--------|
| R1 | AsyncStorage anahtar değeri/JSON şekli değişir -> kullanıcı verisi kaybı | Y | O | `storageKeys` tek kaynak; değer shim'le korunur; round-trip + migration testleri (bkz. 11) | typedStorage testleri |
| R2 | Firestore `users/{uid}` alan şekli kayar -> rules reddi / veri kaybı | Y | O | `UserDocPayload` tek kapı; `test:rules` her PR (bkz. 05/13) | emulator testi |
| R3 | Notification schedule sayısı/saati kayar -> yanlış/eksik bildirim | Y | O | golden testler; `MAX_SCHEDULED=64`/`MAX_VOCABULARY=63` sabit (bkz. 06) | golden test |
| R4 | Auth cache-first akışı/device-id kırılır -> oturum düşmesi | Y | O | sıra korunur; karakterizasyon testi (bkz. 05) | entegrasyon testi |
| R5 | Streak/progress hesap mantığı değişir -> seri sıfırlanır | Y | D | servis içi mantık değişmez, sadece konum; mevcut testler (bkz. 07) | streakService.test |
| R6 | Reklam/abonelik akışı kayar -> gelir kaybı / premium'a reklam | Y | O | `canShowAd` saf + test; entitlement `premium` sabit (bkz. 12) | birim testi |
| R7 | Setup `setupCompleted` / initial-route kırılır -> yeni kullanıcı akışı bozulur | Y | O | akış testi; bayrak zamanlaması korunur (bkz. 03/08) | entegrasyon testi |
| R7b | Setup disabled notification payload'ı rules'tan geçmez -> yeni kullanıcı setup kaydı reddedilir | Y | O | `notificationSettings` normalize kararı; `userDoc` tek kapı; setup + rules testi (bkz. 08/13) | emulator + integration |

## Yapısal / Mimari Riskler

| # | Risk | S | O | Azaltım |
|---|------|---|---|---------|
| R8 | Giriş noktası (`App.tsx`/`AppEntry`) taşıma -> uygulama açılmaz | Y | D | kökte `App.tsx` shim; `package.json main` değişmez (bkz. 02/03) |
| R9 | Döngüsel bağımlılık (feature<->feature) | O | O | facade-only import; `shared` tek yönlü (bkz. 02) |
| R10 | `.txt` asset çözümlemesi metro/jest'te kırılır | O | O | `assetLoader` izole; `__mocks__/txtFileMock.js` korunur (bkz. 07) |
| R11 | UIComponents prop API'ı değişir -> tüm ekranlar etkilenir | O | D | facade aynı prop'ları korur (bkz. 09) |
| R12 | Büyük git diff / merge çakışması | O | O | feature başına küçük PR; `git mv` |

## Güvenlik Riskleri

| # | Risk | S | O | Azaltım |
|---|------|---|---|---------|
| R13 | Secret repoya/dokümana sızar | Y | D | secret-scan; dokümana değer yazma yasak (bkz. 13) |
| R14 | Grammar-proxy güvenlik düzeltmesi iki kopyadan birinde unutulur | O | O | ortak core modül (bkz. 13) |
| R15 | Client Firestore yazım yüzeyi genişler | O | O | yazımlar `userDoc` kapısından; rules katı (bkz. 05/08/13) |
| R15b | Public config ile secret karışır | Y | O | env sınıflandırması; tracked client config vs secret ayrımı; secret scan ve rotation planı (bkz. 13/20) |

## Süreç Riskleri

| # | Risk | S | O | Azaltım |
|---|------|---|---|---------|
| R16 | Refactor sırasında ürün özelliği gecikir | O | O | küçük PR'lar; feature bazlı; freeze yok (bkz. 16) |
| R17 | Test edilemez dosyalarda coverage threshold zorlaması PR'ları bloklar | O | O | kademeli threshold; önce refactor+test (bkz. 14) |
| R18 | Golden test mevcut bug'ı "dondurur" | D | O | bug'lar işaretlenir, ayrı PR'da düzeltilir (bkz. 14) |
| R19 | Coverage/build artifact'leri repoya karışır | D | O | `coverage/` ve `**/coverage/` ignore; mevcut `config/coverage` cleanup PR'ı (bkz. 14/16) |

## İzleme

- Her faz sonunda bu register gözden geçirilir; kapanan riskler işaretlenir, yeni riskler eklenir.
- Yüksek öncelikli (R1-R7, R13) riskler için ilgili PR açıklamasında açık "rollback planı" zorunlu.

## Genel Rollback Prensibi

- Her PR tek mantıksal değişiklik + re-export shim ile geriye uyum -> `git revert <PR>` tek adımda geri alır.
- Veri/migration içeren PR'larda: migration idempotent + "forward-only" (eski sürüm yeni veriyi okuyabilmeli).
