module.exports = {
  apps: [
    {
      name: 'eticaret',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/eticaret',
      env: {
        NODE_ENV: 'production',
        TZ: 'Europe/Istanbul',
        // SMTP - Hostinger
        SMTP_HOST: 'smtp.hostinger.com',
        SMTP_PORT: '465',
        SMTP_SECURE: 'true',
        SMTP_USER: 'info@atesoglusut.com',
        SMTP_PASS: 'SMTP_SIFRENIZI_BURAYA_YAZIN',
        // Diğer env değişkenleri .env.local dosyasından okunur
      },
    },
  ],
}
