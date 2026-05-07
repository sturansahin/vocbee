# VocBee Production Release Checklist

## Build health

- [ ] npm ci clean install
- [ ] npx tsc --noEmit yesil
- [ ] npm test -- --runInBand yesil
- [ ] functions npm run lint/build yesil veya functions kaldirildi
- [ ] npm audit production icin kabul edilebilir seviyede ve documented

## Security

- [ ] Firestore rules deployed and emulator-tested
- [ ] App Check enabled for Firestore/Functions where supported
- [ ] Grammar proxy auth/rate-limit/schema/timeout/generic-error implemented
- [ ] No server secrets in EXPO_PUBLIC or client bundle
- [ ] Dependency critical/high vulnerabilities fixed or formally accepted with mitigation

## Data integrity

- [ ] Sync failure propagation tested
- [ ] Conflict resolution tested across two devices
- [ ] Logout/delete/reinstall flows tested
- [ ] Offline -> online queue tested
- [ ] Account deletion idempotent and reauth-safe

## Monetization/ads

- [ ] RevenueCat iOS and Android keys set
- [ ] Entitlement id ad_free verified
- [ ] Purchase/restore/customer center tested
- [ ] AdMob app ids/ad unit ids verified
- [ ] UMP/ATT consent flows tested

## UI/UX

- [ ] Small/large screen snapshots
- [ ] Tablet support decision documented
- [ ] Large text accessibility tested
- [ ] Dark/light mode tested
- [ ] RTL Arabic/Farsi/Urdu tested after app reload
- [ ] Offline banner accessibility tested

## Localization/legal

- [ ] All hardcoded user strings extracted
- [ ] Same-as-English list reviewed by native speakers
- [ ] In-app privacy copy aligned with privacy policy
- [ ] Store permission descriptions aligned with actual features


## Go/No-Go

- [ ] P0 bulgular kapatildi.
- [ ] P1 bulgular icin fix veya kabul edilmis risk dokumani var.
- [ ] Store internal test build iOS ve Android smoke testlerden gecti.
- [ ] Firebase/RevenueCat/AdMob/Groq dashboard ayarlari production ortaminda dogrulandi.
