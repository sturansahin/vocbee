# 18 — Definition of Done (DoD)

## Her PR için
- [ ] `npm run typecheck` (+ test/rules/worker) yeşil.
- [ ] `npm run test:ci` yeşil; yeni domain kodu testli.
- [ ] ESLint + Prettier yeşil; `import/no-cycle` ve katman sınır kuralı ihlali yok.
- [ ] `domain/` dosyalarında SDK import’u yok.
- [ ] Davranış değişmedi (`03` sözleşmesine göre); storage key’leri ve Firestore payload’ı korunmuş.
- [ ] Eski yollar shim ile çalışıyor (kademeli geçiş).
- [ ] Secret eklenmedi; gitignore korunuyor.

## Her faz için
- [ ] Faz dokümanındaki 16 başlığın kabul kriterleri karşılandı.
- [ ] Manuel QA checklist tamamlandı.
- [ ] Riskler (`17`) güncellendi; açık Kritik/Yüksek yok.
- [ ] Coverage eşiği düşmedi; exclude listesi daraltıldı.

## Over-engineering kontrolü (her pattern uygulanırken)
- [ ] Pattern’in >1 gerçek tüketicisi/varyantı var mı? Yoksa uygulama.
- [ ] Soyutlama mevcut somut bir riski azaltıyor mu? (`06`)
- [ ] Hipotetik gelecek özellik için soyutlama yapılmadı.

## Migration özel (Phase 3)
- [ ] Backup alındı ve doğrulandı.
- [ ] Dry-run %0 uyumsuz.
- [ ] Rastgele kullanıcı doğrulama geçti.
- [ ] Eski alanlar henüz silinmedi.
