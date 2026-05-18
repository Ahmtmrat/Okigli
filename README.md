# Diba & Kadir Wedding App

Düğün davetlilerine özel RSVP sitesi + fotoğraf/video toplama.

## Özellikler

- **RSVP** (`/davet/[token]`): Davetli linkle gelir, "Katılacağım" veya "Maalesef katılamıyorum" der. Katılacaksa eşi/çocukları için isim ekler. İlk yanıt kesindir; sonradan değiştirilemez.
- **Lokasyon kartı**: RSVP altında her zaman görünür, "Yol Tarifi Al" butonu mobilde harita uygulamasını açar.
- **Anı yükleme** (`/upload/[token]`): Davetli foto/video yükler → Senin Google Drive'ına gider.
- **Admin paneli** (`/admin?key=...`):
  - Özet (toplam davetli, evet/hayır/yanıt yok, toplam katılım)
  - Davetli listesi (filtre + arama)
  - Her davetli için WhatsApp aç butonu (hazır mesaj + link)
  - CSV ile toplu davetli ekleme
  - Drive galerisi

## Mimari

```
Vercel (Next.js + Postgres) ↔ Google Drive (sadece dosyalar)
```

## 1. Kurulum (yerel)

```bash
npm install
```

## 2. Vercel'e Deploy

```bash
npm i -g vercel
vercel
```

Vercel proje oluşturulduktan sonra dashboard'da:

### a) Postgres ekle
- Proje > **Storage** > **Create Database** > **Postgres**
- Bu otomatik olarak `POSTGRES_*` env değişkenlerini bağlar
- Postgres dashboard'unda **Query** sekmesine git, `schema.sql` içeriğini yapıştır ve çalıştır

### b) Admin key ekle
- Proje > **Settings** > **Environment Variables**
- `ADMIN_KEY` = uzun ve tahmin edilemez bir string (örn: `openssl rand -hex 24` çıktısı)

## 3. Google Drive Bağlantısı

### a) Google Cloud Console hazırlığı

1. https://console.cloud.google.com adresine git
2. Yeni proje oluştur (örn: "wedding-app")
3. **APIs & Services** > **Library** > **Google Drive API**'yi aktif et
4. **APIs & Services** > **OAuth consent screen**:
   - User type: **External**
   - App name: "Wedding Upload"
   - User support email: kendi mailin
   - Scopes: ekleme
   - **Test users**: kendi gmail hesabını ekle (çok önemli — yoksa refresh token çalışmaz)
5. **APIs & Services** > **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Type: **Desktop app**
   - Name: "wedding-app-cli"
   - Oluştur → **Client ID** ve **Client Secret** kopyala

### b) Drive klasörü oluştur

1. Google Drive'da yeni bir klasör aç (örn: "Düğün Anıları")
2. Klasöre gir, URL'den ID'yi al: `https://drive.google.com/drive/folders/XXXXXXXX` → `XXXXXXXX` kısmı

### c) Refresh token al (tek seferlik)

Terminalde:

```bash
GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npm run get-refresh-token
```

Tarayıcı açılır, kendi Google hesabınla giriş yap, izin ver, terminale dön. **Refresh token** terminalde basılır, kopyala.

### d) Vercel env'lere ekle

Vercel > Project > Settings > Environment Variables:

| Key | Value |
|-----|-------|
| `ADMIN_KEY` | uzun gizli string |
| `GOOGLE_CLIENT_ID` | (Cloud Console'dan) |
| `GOOGLE_CLIENT_SECRET` | (Cloud Console'dan) |
| `GOOGLE_REFRESH_TOKEN` | (yukarıdan kopyaladığın) |
| `DRIVE_FOLDER_ID` | (Drive klasörünün ID'si) |

Tüm değişkenler eklendikten sonra **Redeploy**.

## 4. Lokasyon koordinatı

`lib/venue.ts` dosyasında `lat` ve `lng` değerlerini güncelle. Almak için:

1. Google Maps'te mekanı bul
2. Sağ tık > "Buradan ne var?" — koordinatlar görünür
3. veya URL'de `@36.xxxx,30.xxxx,15z` kısmından oku

## 5. Kullanım

### Davetli ekleme
`https://<projen>.vercel.app/admin/import?key=ADMIN_KEY`

CSV formatı:
```csv
full_name,salutation,phone
Ahmet Yılmaz,Ahmet Bey,905321234567
Ayşe Demir,Ayşe Hanım,905339876543
```

### Davetli yönetimi
`https://<projen>.vercel.app/admin?key=ADMIN_KEY`

Her davetli kartında:
- **WhatsApp Aç**: Senin WhatsApp'ından hazır mesajla açılır
- **Mesajı Kopyala**: Mesaj + link kopyalanır
- **Linki Aç**: Davetli sayfasını test et

### Galeri
`https://<projen>.vercel.app/admin/gallery?key=ADMIN_KEY`

## Sınırlar (Vercel Hobby + ücretsiz Drive)

- Dosya başına: 50 MB (kod içinde sınırlı)
- Vercel function timeout: 60 sn (60 sn'lik videoyu yükleyebilirsin)
- Postgres: 256 MB (yüzlerce davetli için fazlasıyla yeterli)
- Drive: 15 GB ücretsiz, üstü Google One

## Düğünden sonra

- Vercel projesini silmek: Settings > Delete Project
- Drive klasörünü olduğu gibi tutabilirsin (anılar orada)
- Postgres tek tıkla silinir, ya da olduğu gibi kalır (256MB ücretsiz)
