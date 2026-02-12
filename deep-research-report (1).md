# VocBee React Native Expo Uygulaması Derin Teknik İnceleme Raporu

## Yönetici Özeti
Paylaşılan kod paketinde **en kritik risk**, `.env` içinde **`EXPO_PUBLIC_*` ile işaretlenmiş bir Groq API anahtarının** bulunmasıdır; Expo dokümantasyonu bu tür değişkenlerin **derlenmiş uygulama bundle’ına düz metin olarak gömüldüğünü** ve **gizli bilgi saklanmaması gerektiğini** açıkça belirtir. citeturn0search2 Bu, anahtarın kötüye kullanımı, maliyet artışı ve servis engeli riski doğurur. citeturn0search2

İkinci büyük risk kümesi: **reklam/izleme rızası (EEA/UK UMP + iOS ATT)** ve **Android 13+ bildirim izni**. Android 13 (API 33) ve üstünde bildirim göndermek için `POST_NOTIFICATIONS` çalışma zamanı izni gerekir; aksi hâlde bildirim akışı sessizce bozulabilir. citeturn0search0turn0search1 AdMob tarafında ise `react-native-google-mobile-ads` dokümanı, EEA/UK rızası (CMP/UMP) ve gerekli bayrakların **Mobile Ads SDK initialize edilmeden önce** ele alınmasını vurgular. citeturn7search0turn14view0turn6search0 iOS’ta “tracking” kapsamına giren senaryolarda ATT gereklilikleri ayrıca değerlendirilmelidir. citeturn1search2

Performans açısından öne çıkan risk: sözlük verisinin **tek büyük JSON blob** olarak AsyncStorage’da saklanması. AsyncStorage’ın Android’de **toplam (~6MB varsayılan) ve tek kayıt (~2MB civarı)** limitleri vardır; büyük veriyle bozulma ve performans sorunları görülebilir. citeturn11search0turn9search5

## Kapsam, Varsayımlar ve İnceleme Notları
İnceleme; `App.tsx`, `app.json`, `.env`, `context/*`, `components/*`, `config/firebase.ts` ve `coverage/lcov-report/**` altında bulunan ekran/servis kaynaklarının statik analiziyle yapılmıştır. Kod paketinde bazı çekirdek klasörlerin (ör. `screens/`, `services/`) doğrudan görünmemesi; buna karşılık coverage raporunda yer alması, **paylaşılan ZIP’in “derlenebilir tam kaynak” değil** bir “çıktı/snapshot” niteliğinde olabileceğini düşündürür (bu durum raporda “paket bütünlüğü” bulgusu olarak ele alınmıştır).

Varsayılan hedefler: Android 12+ ve iOS 15+. GDPR/KVKK dikkate alınmıştır (reklam SDK’sı + üçüncü taraf AI API çağrısı nedeniyle). Google Play/App Store gereksinimleri için birincil kaynaklar esas alınmıştır. citeturn3search6turn4search0turn4search1turn14view0

## Kritik Bulgular
Güvenlik, bildirim, reklam, depolama ve UI/UX başlıklarında çok sayıda bulgu vardır; en yüksek öncelikli olanlar aşağıdadır.

Gizli anahtarın istemci bundle’ına gömülmesi (P0)  
Expo, `EXPO_PUBLIC_` değişkenlerinin uygulama bundle’ına inline edildiğini ve **gizli bilgi saklanmaması gerektiğini** belirtir. citeturn0search2 Bu nedenle AI çağrılarını doğrudan istemciden yapmak yerine **backend/proxy** üzerinden yapmak, anahtarın cihazlara hiç gitmemesini sağlamak gerekir. (Etki: key sızıntısı, kötüye kullanım, maliyet.) citeturn0search2

Android 13+ bildirim izni akışı (P0)  
Android 13+’ta `POST_NOTIFICATIONS` runtime izni gereklidir; izin istemi doğru bağlamda yapılmazsa bildirimler çalışmayabilir. citeturn0search0turn0search1

Android bildirim kanalı kullanımının tamamlanmaması (P1)  
Expo örneklerinde, Android’de oluşturulan kanalın etkili olması için bildirim planlamasında `channelId` ilişkilendirilir. citeturn10search0turn10search1 Aksi hâlde varsayılan kanal ayarları devreye girerek önem/ses/vibrasyon beklentisi bozulabilir. citeturn10search1

Reklam rızası/ATT ve başlatma sırası (P0)  
`react-native-google-mobile-ads` dokümanı, EEA/UK rızası ve gerekli bayrakların **Mobile Ads SDK initialize edilmeden önce** ele alınmasını önerir; ayrıca UMP/consent toplama için `AdsConsent` akışını tarif eder. citeturn7search0turn14view0 Google tarafı, EU User Consent Policy kapsamında EEA/UK’de disclosure+consent gerekliliğini vurgular. citeturn6search0 iOS’ta tracking kapsamı ve ATT gereklilikleri Apple tarafından tanımlanır. citeturn1search2

