# 30 — Acceptance Checklist (Genel Kabul)

## Mimari
- [ ] Tüm kod `src/{app,shared,features}` altında; eski yollar (shim sonrası) temizlenmiş.
- [ ] Her feature `presentation/application/domain/data` ayrımına uyuyor (gerektiği kadar).
- [ ] `domain/` dosyalarında 0 SDK import (lint yeşil).
- [ ] Feature’lar yalnızca `index.ts` barrel üzerinden erişiyor; döngüsel import yok.

## Dosya sağlığı
- [ ] HomeScreen, SettingsScreen, SetupScreens, AuthScreens < 400 satır.
- [ ] AuthContext < 200 satır; Firestore import’u yok.
- [ ] notificationService / adMobService / vocabularyService / SyncService sorumluluklara bölünmüş.

## Veri / Firestore
- [ ] `progressByLevel` modeli devrede; dual-read/write doğru çalıştı; migration %100 doğrulanmış.
- [ ] 5500+ kelime local kaldı; her kelime için Firestore doc açılmadı.
- [ ] Eski alanlar yalnızca güvenli pencereden sonra silindi (backup’lı).

## Davranış (regresyon yok)
- [ ] `03`’teki tüm davranışlar birebir korunuyor.
- [ ] Storage key string’leri ve Firestore payload’ı değişmedi.

## Kalite
- [ ] CI (typecheck+test+rules+lint+prettier+secret-scan) yeşil.
- [ ] Riskli domain coverage hedefleri (`15`) tutuyor; exclude listesi daraltıldı.
- [ ] Secret hijyeni (`09`) tamam; `firebase-admin` mobil bundle’dan ayrıldı.

## Güvenlik
- [ ] Repo/zip’te açık secret yok; gitignore güncel; gerekli key’ler rotate edildi.

## Onay
- [ ] Her faz kendi `Kabul kriterleri` + `Manuel QA` ile imzalandı.
- [ ] Açık Kritik/Yüksek risk yok (`17`).


## Implementation-spec kabul kalemleri (v2 — `32`–`39`)
- [ ] Her katman `33` import matrisine uyuyor; `domain/**` 0 SDK import (lint + grep).
- [ ] Her feature `data/` bir repository **interface**'i implemente ediyor; `application` yalnızca interface'e bağımlı (`35`).
- [ ] Adapter'lar `data/`'da; domain DTO/`Timestamp` bilmiyor (`34`/`35`).
- [ ] Firestore v2: `progressByLevel` + dual-read/write çalıştı; rules v2 emulator yeşil (`34`/`37`); migration dry-run %0 mismatched.
- [ ] Shim'ler gerçek export biçimine uygun (default/named/karışık, `36`); Phase 9'da tamamı silindi.
- [ ] CI gate'leri (`38` §8): typecheck+lint+test:ci+test:rules+audit+secret-scan yeşil.
- [ ] Her büyük dosya `39` PR kırılımıyla küçük PR'lara bölünerek taşındı.
- [ ] Tüm kod blokları dokümanlarda **skeleton/spec** olarak işaretli; kaynak kod yalnızca onaylı refactor fazında değişti.
