# Next.js E-Ticaret - Contabo VPS Kurulum Rehberi (Ubuntu 22.04)

---

## ADIM 1 — SSH ile Sunucuya Bağlan

Bilgisayarında terminal aç:

```bash
ssh root@SUNUCU_IP_ADRESI
```

---

## ADIM 2 — Sistem Güncelle

```bash
apt update && apt upgrade -y
```

---

## ADIM 3 — Node.js 20 Kur

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # v20.x.x görmeli
```

---

## ADIM 4 — PostgreSQL Kur

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

Veritabanı ve kullanıcı oluştur:

```bash
sudo -u postgres psql
```

psql ekranında şunları yaz (GUCLU_SIFRE_YAZ kısmını değiştir):

```sql
CREATE USER eticaret WITH PASSWORD 'GUCLU_SIFRE_YAZ';
CREATE DATABASE eticaret OWNER eticaret;
GRANT ALL PRIVILEGES ON DATABASE eticaret TO eticaret;
\q
```

> ⚠️ Şifreyi bir yere kaydet, sonra lazım olacak.

---

## ADIM 5 — Nginx ve PM2 Kur

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx

npm install -g pm2
```

---

## ADIM 6 — Git Kur ve Projeyi İndir

```bash
apt install -y git
mkdir -p /var/www/eticaret
cd /var/www/eticaret

# GitHub repo linkinle değiştir:
git clone https://github.com/KULLANICI/REPO_ADI.git .
```

---

## ADIM 7 — .env Dosyası Oluştur

```bash
cd /var/www/eticaret
nano .env
```

Aşağıdaki içeriği yapıştır (değerleri düzenle):

```env
DATABASE_URL="postgresql://eticaret:GUCLU_SIFRE_YAZ@localhost:5432/eticaret"
NEXTAUTH_URL="https://DOMAIN_ADRESI.COM"
NEXTAUTH_SECRET="BURAYA_RASTGELE_UZUN_BIR_STRING_YAZ"
NODE_ENV="production"
```

**NEXTAUTH_SECRET üretmek için ayrı bir terminalde:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıkan değeri kopyalayıp `NEXTAUTH_SECRET` yerine yapıştır.

`Ctrl+X` → `Y` → `Enter` ile kaydet.

---

## ADIM 8 — Bağımlılıkları Kur, Veritabanı Oluştur, Build Al

```bash
cd /var/www/eticaret
npm install
npx prisma db push
npm run db:seed
npm run build
```

---

## ADIM 9 — PM2 ile Uygulamayı Başlat

```bash
cd /var/www/eticaret
pm2 start npm --name "eticaret" -- start
pm2 save
pm2 startup
```

> `pm2 startup` komutundan çıkan satırı kopyalayıp çalıştır (sudo ile başlayan bir komut olacak).

**Durumu kontrol et:**
```bash
pm2 status
```

Uygulama artık `http://SUNUCU_IP:3000` adresinde çalışıyor.

---

## ADIM 10 — Nginx Konfigürasyonu

```bash
nano /etc/nginx/sites-available/eticaret
```

Aşağıdaki içeriği yapıştır (DOMAIN_ADRESI.COM yerine kendi domaini yaz):

```nginx
server {
    listen 80;
    server_name DOMAIN_ADRESI.COM www.DOMAIN_ADRESI.COM;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/eticaret /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

`nginx -t` komutu **"syntax is ok"** yazmalı.

---

## ADIM 11 — Domain DNS Ayarı

Domain kayıt firmanın (GoDaddy, Nane, Namecheap vb.) paneline gir:

| Tip | Ad  | Değer          | TTL  |
|-----|-----|----------------|------|
| A   | @   | SUNUCU_IP      | 3600 |
| A   | www | SUNUCU_IP      | 3600 |

> DNS yayılması 5 dakika - 24 saat sürebilir. `ping DOMAIN_ADRESI.COM` ile sunucu IP'ni gösterene kadar bekle.

---

## ADIM 12 — SSL Sertifikası (HTTPS) — Certbot

DNS yayıldıktan sonra:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d DOMAIN_ADRESI.COM -d www.DOMAIN_ADRESI.COM
```

E-posta adresini gir, şartları kabul et. HTTPS otomatik ayarlanır.

**Otomatik yenileme testi:**
```bash
certbot renew --dry-run
```

---

## İlk Giriş

| Alan | Değer |
|------|-------|
| URL | https://DOMAIN_ADRESI.COM |
| Admin E-posta | admin@site.com |
| Admin Şifre | admin123 |

> ⚠️ İlk girişten sonra hemen şifreyi değiştir!
> Admin Panel → Hesabım → Profil Ayarları

---

## Güncelleme Nasıl Yapılır?

```bash
cd /var/www/eticaret
git pull origin main
npm install
npm run build
pm2 restart eticaret
```

---

## Faydalı Komutlar

```bash
pm2 status               # uygulama durumu
pm2 logs eticaret        # canlı loglar
pm2 restart eticaret     # yeniden başlat
systemctl status nginx   # nginx durumu
systemctl status postgresql  # veritabanı durumu
```

---

## Yerel Geliştirme (Kendi Bilgisayarında)

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin
```
