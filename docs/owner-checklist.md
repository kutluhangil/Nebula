# Senin yapman gerekenler

Bu dosya, kodla çözülemeyen — hesap açmak, anahtar almak, karar vermek gereken
işleri tutar. Her madde ya bir hesap işi ya da senin vereceğin bir karar.
Sırayla değil, öncelik sırasına göre yazıldı.

---

## 1. NASA API anahtarı — TAMAM (yerel + Vercel)

Anahtar `.env.local` dosyasına yazıldı. `.env.local` `.gitignore` kapsamında,
commit edilmiyor. Doğrulandı:

- `/api/apod` → `200`, `/api/space` → `200` (önceden ikisi de 502'ydi)
- NASA kota başlığı: `x-ratelimit-limit: 10000` (DEMO_KEY'in saatlik 30'u değil)
- `tests/api-contract.spec.ts` NASA sözleşme testi artık kendini atlamıyor

Vercel env store'una da girildi — aşağıdaki 2. madde. Yerel `.env.local`
deploy'a taşınmaz, o yüzden ikisi ayrı ayrı gerekiyordu.

---

## 1b. Launch Library 2 kotası — ÖLÇÜLDÜ, aksiyon gerekmiyor

Önceki not bunu "üretimde risk" diye yazmıştı. Ölçünce öyle çıkmadı.

`ll.thespacedevs.com` anonim çağrıları IP başına saatte ~15 istekle sınırlıyor.
`/api/spacex` iki upstream isteği yapıyor (previous + upcoming) ve ikisi de
`next: { revalidate: 3600 }` ile Next data cache'e giriyor. Üretim build'inde
ölçüldü:

```
call 1 http=200 t=1.489868   <- upstream
call 2 http=200 t=0.004016   <- data cache
call 3 http=200 t=0.002687
```

Yani trafikten bağımsız olarak saatte **2** upstream isteği. Limitin çok
altında. `withTimeout`'un eklediği `AbortSignal` cache'i devre dışı bırakmıyor;
Next 16 revalidate sırasında signal'i düşürüp yanıtı cache'liyor
(`node_modules/next/dist/server/lib/patch-fetch.js`).

Geliştirirken görülen 429'lar yerel kaynaklıydı: her doğrulamada `rm -rf .next`
data cache'i siliyor ve Playwright rotayı arka arkaya çağırıyor.

**Sonuç:** LL2 anahtarı gerekmiyor, `revalidate` uzatması gerekmiyor. Yapılan
tek değişiklik, rotanın 429'u artık dürüstçe raporlaması: upstream gövdesi ve
`retry-after` hata mesajına giriyor (önceden sadece `failed: 429` yazıyordu).

---

## 2. Vercel environment variable'ları — NASA anahtarı TAMAM

`NASA_API_KEY` hem Production hem Preview ortamına girildi:

```
 name            value       environments
 NASA_API_KEY    Encrypted   Preview
 NASA_API_KEY    Encrypted   Production
```

**Bilinmesi gereken:** Vercel env değişkenini deployment'a build anında bağlar.
Production değişkeni, o an çalışan prod deployment ile aynı dakikada eklendi;
anahtarın çalışan deployment'a geçtiği doğrulanamadı (`/api/apod` 200 dönüyor
ama `DEMO_KEY` de 200 döner, ikisi dışarıdan ayırt edilemiyor). Bir sonraki
deploy'da kesinleşecek — emin olmak istersen prod'u redeploy et.

Kalan opsiyonel değişkenler:

- `NEXT_PUBLIC_SITE_URL` — yalnızca özel alan adı kullanacaksan. Vercel'in kendi
  host'unda otomatik türetiliyor. Canonical URL'ler, sitemap ve Open Graph
  görselleri bunu okuyor; özel domain'de boş bırakırsan metadata yanlış adresi
  gösterir.
- `OPENAI_API_KEY` — **opsiyonel ve ücretli**. Boşken günlük gezegen raporu
  yerleşik şablondan üretiliyor ve çalışıyor. Anahtarı koyarsan her rapor gerçek
  para harcar. Rotada dakikada 10 istek sınırı var ama bu sınır sunucu
  örneğinin belleğinde tutuluyor — ölçeklenmiş bir deployment'ta örnek başına
  uygulanır, sert bir üst sınır değil. Bu rotayı açacaksan önce bunu bilerek aç.

---

## 3. Node sürümü — küçük ama her komutta uyarı veriyor

