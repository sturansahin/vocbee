# 19 — Definition of Done Checklist'leri

Bu doküman her PR ve her faz için "bitti" tanımını verir. Bir madde işaretlenemiyorsa iş bitmemiştir.

## A) Her PR için DoD (genel)

- [ ] Tek mantıksal değişiklik (PR/commit boyutunda); başlık açıklayıcı.
- [ ] Davranış değişmedi (veya değiştiği açıkça yazıldı ve onaylandı).
- [ ] `npm run typecheck` yeşil.
- [ ] `npm run typecheck:test` yeşil.
- [ ] `npm run test:ci` yeşil; coverage threshold düşmedi.
- [ ] Taşınan dosyalar için `eski yol -> yeni yol` PR açıklamasında listelendi.
- [ ] Geriye uyum gerekiyorsa re-export shim eklendi.
- [ ] Rollback planı yazıldı (genelde `git revert <PR>`).
- [ ] Yeni paket eklenmediyse onaylandı; eklendiyse gerekçe + Expo uyumu yazıldı.
- [ ] Secret/anahtar/`.env`/plist değeri koda veya dokümana sızmadı.

## B) Veri/Storage'a dokunan PR için ek DoD

- [ ] AsyncStorage anahtar **değerleri değişmedi** (`storageKeys` tek kaynak).
- [ ] JSON şekli korundu; `typedStorage` tipi mevcut şekille uyumlu.
- [ ] Migration eklendiyse: idempotent + eski-format fixture testi yeşil.
- [ ] Round-trip testi (get/set) yeşil.

## C) Firestore/Rules'a dokunan PR için ek DoD

- [ ] Yazılan alanlar `firestore.rules` izinli alan listesiyle birebir.
- [ ] `npm run typecheck:rules` yeşil.
- [ ] `npm run test:rules` (emulator) yeşil; izinsiz alan reddediliyor.
- [ ] Client yazımı `shared/firebase/userDoc.ts` kapısından geçiyor (doğrudan `setDoc` yok).

## D) Notification'a dokunan PR için ek DoD

- [ ] Golden testler yeşil (slot zamanları, içerik, `MAX_SCHEDULED=64`/`MAX_VOCABULARY=63`).
- [ ] Android kanal id'leri (`vocabulary`/`streak`) değişmedi.
- [ ] `NOTIFICATION_CONTENT_VERSION` ve izinli frekanslar `[60,120,180,360,1440]` korundu.
- [ ] Permission gate sırası korundu.

## E) Monetization'a dokunan PR için ek DoD

- [ ] Entitlement id `premium` değişmedi; premium -> reklamsiz davranışı korundu.
- [ ] App-open "her 3. açılış" davranışı korundu (`canShowAd`/launch-counter testi).
- [ ] Consent (UMP) + ATT sırası korundu; Expo Go lazy-load guardı çalışıyor.
- [ ] Test ad id'leri prod'a sızmıyor (`__DEV__` ayrımı).

## F) Backend (functions/worker/api) PR için ek DoD

- [ ] `npm run typecheck:worker` yeşil.
- [ ] `npm --prefix functions run build` yeşil.
- [ ] `npm --prefix functions run lint` yeşil.
- [ ] Grammar-proxy güvenlik mantığı (token-verify, rate-limit 10/60s, injection-guard) korundu.

## G) Auth akışına dokunan PR için ek DoD

- [ ] Cache-first açılış davranışı korundu (çevrimdışı -> cache'ten profil).
- [ ] device-id (`@vocbee_device_id`) çakışma davranışı korundu.
- [ ] signIn/signUp/signOut ve hesap silme akışı testle doğrulandı.

## H) Faz sonu DoD

- [ ] Faz kapsamındaki tüm PR'lar merge edildi; CI matrisi yeşil.
- [ ] Faz hedefi (ör. "App.tsx lifecycle ayrıldı") karşılandı.
- [ ] `17-risk-register.md` güncellendi (kapanan/yeni riskler).
- [ ] `collectCoverageFrom` hariç listesi (varsa) kısaltıldı; coverage threshold yükseltildi.
- [ ] Etkilenen doküman(lar) "Mevcut Durum" bölümü gerçeğe göre güncellendi.

## I) Refactor sonu (proje) DoD

- [ ] Re-export shim'leri kaldırıldı; importlar `@features`/`@shared`/`@app` alias'larını kullanıyor.
- [ ] Hariç coverage listesi minimumda (sadece native-only sarıcılar).
- [ ] Tüm typecheck varyantları + `test:ci` + `test:rules` yeşil.
- [ ] Kullanıcı verisi ve tüm kritik akışlar (auth, sync, notif, streak, abonelik, reklam) regresyonsuz.
