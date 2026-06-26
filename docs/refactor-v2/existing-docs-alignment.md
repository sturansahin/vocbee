# Mevcut Refactor Dokümanları ile Uyum Analizi

Projede `docs/refactor/` altında 21 adet v1 dokümanı mevcut (ör. `00-INDEX.md`, `02-*`, `08-*`, `18-*`, `20-*`).
Aşağıdaki tablo bunların v2 hedef mimarisi ile uyumunu özetler.

| Mevcut doküman (v1) | Ana fikir | Hedef mimariyle uyum | Eksikler | Güncellenmeli | Korunacak iyi kararlar | Çelişen kararlar |
|---|---|---|---|---|---|---|
| `00-INDEX` | v1 yol haritası | Orta | v2 faz/veri modeli yok | v2’ye referans | Faz fikri | — |
| `02-*` (hedef yapı) | `src/app/features/shared` | **Yüksek** | `presentation/application/domain/data` 4-katman yok | 4-katmana yükselt | `src/` + feature-based kararı | Katman granülâritesi daha sığ |
| `08-*` (Firestore/sync notları) | mevcut model + sync sorunları | Orta | progressByLevel/wordProgress migration planı yok | v2 `07`/`08`’e bağla | learnedWords/favorites büyüme uyarısı; stale import tespiti | tek-doc kabulü korunmuş |
| `18-*` (DoD/test) | temel DoD | Orta | migration DoD, over-engineering checklist yok | v2 `18`/`15` | DoD fikri | — |
| `20-*` (faz) | erken faz tanımı | Orta | 16-başlık standardı yok | v2 faz şablonuna geç | aşamalı yaklaşım | — |
| Diğer v1 dokümanları | screens/services notları | Değişken | repository/adapter katmanı az | v2 feature dokümanlarına taşı | dosya sorumluluk analizleri | — |

## Hedefe göre değerlendirme
- **Feature-based mimari anlatılıyor mu?** Kısmen — `src/app/features/shared` var ama feature içi 4-katman yok. v2 bunu netleştirir.
- **presentation/application/domain/data ayrımı?** Yok (v1 `screens/components/hooks/service/types`). v2 ekler.
- **Repository/adapter katmanı?** Çok az / örtük. v2 zorunlu kılar.
- **Firestore Data Model v2?** Yok. v2 `07` ekler.
- **progressByLevel/wordProgress migration planı?** Yok. v2 `07`/`08`/`23` ekler.
- **5500+ local kelime kararı?** v1 koruyor; v2 açıkça teyit eder (`07`).
- **Auth/Profile/Sync eski modele mi bağlı?** v1’de evet; v2 repository + dual-read ile gevşetir (`10`/`24`).
- **Notification mimarisi yüzeysel mi?** v1 yüzeysel; v2 facade + 4 arayüz (`12`/`26`).
- **Roadmap veri modeli migration’ını ayrı faz yapıyor mu?** v1 hayır; v2 Phase 3 olarak ayırır (`23`).
- **Test/CI/DoD yeterli mi?** v1 kısmi; v2 CI (`16`), test piramidi (`15`), DoD (`18`) ile tamamlar.

## Sonuç
v1 dokümanları doğru yönü (feature-based, `src/`) belirlemiş ve bazı gerçek tespitler (stale Firestore import,
Setup’ın doğrudan Firestore yazması, learnedWords büyümesi) içeriyor — bunlar korunur. Ancak katman
derinliği, Firestore v2 modeli, migration ve test/CI açısından eksik. v2 dokümanları v1’i **kapsar ve yükseltir**;
çelişki yok, yalnızca granularite ve veri modeli derinleştirmesi var.
