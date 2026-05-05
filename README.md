# BangBot

Fondasi awal bot WhatsApp yang modular, ditujukan untuk berkembang ke banyak fitur tanpa cepat berantakan.

## Stack

- Node.js
- `@whiskeysockets/baileys` untuk koneksi WhatsApp Web
- `pino` untuk logging
- `zod` untuk validasi environment

## Struktur

```text
src/
  bot/
    whatsapp.js
  commands/
    help.js
    index.js
    ping.js
  config/
    env.js
  index.js
  logger.js
```

## Menjalankan

```bash
npm install
copy .env.example .env
npm start
```

Saat pertama kali jalan, terminal akan menampilkan QR code untuk login WhatsApp.

## Fitur Awal

- Koneksi WhatsApp dengan session tersimpan di `.session/`
- Prefix command
- Command `!ping`
- Command `!help`
- Logging dasar
- Env validation
- Tidak perlu proses compile TypeScript

## Roadmap yang Cocok untuk Bot Lengkap

1. Sistem command lebih kaya: alias, permission, cooldown, kategori.
2. Database: simpan user, group config, statistik, blacklist, premium.
3. Scheduler: reminder, auto-post, backup, cleanup session.
4. Admin tools: anti-link, anti-spam, welcome/goodbye, moderation.
5. Integrasi API: AI, downloader, cuaca, berita, utilitas.
6. Dashboard/API internal untuk monitoring dan konfigurasi.
7. Test, observability, dan deployment.

## Catatan

Pilihan library WhatsApp di scaffold ini memakai `@whiskeysockets/baileys`, karena cocok untuk arsitektur Node modular dan aktif digunakan untuk otomasi berbasis WhatsApp Web. Tetap perlu berhati-hati karena bot seperti ini bergantung pada WhatsApp Web, jadi perubahan dari sisi WhatsApp bisa memengaruhi stabilitas.

Saat scaffold ini dibuat pada 5 Mei 2026, `npm audit` masih menandai advisory kritis pada dependency transitif `@whiskeysockets/libsignal-node -> protobufjs@6.8.8`. Ini tampaknya datang dari upstream package WhatsApp, jadi sebelum masuk production sebaiknya kita evaluasi update library, override yang aman, atau alternatif stack resmi seperti WhatsApp Cloud API jika use case-nya memungkinkan.
