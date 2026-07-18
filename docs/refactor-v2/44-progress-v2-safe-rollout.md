# Firestore Progress v2 — Güvenli Rollout

## Karar

Yeni ilerleme modeli ayrı bir top-level collection yerine kullanıcı belgesinin altında tutulur:

```text
users/{uid}
  activeLevel
  schemaVersion = 2
  progressSummary
  progressMigration      # yalnız ilerideki Admin backfill audit'i için opsiyonel
  progress              # compatibility window boyunca korunur

users/{uid}/progressByLevel/{A1|A2|B1|B2|C1}
  learnedWordIds
  lastWordId
  learnedCount
  vocabularySchemaVersion
  updatedAt
  updatedByDeviceId
  version = 2
```

Bu yerleşim kullanıcı sahipliğini ve security-rule kontrolünü basit tutar. `favorites`, `streak`, profil ve
notification alanları bu geçişte taşınmaz. Legacy `lastWordIndex` alanının gerçekte index değil kelime kimliği
tuttuğu açıklaştırılarak v2'de `lastWordId` adı kullanılır.

## Uygulanan güvenlik katmanları

- Mobil uygulama varsayılan olarak `legacy` modundadır. Yalnız
  `EXPO_PUBLIC_PROGRESS_SYNC_MODE=dual` değeri atomik legacy + v2 batch yazımını ve v2 okumayı açar.
- Dual write ana kullanıcı belgesi ile beş seviye belgesini tek Firestore batch'inde yazar; legacy alanı silmez.
- Dual read yalnız tam, geçerli ve legacy'den eski olmayan v2 setini tercih eder. Eksik/eski v2 seti retained
  legacy veriden yeniden oluşturulur.
- Eski uygulama yalnız legacy alanı güncellerse v2 geçici olarak eski kalabilir. Yeni uygulamanın bir sonraki
  authenticated sync'i `progress.lastSync` ile en eski v2 `updatedAt` değerini karşılaştırır; legacy daha yeniyse
  beş v2 belgeyi ve summary'yi yeniden oluşturur. Repair bir Firestore transaction'ında legacy ana belgeyi ve beş
  v2 belgeyi tekrar okur; eşzamanlı eski-client yazımında otomatik retry olur. Transaction legacy `progress` alanını
  yazmaz veya silmez.
- Reconciliation duplicate, geçersiz word id veya bilinmeyen seviye görürse fail-closed durur; malformed legacy
  veriyi normalize ederek uzaktan yazmaz.
- Firestore rules v2 ana alanlarını ve yalnız owner erişimli `progressByLevel` belgelerini doğrular.
  Opsiyonel `progressMigration` yalnız ilerideki dedicated Admin backfill tarafından yönetilebilir.
- Hesap silme endpoint'i recursive delete kullanır. İstemci fallback'i bilinen alt koleksiyon belgelerini ana
  belgeyle aynı batch içinde siler.
- Cleanup doğrulayıcısı yeni `lastWordId`, vocabulary schema ve doc version 2 kontratını zorunlu tutar.

## Production rollout sırası

Bu sıra değiştirilemez; her adım önce staging/emulator kanıtı, sonra ayrı production onayı gerektirir:

1. Ayrı staging Firebase projesi oluştur ve rules + client uygulama akışını orada doğrula.
2. Production backup/export al; ayrı hedefe restore ederek geri dönüşü kanıtla.
3. Firestore rules'ı deploy et. Mevcut legacy istemci CRUD smoke testini yap.
4. Staging'de dual client write, legacy-only client write simülasyonu ve sonraki client reconciliation smoke'unu yap.
5. Yeni uygulamayı önce küçük yüzdeyle `dual` modda dağıt; hata, mismatch ve v2 adoption metriklerini izle.
6. Backfill gerekliyse önce salt-okunur dry-run, sonra copy-only modda küçük canary grup için çalıştır.
7. Uyumsuzluk sıfırsa backfill'i tamamla; legacy alanı her durumda koru.
8. İki uygulama sürümü ve en az 90 günlük compatibility penceresi boyunca dual write ve reconciliation açık kalsın.
9. Legacy cleanup bu rollout'un parçası değildir. `users/{uid}.progress` ancak owner'ın ileride vereceği yeni,
   hedefe özgü ve destructive ikinci onayla tekrar değerlendirilebilir; mevcut karar alanı korumaktır.

## 2026-07-18 staging bootstrap sonucu

- Ayrı `vocbee-staging-6fe24` Firebase projesi oluşturuldu.
- Staging `(default)` Firestore veritabanı production ile aynı `eur3` bölgesinde, Standard/Native edition ve
  delete protection açık olarak oluşturuldu.
- `firestore.googleapis.com` yalnız staging projesinde etkinleştirildi ve mevcut `firestore.rules` staging'e
  başarıyla deploy edildi.
- Staging project ID cleanup aracının yalnız `staging` environment allowlist'ine kaydedildi; bu kayıt kendi başına
  remote komut çalıştırmaz ve credential/backup/approval gate'lerini gevşetmez.
- Yalnız `mirrorLegacyProgressToV2` fonksiyonunun staging deploy'u denendi. Predeploy lint/build PASS oldu; staging
  Blaze planında olmadığı için `cloudbuild.googleapis.com` etkinleştirilmeden Firebase tarafından durduruldu.
- Bu başarısız deploy tarihsel operasyon kanıtı olarak kalır. Owner kararıyla Function yaklaşımı kaldırıldı;
  staging Blaze yükseltmesi artık progress-v2 rollout önkoşulu değildir.
- Production `(default)` için günlük ve 14 gün saklamalı managed backup schedule oluşturma denemesi, production
  billing kapalı olduğu için Firebase tarafından reddedildi. Son kontrolde schedule `0`, backup `0` kaldı.
- Firestore managed backup restore işlemi staging projesine çapraz restore değildir; backup'ın ait olduğu proje
  içinde yeni bir database oluşturur. Bu nedenle restore kanıtı, ilk production backup oluştuktan sonra
  `vocbee-6fe24` içinde izole ve isimlendirilmiş yeni bir database'e yapılacaktır. Kaynaklar:
  [Firebase managed backups](https://firebase.google.com/docs/firestore/enterprise/backups),
  [Firestore restore API](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases/restore).

PII'siz operasyon kanıtı:
`docs/refactor-v2/artifacts/progress-v2-staging-bootstrap-evidence.json`. Function'ı supersede eden client kararı:
`docs/refactor-v2/artifacts/progress-v2-client-reconciliation-decision.json`.

## Mevcut gate

Kod, rules, client reconciliation testleri ve staging rules hazırlığı tamamlanmıştır; production rollout hâlâ
kapalıdır. Staging için Blaze gerekmez. Devam sırası staging client smoke, production billing etkinleştikten sonra
günlük backup'ın oluşması, backup'ın aynı production projesindeki izole named database'e restore edilmesi ve
metadata/rollback kanıtıdır. Dedicated migration identity yalnız copy-only backfill çalıştırılırsa gerekir.
Backup/restore ve staging client smoke tamamlanmadan production rules/app rollout, remote user read, backfill veya
cleanup çalıştırılmaz. Function kaldırıldıktan sonraki rules farkı yalnız kullanılmayan Admin backfill metadata
şeklini sadeleştirir; client v2 kontratı staging'de daha önce deploy edilen rules ile aynıdır. Güncel rules redeploy'u
Firebase Rules endpoint DNS timeout'u nedeniyle beklemektedir ve staging smoke öncesi tekrar çalıştırılacaktır.
Safe default `legacy` kalır ve legacy alanın silinmesi mevcut kapsamda yasaktır.