Yerelde Node `v24.12.0` + npm `12.0.1` var. npm bu Node sürümünü desteklemiyor:

```
npm warn cli npm v12.0.1 does not support Node.js v24.12.0.
This version of npm supports: ^22.22.2 || ^24.15.0 || >=26.0.0
```

Şu an bir şeyi kırmıyor ama her komutta uyarı basıyor ve desteklenmeyen
kombinasyon. Node'u `24.15+` ya da `22.22+` sürümüne çek (nvm kullanıyorsan
`nvm install 24 && nvm use 24`).

Karar senin: `package.json`'a `engines` alanı ekleyip sürümü sabitlememi
istersen söyle — şu an yok, yani CI ve Vercel kendi varsayılanını seçiyor.

---

## 4. Vercel CLI güncel değil

Kurulu sürüm `58.4.4`, güncel `59.11.7`.

```
npm i -g vercel@latest
```

---

## 5. Harita tile sağlayıcısı — trafik büyürse tekrar bak

Seismic haritanın altlığı artık Esri'nin anahtarsız **Dark Gray Canvas**
servisinden geliyor (CARTO her karoya "API KEY REQUIRED" damgası bastığı için
değiştirildi). Atıf zorunlu ve haritada duruyor: *Tiles © Esri — Esri, HERE,
Garmin, © OpenStreetMap contributors*.

Bu servis ücretsiz ve anahtarsız, ama Esri'nin kullanım koşulları ciddi trafik
için anahtarlı erişim bekler. Site gerçekten trafik almaya başlarsa
(günde binlerce harita açılışı) ya Esri'den ücretsiz developer anahtarı al ya da
Protomaps/MapTiler gibi bir alternatife geç. Şimdilik aksiyon gerekmiyor —
sadece bilmen için.

---

## 6. Kalan ürün kapsamı — KAPANDI

`docs/Prompt.md` (507 satırlık orijinal spesifikasyon) içinde arayüzün hiç vaat
etmediği, dolayısıyla hata sayılmayan ama yapılmamış özellikler vardı. İstatistik
kartları, ek widget'lar, bildirimler ve evrensel arama — dördü de kapandı.
(Önceki notun "geriye sadece bildirimler kaldı" cümlesi eksikti; arama kalemi
gözden kaçmıştı.)

**Bildirimler** (`# Notifications`) — YAPILDI. Dört kaynak var, her biri
watchlist kartından tek tek açılıp kapanıyor:
- Deprem (eşik + tsunami filtresi) — zaten vardı
- Yeni NASA görseli — NASA'nın `date` alanı değişince
- SpaceX fırlatma — yayınlanan kalkış saatinden bir saat önce
- Solar fırtına — seçilen Kp eşiğinde ya da üstünde
- ISS tepeden geçiyor — spesifikasyonun kendisi "future feature" diyor, kapsam
  dışı bırakıldı.

Her kaynağın olay kimliği ayrı seçildi, aynı olay iki kez bildirilmesin diye:
görsel NASA'nın tarihine, fırlatma Launch Library kimliğine (NET kayıyor), fırtına
Kp seviyesi + UTC gününe bakıyor. Kp5'ten Kp7'ye derinleşen bir fırtına tekrar
haber veriyor; sadece süren bir fırtına susuyor.

Sınır aynı ve kart hâlâ yazıyor: **uyarılar yalnızca sekme açıkken çalışıyor.**
Service worker ya da sunucu tarafı push yok. Tarayıcı bildirimleri site için
engellemişse kart bunu da söylüyor — buton yeniden izin isteyemez, tek yol
tarayıcının kendi site ayarları.

**Ek widget'lar** (`# Extra Widgets`) — YAPILDI. `/sky` rotası (Sky Almanac)
yedi widget taşıyor: ay evresi, Dünya'nın dönüşü, günün takımyıldızı, günün
gezegeni, astronomi bilgisi, uzay sözü, Mars hava durumu. Sekizincisi —
gün doğumu / batımı — zaten dashboard'daki hava durumu kartında duruyordu
(Open-Meteo `daily=sunrise,sunset`), oraya dokunulmadı.

Her kart hangi sınıftan olduğunu kendi üstünde yazıyor:

- **Computed** — ay evresi ve Dünya dönüşü, saatten hesaplanıyor. Ay serisi
  `suncalc`, iki bilinen olaya karşı doğrulandı: 2019-01-21 tam ay tutulması
  phase 0.5010 / aydınlanma 1.000, 2017-08-21 tam güneş tutulması phase 0.0012 /
  aydınlanma 0.000. Yüzey hızı küre yerine WGS84 birinci dikey yarıçapını
  kullanıyor, ekvatorda 1674.364 km/h.
