# AGENTS.md — Panduan Wajib untuk Asisten AI Coding

Proyek: Website PT RICOVA MANDIRI JAYA MAKMUR (Marine Spares & Industrial Scrap Batam). Company profile, katalog produk, artikel, form RFQ, dan dashboard admin.
Baca berkas ini di awal **setiap sesi**, lalu baca bagian PRD yang relevan sebelum menulis kode. Panduan langkah demi langkah untuk model hemat ada di `PRD.md` Bagian 23.

## Dokumen Acuan (urutan prioritas)

1. `PRD.md` Bagian 24 — 12 protokol pengerjaan dan 10 spesifikasi keamanan (mandatori).
2. `PRD.md` (bagian lain) — kebutuhan, model data, hak akses, SEO/AEO/GEO, token warna, fase, dan alur GitHub. Bagian yang paling sering dipakai: 2 (stack), 3 (aturan kode), 5 (model data), 6 (auth dan role), 7 (approval), 10 (SEO), 12 (keamanan), 16 (fase), 18 (warna), 22 (GitHub), 23 (panduan eksekusi), 24 (aturan dan keamanan).
3. Berkas ini.

Bila permintaan bertentangan dengan dokumen di atas, **berhenti, jelaskan konfliknya, dan tunggu persetujuan tertulis** (PRD 3.4).

## Stack Resmi

Next.js (App Router), Bun, Better Auth, Tailwind CSS, shadcn/ui, Lucide, Zod, PostgreSQL, Drizzle ORM, React Hook Form, next-safe-action, Pino, Biome, Knip, Vitest, Playwright, Cloudinary, Nodemailer, sharp, file-type, TanStack Table, react-markdown + rehype-sanitize, sonner, server-only. Daftar lengkap dengan fungsinya ada di PRD Bagian 2.
Library di luar daftar PRD Bagian 2 **tidak boleh** ditambahkan tanpa persetujuan tertulis.

## Sebelum Mulai Tugas

- Jalankan `npx ctx7 setup` bila belum dilakukan pada sesi ini, lalu baca konteksnya.
- Pastikan ada **issue GitHub** untuk tugas ini (lihat Alur Kerja). Bila belum ada, buat dulu.
- Sebutkan bagian PRD yang menjadi acuan tugas (mis. "PRD 8 Halaman Publik, fase A1").
- Kerjakan satu tugas kecil per sesi. Jangan menyentuh berkas di luar issue.

## Definition of Done (wajib dijalankan dan dilaporkan)

Tugas baru dianggap selesai bila semua perintah berikut lulus, dan **hasil nyata perintahnya dilaporkan** (bukan sekadar pernyataan "sudah lulus"):

1. `bun run typecheck` (`tsc --noEmit`) tanpa error.
2. `bun run lint` (Biome) tanpa peringatan.
3. `bun run knip` tanpa dead code (berkas, ekspor, dependensi tak terpakai).
4. `bun run test` lulus, termasuk test baru untuk skema Zod, service, dan aturan akses yang disentuh.
5. `bun run build` lulus pada akhir setiap sub-tahap fase. `bun run check:colors` lulus bila menyentuh UI.
6. Tiga status UI ditangani: Loading, Error, Empty.
7. HTML semantik dan a11y terpenuhi (PRD 3.10 dan 10.1).

Nama skrip di atas didefinisikan di `package.json` (PRD 3.3). Bila skrip belum ada, laporkan dan minta persetujuan sebelum membuatnya.

## Larangan Keras

- `any`, `@ts-ignore`, `@ts-nocheck`.
- Komentar pemotong seperti `// ... kode sebelumnya tetap sama`. Sajikan berkas atau fungsi yang diubah secara utuh.
- Fungsi kosong, variabel atau impor tak terpakai, kode mati, `console.log` sisa debug.
- Secret, API key, atau URL database di kode sumber. Semua lewat env yang divalidasi Zod (`src/env.ts`).
- Merge string SQL mentah. Gunakan Drizzle atau `sql` dengan placeholder.
- `dangerouslySetInnerHTML` tanpa sanitasi (satu-satunya pengecualian: JSON-LD hasil `JSON.stringify` dengan `<` di-escape).
- Menulis data pribadi (nama, telepon, email pengirim RFQ, alamat) ke URL, `console.log`, log Pino, atau analitik.
- Mengimpor modul server, DB, atau kripto di komponen `'use client'`.
- Menjalankan migrasi ke produksi, atau menulis `DROP`, `TRUNCATE`, dan migrasi destruktif tanpa persetujuan tertulis.
- Mengedit berkas migrasi yang sudah pernah diterapkan. Buat migrasi baru.
- Memakai nomor telepon, email, atau alamat asli pada seed dan test. Gunakan data fiktif.
- Menambah library, fitur, atau menyentuh berkas di luar issue.

