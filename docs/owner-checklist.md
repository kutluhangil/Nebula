# Senin yapman gerekenler

Bu dosya, kodla çözülemeyen — hesap açmak, anahtar almak, karar vermek gereken
işleri tutar. Her madde ya bir hesap işi ya da senin vereceğin bir karar.
Sırayla değil, öncelik sırasına göre yazıldı.

---

## 1. NASA API anahtarı — ENGELLEYİCİ

Şu an `/api/apod` ve `/api/space` rotaları **502** dönüyor. Sebep kod değil:
NASA'nın paylaşımlı `DEMO_KEY` anahtarı IP başına saatte 30 istekle sınırlı ve
o sınır dolu. Dashboard'da "Astronomy Picture of the Day" ve "Near-Earth
Objects" kartları hata durumunda, footer'daki "NASA Open APIs" satırı `DOWN`
görünüyor.

**Yapılacak:**

1. https://api.nasa.gov adresine gir, formu doldur (isim + e-posta yeter,
   ücretsiz, onay beklemiyor — anahtar anında e-postana geliyor).
2. Proje kökünde `.env.local` dosyası oluştur:
   ```
   NASA_API_KEY=buraya_gelen_anahtar
   ```
   `.env.local` zaten `.gitignore`'da; commit edilmez.
3. Sunucuyu temiz başlat ve doğrula:
   ```
   pkill -f "next start"; pkill -f "next-server"; rm -rf .next
   npm run build && npm run start
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/apod
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/space
   ```
   İkisi de `200` dönmeli.

**Bunu yapınca ayrıca:** `tests/api-contract.spec.ts` içindeki NASA sözleşme
testi şu an kendini atlıyor ("upstream unavailable"). Anahtar gelince o test de
koşacak — yani test sayısı 71 geçti + 1 atlandı yerine 72 geçti olacak.

**Not:** Anahtarı bana verirsen `.env.local`'a ben yazarım. Anahtarı bu depoya
veya bir commit'e asla koyma.

---

## 2. Vercel'e deploy ederken environment variable'lar

Yerelde `.env.local` yeter, ama deploy'da Vercel'in kendi env store'una girmen
gerekiyor. Panelden ya da CLI'dan:

```
vercel env add NASA_API_KEY production
vercel env add NASA_API_KEY preview
```

- `NASA_API_KEY` — zorunlu (yukarıdaki madde).
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

**İstatistik kartları** (`# Statistics`) — mevcut stat bar'da olmayan ikisi:
- Ortalama deprem büyüklüğü
- ISS'in Dünya'dan uzaklığı

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