- **Curated** — takımyıldız, gezegen, bilgi, söz. Canlı veri değil; her kayıt
  kaynağını taşıyor (IAU takımyıldız sınırları, NASA planetary fact sheet) ve
  kart o atfı basıyor. Günün kaydı epoch'tan bu yana geçen tam güne göre
  seçiliyor — rastgele değil, yoksa "günün" kelimesi yalan olurdu.
- **Archive** — Mars. Aşağıdaki not.

**Mars hava durumunun canlı kaynağı yok.** 2026-09-07'de iki kaynak da ölçüldü:

```
api.nasa.gov/insight_weather/  200  son sol 681 = 2020-10-25  (InSight görevi 2022'de bitti)
api.maas2.apollorion.com       200  son kayıt   = 2023-02-14  (Curiosity REMS, üçüncü parti, donmuş)
```

Kart bu yüzden önce sol numarasını ve tarihini yazıyor, sonra sıcaklığı; altında
görevin bittiği tarih duruyor. Altı yıllık bir ölçümü bugünün havası gibi
göstermek, bu projenin birkaç fazdır temizlediği kusurun aynısı olurdu.

**İstatistik kartları** (`# Statistics`) — YAPILDI. Ortalama deprem büyüklüğü
ve ISS'in ölçülen yüksekliği stat bar'a eklendi; bar altı yerine sekiz kutucuk,
dört sütunlu iki satır olarak duruyor.

**Evrensel arama** (`# Search`) — YAPILDI. ⌘K paleti artık sayfa ve eylemin
yanında kayıt da arıyor: görevler ve roketler (fırlatma tahtasından), gezegenler
(NASA fact sheet), şu an uzayda olan insanlar, günün NEO'ları, M4.0+ deprem
akışı. Her satır adın altında ölçülen ayrıntıyı da basıyor — büyüklük ve tarih,
ıskalama mesafesi, uzayda geçen gün.

Kayıtlar ancak bir şey yazılınca çıkıyor (tek başına 100 deprem var, hepsini
listelemek sayfaları gömerdi) ve besleme çökmüşse palet bunu sonuçların üstünde
adıyla söylüyor — boş sonuç "böyle bir kayıt yok" diye okunmasın diye.

**Astronot kaynağı bir karar gerektirdi.** 2026-09-07'de iki kaynak ölçüldü:

```
api.open-notify.org/astros.json   200  ekip listesi 2024'te donmuş (Ekspedisyon 71)
corquaid.github.io/...            200  Ekspedisyon 75, güncel
```

open-notify canlı değil — Mars kartındaki kusurun aynısı — kullanılmadı.
Kullanılan kaynak **üçüncü parti bir topluluk mirror'ı**; `/api/astronauts`
kendi `source` alanında bunu yazıyor. Uzayda geçen gün sayısı mirror'ın kendi
`days_in_space` alanından değil, fırlatma zaman damgasından hesaplanıyor:
mirror'ın alanı ölçüldüğünde yanlıştı (150 diyordu, fırlatma tarihinden 106
çıkıyor).

Bilmen gereken: bu tek kaynak bir gün bakımsız kalırsa astronot araması düşer.
Footer'daki kaynak durumu listesine eklendi, yani düştüğünde orada görünür.
Resmî, makine okunur bir mürettebat listesi yayınlayan ajans yok — alternatif
Launch Library'nin astronot ucu, o da anonim çağrıları saatte ~15 istekle
sınırlıyor.

---

## 7. Tasarım yönü — karar verildi, aksiyon yok

`CLAUDE.md` içine `Design direction: high-end-visual-design` olarak yazıldı.
Sonraki oturumlarda bir daha sorulmayacak. Fikrini değiştirirsen o satırı
değiştirmen yeterli.

---

## Hızlı doğrulama komutları

Bir şeye dokunduktan sonra her şeyin ayakta olduğunu görmek için:

```
pkill -f "next start"; pkill -f "next-server"; rm -rf .next
npm run lint && npx tsc --noEmit && npm run build && npx playwright test
```

Not: Playwright derlenmiş çıktıya karşı koşuyor. `rm -rf .next && npm run build`
yapmadan test koşarsan eski derlemeyi test edersin ve sonuç yanıltıcı olur.