## Aturan Akses (wajib ditegakkan di server)

- Peran: `admin` dan `employee` (karyawan). Matriks hak akses ada di PRD 6.4. Tidak ada pendaftaran publik dan tidak ada peran `user`.
- Karyawan tidak pernah menulis langsung ke tabel produk dan artikel. Semua perubahannya lewat `change_requests` (PRD Bagian 7).
- Setiap query by id menyertakan filter kepemilikan atau role di `WHERE` (PRD 6.7). Karyawan hanya membaca `change_requests` miliknya.
- Setiap Server Action memanggil `requireRole("admin")` atau `requireSession()` sebelum logika apa pun. Pemeriksaan role juga di Data Access Layer, bukan hanya di middleware atau UI.
- Pengaturan perusahaan, SMTP, anti-spam, penyimpanan, dan pengguna hanya untuk admin.
- Nilai rahasia (kata sandi SMTP, secret Turnstile) terenkripsi AES-256-GCM dan tidak pernah dikirim ke browser.

## Gaya Kode

- Struktur folder berbasis fitur sesuai PRD Bagian 4. Satu berkas satu tanggung jawab; fungsi maks sekitar 40 baris, komponen maks sekitar 150 baris.
- Berkas `kebab-case`, komponen `PascalCase`, fungsi `camelCase`, konstanta `SCREAMING_SNAKE_CASE`. Impor absolut via `@/`.
- Server Component secara default. `"use client"` hanya pada komponen daun.
- Tanpa magic number atau string: gunakan `src/lib/constants.ts` atau nilai dari database.
- Komentar menjelaskan _mengapa_, bukan _apa_.
- Warna hanya lewat token semantik (PRD Bagian 18). Dilarang kode hex atau kelas warna Tailwind mentah di komponen (dicek `check:colors`).
- Data produk, kontak, dan nomor WhatsApp dibaca dari database atau `company_settings`, tidak ditulis di komponen. Hanya satu nomor di seluruh tautan `wa.me/` (PRD 10.5).
- Nama domain dibaca dari env `SITE_URL`, tidak ditulis di kode.
- Halaman publik di-render server; `await params` dan `searchParams` (Next.js 15+); redirect permanen memakai status 308 (PRD 10.2).
- Commit memakai Conventional Commits.

## Alur Kerja Wajib (Fase dan GitHub)

Ikuti PRD Bagian 16 dan 22 tanpa pengecualian.

- **Urutan fase:** Fase A (frontend dengan data dummy) dulu. Jangan menyentuh backend (database, auth sungguhan, upload, SMTP, Turnstile server) sebelum pemilik menyatakan UI/UX "fix" secara tertulis. Lalu Fase B (backend dan mitigasi), kemudian Fase C (pengerasan dan rilis).
- **Data dummy:** fiktif, hanya di `src/mocks/`, diakses lewat interface service/repository. Hapus seluruhnya di akhir Fase B.
- **Issue dulu, kode kemudian.** Sebelum menambah, mengubah, atau menghapus berkas atau fungsi, buat issue GitHub berisi latar belakang, acuan PRD, rencana perubahan, dan kriteria selesai (templat di PRD 22.2). Kerjakan hanya sesuai issue. Bila ruang lingkup berubah, perbarui issue dulu.
- **Satu issue per unit kerja yang bisa di-review** (halaman, komponen, fitur kecil), bukan per fungsi.
- **Branch dan PR:** `<tipe>/<nomor-issue>-<slug>`, commit kecil dengan nomor issue, buka PR dengan `Closes #N` dan lampirkan hasil nyata Definition of Done. Berhenti setelah PR dibuka dan tunggu review pemilik.
- **Dilarang:** merge PR sendiri, push langsung ke `main`, force push, menyimpan token di berkas.
- **Prasyarat:** `gh auth status` harus sudah login sebagai akun pemilik. Bila belum, berhenti dan minta pemilik login.
- **Repositori baru:** konfirmasi nama dan visibilitas (default private) ke pemilik sebelum `gh repo create`, lalu siapkan berkas awal sesuai PRD 22.1.

