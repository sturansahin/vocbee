# VocBee Teknik İnceleme Özeti

## Yönetici Özeti
Öne çıkan riskler: bildirim “teslim” tespitinin OS teyidi olmadan zaman damgasına dayanması, iOS’ta entity["company","Google AdMob","google mobile ads platform"] + ATT/UMP rıza konfigürasyonu, ve iOS kamera/galeri izin açıklamalarının app config’te net olmaması. citeturn0search6turn1search1turn1search7

## Kritik P0 Bulgular
Android 13+ için `POST_NOTIFICATIONS` runtime izin akışı doğru kurgulanmalı. citeturn0search0turn0search1  
iOS’ta izleme/açıklama metni (Info.plist) ve rıza yönetimi olmadan kişiselleştirilmiş reklam riski vardır. citeturn1search7turn1search9  
Bildirim mantığında `scheduledTime<now ⇒ delivered` varsayımı (DND/izin kapalı/batarya kısıtı) yanlış “öğrenildi” işaretlemeye yol açabilir. citeturn0search3

## Teslimler
PDF: sandbox:/mnt/data/vocbee_audit_report.pdf  
Markdown: sandbox:/mnt/data/vocbee_audit_report.md  
Örnek yamalar: sandbox:/mnt/data/vocbee_example_patches.diff

## Kapsam Notları
Varsayımlar: Android 12+ ve iOS 15+; GDPR/KVKK dikkate alındı. Ayrıntılı bulgular, test senaryoları ve süre tahminleri dosyalardadır.