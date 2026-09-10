# VocBee Game rollout runbook

Rollout kaydı: `docs/artifacts/game-phase6-rollout.json`.

## Zorunlu önkoşul

Hiçbir build veya mağaza gönderimi aşağıdaki iki komut başarılı olmadan başlatılmaz:

```bash
npm run game:phase0:check
npm run game:rollout:check -- internal-build
```

Phase 5 kanıtında blocker, eksik artifact provenance veya dirty source varsa rollout durur.

## Aşamalar

1. Internal build

   ```bash
   npx eas build --platform all --profile preview --non-interactive
   ```

   Android ve iOS gerçek cihazlarda test matrisi tamamlanır; iki EAS build ID'si rollout kaydına
   eklenir.

2. Play internal ve TestFlight

   ```bash
   npx eas build --platform all --profile production --non-interactive
   npx eas submit --platform android --profile internal --id <ANDROID_BUILD_ID>
   npx eas submit --platform ios --profile production --id <IOS_BUILD_ID> --groups <INTERNAL_GROUP>
   ```

   Store processing bittikten sonra smoke kanıtları kaydedilir. TestFlight internal test,
   `distribution: store` production build gerektirir; preview/ad-hoc build gönderilmez.

3. Küçük production rollout

   Owner approval ID kaydedilir ve guard tekrar çalıştırılır:

   ```bash
   npm run game:rollout:check -- production-5
   npx eas submit --platform android --profile production-5 --id <ANDROID_BUILD_ID>
   ```

   iOS build App Store Connect'te App Review'a gönderilir ve phased release açılır.

4. Kademeli genişletme

   Her aşama en az 24 saat ve 100 session gözlenir. Crash-free session `%99,5` altına düşerse,
   Android ANR `%0,47` üstüne çıkarsa, game launch error `%1` üstüne çıkarsa veya tek catalog
   mismatch görülürse genişletme yapılmaz.

   ```bash
   npm run game:rollout:check -- production-25
   npm run game:rollout:check -- production-50
   npm run game:rollout:check -- production-100
   ```

## Rollback

Store rollout durdurulur. `game-phase6-rollout.json` içindeki rollback host/Unity commit çifti ve
Phase 5'te kayıtlı artifact hashleri birlikte geri alınır; tek platform artifacti veya yalnız
session schema geri alınmaz. Learned progress silinmez.