### Status Eksekusi Terkini

- **Fase A0 (Fondasi & Tooling):** Selesai & Merged (PR #2). Next.js, Bun, Biome, Vitest, Playwright, semantic tokens, CI.
- **Fase A1 (Halaman Publik Lengkap):** Selesai 100% & Merged (PR #4, #6, #8, #10, #12, #14, #16, #18).
- **Fase A2 & A3 (Dashboard UI, Modul Operasional, & SEO Awal):** Selesai 100% & Merged. Seluruh rute dashboard, sidebar RBAC, form produk, artikel, poster, pembelian, FAQ, kategori, approval diff, dan pengaturan sistem selesai.
- **Fase B (Backend, Mitigasi, & Pengujian Terintegrasi):** Selesai 100% & Merged.
  - B1: Skema PostgreSQL Drizzle, Better Auth RBAC, rate limiting, mitigasi Turnstile server.
  - B2: CRUD server actions, Cloudinary media upload dengan magic bytes + WebP, email SMTP terenkripsi AES-256-GCM, RFQ processor, poster & pembelian scrap.
  - B3: Alur persetujuan karyawan (`change_requests`) dengan mutasi atomik dan uji konkurensi.
  - B4: Penghapusan seluruh mock fiktif dan pengujian akses per peran Playwright E2E 100% lulus (PR #83).
- **Fase C (Pengerasan & Rilis):** Sedang Berjalan.
  - Pembaruan README sesuai arsitektur terkini (Selesai & Merged, PR #84).
  - Audit Lighthouse, Rich Results, validasi `llms.txt`, favicon, dan `bun audit --prod` (Selesai & Merged, PR #85).
  - Konfirmasi klaim bisnis sebelum peluncuran resmi (Dokumen inventarisasi di `docs/konfirmasi-klaim-bisnis.md`, Issue #65).

## Kapan Wajib Berhenti

Berhenti total, jangan menulis kode, jelaskan masalah dan rekomendasi, lalu tunggu persetujuan tertulis bila: spesifikasi ambigu, butuh library di luar PRD Bagian 2, butuh berkas di luar issue, dokumen saling bertentangan, fase belum disetujui, atau butuh klaim bisnis yang belum dikonfirmasi pemilik (garansi, layanan 24 jam, jangkauan). Menebak adalah pelanggaran.

## Identitas Author dan Kebersihan Riwayat

- **Identitas git:** `user.name` = `GITHUB_USERNAME` dan `user.email` = email noreply GitHub pemilik (`ID+USERNAME@users.noreply.github.com`). Kedua nilai diisi pemilik. Bila belum diisi, berhenti dan tanyakan. Jangan mengarang atau memakai identitas lain.
- **Dilarang muncul di semua yang tampil di GitHub** (commit, issue, PR, komentar, review, README, komentar kode, nama branch, label, nama berkas): kata atau singkatan "AI", "bot", "assistant", "asisten", "LLM", "Claude", "GPT", "Copilot", "Gemini", "generated"; trailer `Co-Authored-By`; baris "Generated with ..."; tautan sesi. Tulis seperti pengembang biasa: ringkas, spesifik, bahasa konsisten.
- **Berkas internal jangan ter-commit:** `AGENTS.md`, `PRD.md`, dan folder konfigurasi tool (mis. `.claude/`, `.gemini/`). Tambahkan ke `.git/info/exclude` (lokal, tidak terlihat di repositori), bukan ke `.gitignore` yang ikut ter-commit. (PRD memuat kata terlarang di atas dan hanya untuk internal; pemilik dapat memutuskan lain secara tertulis.)
- **Cek sebelum setiap push** (hasil harus kosong):
  `git log --format='%an %ae%n%B' origin/main..HEAD | grep -iE '\b(ai|bot|llm|claude|gpt|copilot|assistant|asisten)\b|co-authored|generated'`
  `git diff origin/main..HEAD | grep -E '^\+' | grep -iE '\b(ai|bot|llm|claude|gpt|copilot|assistant|asisten)\b|generated'`
  Periksa juga `git status` dan `git diff --cached` agar berkas internal di atas tidak ikut.
