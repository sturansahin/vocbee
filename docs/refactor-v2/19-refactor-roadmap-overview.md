# 19 — Refactor Roadmap Genel Bakış

## Faz haritası
| Faz | Ad | Ana çıktı | Dok |
|---|---|---|---|
| 0 | Safety baseline | branch, backup, CI, secret hijyeni, baseline typecheck/test | 20 |
| 1 | `src/` iskelet + shared | app/shared/features iskelet, alias, shared taşıma (shim) | 21 |
| 2 | App bootstrap | providers/navigation/lifecycle ayrımı (App.tsx küçült) | 22 |
| 3 | Firestore model + migration prep | progressByLevel, dual-read/write, dry-run, rules planı | 23 |
| 4 | Auth/Profile/Sync | AuthContext küçült, repository/application ayrımı | 24 |
| 5 | Learning/Home | HomeScreen parçala, vocabulary/progress repository, domain rules | 25 |
| 6 | Notifications | facade + permission/scheduler/response/tracking ayrımı | 26 |
| 7 | Settings/Onboarding | Settings/Setup section/hook ayrımı | 27 |
| 8 | Monetization | RevenueCat/AdMob ayrımı, gating rules | 28 |
| 9 | Cleanup/hardening | dead code, shim sil, eski Firestore alan temizliği, perf, CI | 29 |

## Sıralama gerekçesi
- Önce emniyet (0) ve altyapı (1-2): geri kalan her şey buna dayanır.
- Veri modeli (3) auth/sync (4) ve learning (5)’ten önce: progress repository v2’ye dayanır.
- Riskli/yoğun dosyalar (notification 6, settings 7) altyapı oturduktan sonra.
- Monetization (8) görece izole, sona yakın.
- Cleanup (9) en sonda; shim ve eski Firestore alanları ancak her şey doğrulandıktan sonra silinir.

## İlke
- Her faz bağımsız merge edilebilir ve geri alınabilir (shim).
- Bir faz bitmeden (kabul kriterleri + QA + risk) sonrakine geçilmez (`31`).
- Detaylı uygulama sırası `31`’de.
