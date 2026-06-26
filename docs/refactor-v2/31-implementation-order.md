# 31 — Uygulama Sırası

## Sıralı akış (her adım bir önceki bitmeden başlamaz)
```
Phase 0  Safety baseline          → 20
Phase 1  src/ iskelet + shared     → 21
Phase 2  app bootstrap             → 22
Phase 3  Firestore model + migr.   → 23   (kritik veri fazı)
Phase 4  Auth/Profile/Sync         → 24
Phase 5  Learning/Home             → 25
Phase 6  Notifications             → 26
Phase 7  Settings/Onboarding       → 27
Phase 8  Monetization              → 28
Phase 9  Cleanup/hardening         → 29
```

## Bağımlılık gerekçeleri
- 0→1→2: emniyet → iskelet → bootstrap (her şey buna dayanır).
- 3 önce 4-5: progress repository v2 olmadan auth/sync ve learning v2’ye bağlanamaz.
- 4 önce 5: learning, auth/profil ve sync repository’sine dayanır.
- 6 (notifications) 2 (lifecycle) + 4 (notificationSettings)’e dayanır.
- 7 (settings) 4+6’ya dayanır (profil + bildirim ayarı section’ları).
- 8 (monetization) görece izole; 2+5 sonrası.
- 9 en sonda: shim ve eski alan temizliği her şey doğrulandıktan sonra.

## Her faz için döngü
1. Faz dokümanını (16 başlık) gözden geçir.
2. Küçük PR’lar halinde uygula (shim ile).
3. Testleri + QA checklist’i tamamla.
4. `18` DoD ve faz `Kabul kriterleri`ni doğrula.
5. `17` risklerini güncelle.
6. Açık Kritik/Yüksek risk yoksa sonraki faza geç.

## Önemli kural
Bu doküman seti yalnızca **plan**dır. Geliştirme (kod yazma/taşıma/migration çalıştırma) için
kullanıcıdan açık onay alınmadan hiçbir faz uygulanmaz.


## Implementation-spec okuma + karar sırası (v2 — `32`–`39`)
Her faz başlamadan önce `32-implementation-spec-index.md` §3 tablosundaki spec'ler okunur. Zorunlu ön okuma (`32` §4):
`03` (davranış) → `02`+`05` (hedef yapı) → `33` (katman/import) → `34`+`35` (veri+repository) → `18` (DoD) → faz dokümanı + `39`.

Kod yazarken karar sırası (`32` §5): feature? → katman? → import izni (`33`)? → SDK mı (data+repository `35`)? → saf kural mı (domain)? →
Firestore şekli değişiyor mu (`34`)? → eski yol kırılır mı (shim `36`)? → test (`37`)? → PR çok mu büyük (`39`)?

Kararsız kalınca (`32` §6): en kısıtlı katmanı seç; over-engineering checklist (`06`/`18`); davranış değişecekse DUR (`03`).

> Bağlayıcı kural değişmedi: bu set yalnızca **plan + spec**tir; kod yazma/taşıma/migration çalıştırma için kullanıcıdan
> açık onay alınmadan hiçbir faz uygulanmaz.
