# Firestore Progress v2 — Güvenli Rollout

## Karar

Yeni ilerleme modeli ayrı bir top-level collection yerine kullanıcı belgesinin altında tutulur:

```text
users/{uid}
  activeLevel
  schemaVersion = 2
  progressSummary
  progressMigration
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
- Eski uygulamaların legacy yazımlarını `mirrorLegacyProgressToV2` Cloud Function'ı kopyalar. Dönüşüm duplicate,
  geçersiz word id veya bilinmeyen seviye görürse veri düşürmeden durur; loglarda yalnız SHA-256 tabanlı redacted
  kimlik bulunur.
- Firestore rules v2 ana alanlarını ve yalnız owner erişimli `progressByLevel` belgelerini doğrular.
  `progressMigration` yalnız Admin SDK/Cloud Function tarafından yönetilebilir.
- Hesap silme endpoint'i recursive delete kullanır. İstemci fallback'i bilinen alt koleksiyon belgelerini ana
  belgeyle aynı batch içinde siler.
- Cleanup doğrulayıcısı yeni `lastWordId`, vocabulary schema ve doc version 2 kontratını zorunlu tutar.

## Production rollout sırası

Bu sıra değiştirilemez; her adım önce staging/emulator kanıtı, sonra ayrı production onayı gerektirir:

1. Ayrı staging Firebase projesi oluştur ve rules + function + uygulama akışını orada doğrula.
2. Production backup/export al; ayrı hedefe restore ederek geri dönüşü kanıtla.
3. Firestore rules'ı deploy et. Mevcut legacy istemci CRUD smoke testini yap.
4. Mirror function'ı deploy et. Legacy yazım -> beş v2 belge + summary testini gözle.
5. Backfill'i önce salt-okunur dry-run, sonra copy-only modda küçük canary grup için çalıştır.
6. Uyumsuzluk sıfırsa backfill'i tamamla; legacy alanı koru.
7. Yeni uygulamayı önce küçük yüzdeyle `dual` modda dağıt; hata, mismatch ve v2 adoption metriklerini izle.
8. İki uygulama sürümü ve en az 90 günlük compatibility penceresi boyunca dual write/mirror açık kalsın.
9. Eski aktif istemci kalmadığı, restore kanıtının güncel olduğu ve dry-run mismatch sayısının sıfır olduğu
   doğrulandıktan sonra ayrı ikinci owner onayıyla legacy cleanup değerlendirilsin.

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
- Production `(default)` için günlük ve 14 gün saklamalı managed backup schedule oluşturma denemesi, production
  billing kapalı olduğu için Firebase tarafından reddedildi. Son kontrolde schedule `0`, backup `0` kaldı.
- Firestore managed backup restore işlemi staging projesine çapraz restore değildir; backup'ın ait olduğu proje
  içinde yeni bir database oluşturur. Bu nedenle restore kanıtı, ilk production backup oluştuktan sonra
  `vocbee-6fe24` içinde izole ve isimlendirilmiş yeni bir database'e yapılacaktır. Kaynaklar:
  [Firebase managed backups](https://firebase.google.com/docs/firestore/enterprise/backups),
  [Firestore restore API](https://docs.cloud.google.com/firestore/docs/reference/rest/v1/projects.databases/restore).

PII'siz operasyon kanıtı:
`docs/refactor-v2/artifacts/progress-v2-staging-bootstrap-evidence.json`.

## Mevcut gate

Kod, rules, local/emulator hazırlığı ve staging rules deploy'u tamamlanmıştır; production rollout hâlâ kapalıdır.
Devam için owner'ın staging projesini Blaze'e yükseltmesi ve production projesinde billing'i etkinleştirmesi gerekir.
Bunlar tamamlandıktan sonra sıra: staging mirror deploy + sentetik legacy-write smoke, production günlük backup'ın
oluşmasını bekleme, backup'ı aynı production projesindeki izole named database'e restore etme ve metadata/rollback
kanıtı üretmedir. Dedicated migration identity, backup/restore kanıtı ve staging function smoke tamamlanmadan
production rules/function deploy, remote user read, backfill veya cleanup çalıştırılmaz. Safe default `legacy` kalır.
