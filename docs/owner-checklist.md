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

## 6. Karar bekleyen ürün kapsamı — hata değil, hiç başlanmamış iş

`docs/Prompt.md` (507 satırlık orijinal spesifikasyon) içinde arayüzün hiç vaat
etmediği, dolayısıyla hata sayılmayan ama yapılmamış özellikler var. Bunlara
dokunmadım; yapılmasını istiyorsan söyle, her biri ayrı bir iş kalemi:

**Bildirimler** (`# Notifications`) — şu an sadece deprem uyarısı var ve kartı
sınırını dürüstçe yazıyor ("Alerts run while this tab is open"). Yapılmamış
olanlar:
- Yeni NASA görseli bildirimi
- SpaceX fırlatma bildirimi
- Solar fırtına bildirimi
- ISS tepeden geçiyor bildirimi (spesifikasyonda da "future feature" yazıyor)

**Ek widget'lar** (`# Extra Widgets`) — hiçbiri yok:
Ay evresi · Mars hava durumu · Günün takımyıldızı · Günün gezegeni ·
Rastgele astronomi bilgisi · Günün uzay sözü · Dünya'nın dönüşü ·
Gün doğumu / batımı

**İstatistik kartları** (`# Statistics`) — YAPILDI. Ortalama deprem büyüklüğü
ve ISS'in ölçülen yüksekliği stat bar'a eklendi; bar altı yerine sekiz kutucuk,
dört sütunlu iki satır olarak duruyor.

Bunların hiçbiri "kırık" değil. Arayüz bunları göstereceğini söylemiyor, o yüzden
kullanıcıya yalan söylenmiyor. Tamamen senin ürün kararın.

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