AsyncStorage ile büyük sözlük verisi (P1)  
AsyncStorage’ın bilinen boyut limitleri (Android’de varsayılan toplam limit ve tek kayıt limiti) büyük JSON saklamada risk oluşturur. citeturn11search0turn9search5 Sözlük/ilerleme gibi yapısal veriler için `expo-sqlite` (KV-store veya tablo yapısı) daha dayanıklı bir yaklaşım olabilir. citeturn12search0

Yerelleştirme ve RTL (P2)  
Expo localization kılavuzu, sistem “per-app language” desteği ve RTL için app config’te `supportedLocales` ve `extra.supportsRTL` gibi ayarları önerir. citeturn5search2 RTL davranışı için React Native `I18nManager` notları da önemlidir. citeturn5search5

## Mağaza ve Platform Uyumluluğu
Hesap silme uyumluluğu  
Apple, hesap oluşturma olan uygulamaların uygulama içinden hesap silme başlatmasına izin vermesini şart koşar. citeturn4search0turn4search1 Google Play tarafında gizlilik politikası URL’si zorunludur ve Data safety beyanlarının gerçeği yansıtması gerekir. citeturn3search6turn2search2 (Not: Play’de ayrıca “Data deletion / account deletion” yüzeyi bulunduğundan, sağlanan `delete_account.html`’in üretimde barındırılıp ilgili alanlara girilmesi gerekir; bu gereksinim Android Developers blogunda da vurgulanır.) citeturn3search7

Bildirim politikaları ve arka plan kısıtları  
Bildirim izni Android 13+ için kritik; iOS izin durumları daha granülerdir ve Expo izin statüsü yorumlamayı belirtir. citeturn0search0turn1search0 iOS’ta çok sayıda yerel bildirim planlamasında sistem limitleri bulunabilir; pratikte “64 pending schedule” sınırının sahada sorun çıkarabildiği raporlanmıştır (ikincil kaynak). citeturn1search3

Reklam/personalization ve rıza  
EEA/UK’de CMP/UMP ile rıza, ayrıca iOS’ta tracking tanımı/ATT gereksinimi doğru ele alınmalıdır. citeturn6search0turn7search0turn1search2

## Önceliklendirilmiş Düzeltme Planı ve Tahmini Süre
Aşağıdaki tablo, “en yüksek risk → en yüksek kullanıcı/mağaza etkisi” yaklaşımıyla sıralanmıştır. (Detaylı iş kırılımı PDF/Markdown raporda.)

| Öncelik | İş Paketi | Tahmin |
|---|---|---:|
| P0 | İstemcideki `EXPO_PUBLIC_*` gizli anahtarın kaldırılması + Groq çağrıları için backend/proxy + anahtar revoke/rotate | 12–24 saat |
| P0 | UMP/consent + (gerekliyse) ATT akışı; “initialize before consent” düzeltmesi; privacy options | 8–16 saat |
| P0 | Android 13+ `POST_NOTIFICATIONS` akışı (izin istemi, reddedilme UX’i, ayarlar yönlendirmesi) | 4–8 saat |
| P1 | Sözlüğün AsyncStorage’dan (tek blob) çıkarılması: level-bazlı anahtarlar veya `expo-sqlite` (migrasyon dahil) | 16–32 saat |
| P1 | UI/UX responsive + fontScale/overflow düzeltmeleri (Home kartı, Input 56dp sabit yükseklik, Login form/klavye) | 12–24 saat |
| P2 | supportedLocales + RTL bayrakları + RTL testleri | 4–8 saat |

## Test Stratejisi
Bildirim izni ve kanal davranışı için Android 13+ cihaz/emülatör üzerinde; izin reddi, sonradan ayarlardan açma, kanal önem seviyesi doğrulaması test edilmelidir. citeturn0search0turn10search0

Yerelleştirme için iOS/Android “per-app language” ve RTL senaryoları test edilmelidir; Expo localization ölçütleri ve React Native `I18nManager` notları esas alınmalıdır. citeturn5search2turn5search5

Depolama testleri; AsyncStorage limitlerine yaklaşabilecek büyük sözlük setleriyle “soğuk açılış”, ilk setup, level geçişi, offline mod ve veri migrasyonu senaryolarını kapsamalıdır. citeturn11search0turn12search0

## Teslimler
Kısa özet: P0 güvenlik (API key), P0 reklam rızası/ATT, P0 Android 13 bildirim izni, P1 sözlük depolama ölçeklenebilirliği ve P1 UI overflow/fontScale uyumlulukları önceliklidir. citeturn0search2turn0search0turn7search0turn11search0turn5search2

- [PDF Raporu İndir](sandbox:/mnt/data/VocBee_Teknik_Denetim_Raporu.pdf)  
- [Markdown Raporu İndir](sandbox:/mnt/data/VocBee_Teknik_Denetim_Raporu.md)  
- [Örnek Kod/Düzeltme Yamaları](sandbox:/mnt/data/VocBee_ornek_yamalar.patch)