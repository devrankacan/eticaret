# Next.js E-Ticaret - Hostinger Kurulum Rehberi

## Gereksinimler
- Hostinger **Node.js Web Uygulaması** planı
- Node.js 18+

---

## 1. Projeyi GitHub'a Yükle

```bash
# Lokal geliştirme ortamında
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

---

## 2. Hostinger'da Node.js Uygulaması Oluştur

1. Hostinger Kontrol Paneli → **Site ekle** → **Node.js Web Uygulaması**
2. GitHub reposunu bağla
3. Build komutu: `npm run build`
4. Start komutu: `npm run start`
5. Node.js sürümü: **18** veya üstü

---

## 3. Environment Variables (Çevre Değişkenleri)

Hostinger panelinde **Environment Variables** bölümüne ekle:

```
NEXTAUTH_URL=https://siteniz.com
NEXTAUTH_SECRET=guclu-rastgele-bir-sifre-buraya-yaz
DATABASE_URL=file:./data/eticaret.db
NODE_ENV=production
```

**NEXTAUTH_SECRET oluşturmak için:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. İlk Deploy Sonrası

SSH ile bağlan ve çalıştır:
```bash
cd /home/kullanici/htdocs/siteniz.com

# Veritabanını oluştur
npx prisma db push

# Örnek verileri yükle (admin, kargo firmaları, kategoriler)
npm run db:seed
```

---

## 5. İlk Giriş

| Alan | Değer |
|------|-------|
| URL | https://siteniz.com |
| Admin E-posta | admin@site.com |
| Admin Şifre | admin123 |

**⚠️ İlk girişten sonra hemen şifreyi değiştirin!**
Admin Panel → Hesabım → Profil Ayarları

---

## 6. Kurulum Sonrası Yapılacaklar

### Site Ayarları (`/admin/ayarlar`)
- [ ] Site adı, logo
- [ ] Telefon, WhatsApp, e-posta
- [ ] Meta açıklama
- [ ] Banka hesapları ekle (havale için)
- [ ] İyzico API key gir (isteğe bağlı)

### Kargo (`/admin/kargo`)
- [ ] Varsayılan kargo firmasını seç
- [ ] Ücretsiz kargo limitini belirle
- [ ] Kargo takip URL'sini kontrol et

### Kategoriler → Ürünler
- [ ] Kategorileri düzenle / görsel ekle
- [ ] Ürünleri ekle (görsel, fiyat, stok)
- [ ] Banner ekle (ana sayfa slider)

---

## Günlük Kullanım

### Sipariş Akışı:
1. **Dashboard** → yeni sipariş bildirimi
2. Siparişi aç → ürünleri hazırla
3. **Kargoya Ver** → firma + takip no gir → Kaydet
4. Sistem otomatik "Kargoya Verildi" durumuna alır
5. Müşteri kargo takip linkini görür

### Havale Siparişi:
1. Dashboard → **Havale Bekleyenler** kutucuğu
2. Banka hesabını kontrol et
3. **İncele & Onayla** → sipariş detayında **Havale Ödemesini Onayla**

---

## Yerel Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Veritabanı oluştur
npx prisma db push

# Örnek verileri yükle
npm run db:seed

# Geliştirme sunucusu başlat
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin
```
 
