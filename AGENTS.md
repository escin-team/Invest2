# AGENTS.md — Panduan Wajib Pengembangan FinVault Admin

Proyek: **FinVault Admin — Dashboard Operasional & Keuangan** (pemantauan user aktif, arus kas Top Up vs Withdrawal, antrean persetujuan transaksi, publikasi bukti withdrawal, manajemen investasi aktif, katalog produk investasi, kategori, cashback, komisi produk/referral, diagnostik & detail user, serta konfigurasi 8 level user).
Baca berkas ini di awal **setiap sesi** sebelum mengubah atau menambah kode.

---

## 1. Status & Konteks Proyek Saat Ini

- **Fase Berjalan — Fase A (Frontend + Pure Domain Layer In-Memory):**
  Seluruh tampilan admin (10 bagian navigasi + modal edit produk & halaman detail user) berjalan dengan state reaktif di memori dan dataset deterministik (`src/lib/*`), tervalidasi penuh dengan skema Zod (`src/lib/dashboard-schema.ts`).
- **Roadmap Fase B (Backend, Database, & RBAC Server-Side):**
  Integrasi penyimpanan persisten relasional (PostgreSQL / Drizzle ORM), autentikasi & sesi server-side, penegakan RBAC per peran di server, validasi upload berbasis magic bytes + re-encoding, proteksi anti-CSRF/rate-limit, dan audit log persisten.
- **Fase C (Pengerasan & Rilis):**
  Audit keamanan dependensi (`npm audit --omit=dev`), audit performa/aksesibilitas, verifikasi E2E lintas peran, dan kesiapan deploy produksi.

Bila ada permintaan yang bertentangan dengan aturan keamanan atau arsitektur di dokumen ini, **berhenti, jelaskan konfliknya, dan tunggu persetujuan tertulis pemilik**.

---

## 2. Stack Resmi

### Stack Aktif (Fase A)
- **Framework & Runtime:** Next.js 15+ (App Router), React 19, Node.js, npm.
- **Bahasa & Validasi:** TypeScript (`strict: true`), Zod (`zod`).
- **UI & Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@custom-variant dark`), `lucide-react`, `motion/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@hookform/resolvers`.
- **Testing & Kualitas:** `node:test` + `tsx` (`src/lib/dashboard-data.test.ts`), `tsc --noEmit`, ESLint (`eslint-config-next`).

### Stack Target Fase B (Belum Aktif — Perlu Persetujuan Saat Implementasi)
- **Database & ORM:** PostgreSQL / Cloud SQL + Drizzle ORM (parameterized queries).
- **Auth & Keamanan Server:** Autentikasi sesi server-side terverifikasi, `server-only`, enkripsi AES-256-GCM untuk rahasia operasional.
- **Upload & Notifikasi:** Validasi magic bytes (`file-type`), pemrosesan gambar (`sharp`), object storage privat/terkontrol, dan server-side email/audit trail.

Library di luar daftar di atas **tidak boleh** ditambahkan tanpa persetujuan tertulis pemilik.

---

## 3. Arsitektur Berkas & Modul Domain

- **`app/`**: Entrypoint Next.js App Router (`layout.tsx` untuk font `Outfit`, `Plus Jakarta Sans`, `JetBrains Mono`, metadata, & locale `id`; `globals.css` untuk Tailwind v4 dan varian `.dark`; `page.tsx` sebagai shell utama).
- **`src/lib/`**: Pure domain logic, skema Zod, engine agregasi, dan seed deterministik:
  - `dashboard-schema.ts` — Skema Zod & tipe untuk `DashboardSnapshot`, `QueueTransaction`, `InvestmentProduct`, `AdminUserRecord`, `AdminSession`, `WithdrawalPublication`, `AdminInvestmentRecord`, `ProductCategory`, `CashbackRule`, `ProductCommissionEntry`, dan `UserLevelRule`.
  - `dashboard-data.ts` — Agregasi metrik `7d`/`30d`/`90d`/`1y`, antrean transaksi, CRUD produk, dan ekspor CSV.
  - `user-diagnostics.ts` — Normalisasi nomor HP Indonesia (`+62`/`08`), deteksi operator, validasi WhatsApp & email/MX, pembuatan user baru, dan toggle status akun.
  - Modul domain terpisah: `investments.ts`, `categories.ts`, `cashbacks.ts`, `product-commissions.ts`, `user-levels.ts`, `withdrawal-publications.ts`, `product-images.ts`, `utils.ts`.
- **`src/components/`**: Komponen UI interaktif (`'use client'`) untuk seluruh modul dashboard serta primitif UI (`src/components/ui/`).
- **`public/assets/images/`**: Aset gambar produk lokal yang diselesaikan melalui `resolveProductImageSrc()`.

---

## 4. Sebelum Mulai Tugas

- Pastikan ada **issue GitHub** untuk tugas yang dikerjakan (lihat Bagian 9) dan kerjakan hanya sesuai ruang lingkup issue tersebut.
- Sebutkan modul/bagian proyek dan fase yang disentuh (mis. *"Modul Antrean Transaksi — Fase A"* atau *"Skema & RBAC Server — Fase B"*).
- Jalankan perubahan secara terukur; jangan menyentuh berkas di luar ruang lingkup tugas.

---

## 5. Definition of Done (Wajib Dijalankan & Dilaporkan)

Setiap perubahan kode dianggap selesai hanya bila seluruh pemeriksaan berikut lulus setelah edit terakhir, dan **hasil nyatanya dilaporkan**:

1. `npm run typecheck` (`tsc --noEmit`) lulus tanpa error.
2. `npm run lint` (`eslint .`) lulus tanpa error.
3. `npm run test` (`npx --yes tsx --test src/lib/dashboard-data.test.ts`) lulus 100%, termasuk test baru untuk skema Zod, pure service, normalisasi data, atau aturan akses yang disentuh.
4. `npm run build` (`next build`) lulus bersih.
5. Tiga status UI ditangani pada tampilan data: **Loading**, **Error**, dan **Empty**.
6. HTML semantik dan aksesibilitas (a11y) terpenuhi: gunakan elemen native (`<button>`, `<a href>`, `<label>` terhubung ke `<input>`, `<nav>`, `<main>`, `<section>`), `aria-label` unik untuk tombol ikon, dukungan keyboard (`Escape` pada modal), serta kontras warna memadai di mode terang dan gelap.

---

## 6. Larangan Keras (Kode & Keamanan)

- **Dilarang** memakai `any`, `@ts-ignore`, atau `@ts-nocheck`.
- **Dilarang** komentar pemotong seperti `// ... kode sebelumnya tetap sama`. Sajikan perubahan secara utuh dan valid.
- **Dilarang** meninggalkan fungsi kosong, variabel/impor tak terpakai, kode mati, atau `console.log` sisa debug.
- **Dilarang** menyimpan secret, API key, token, kredensial gateway, atau URL database di kode sumber. Seluruh env wajib divalidasi Zod di server dan didokumentasikan di `.env.example` tanpa nilai rahasia.
- **Dilarang** menggabungkan string SQL mentah (pada Fase B wajib Drizzle/parameterized query).
- **Dilarang** memakai `dangerouslySetInnerHTML` tanpa sanitasi (pengecualian tunggal: JSON-LD hasil `JSON.stringify` dengan karakter `<` di-escape). Pembuatan SVG dinamis (mis. struk bukti transfer) wajib melakukan XML escaping (`escapeXml`).
- **Dilarang** menulis data pribadi pengguna/PII (nama lengkap, email, nomor HP/WhatsApp, nomor rekening bank, saldo/nominal pribadi) ke URL query string, `console.log`, server log, atau analitik.
- **Dilarang** mengimpor modul server-only, DB, kripto, atau env rahasia (`GEMINI_API_KEY`, DB URL, secret enkripsi) ke komponen `'use client'` atau mengekspornya via `NEXT_PUBLIC_*`.
- **Dilarang** ekspor CSV yang rentan Formula/CSV Injection: nilai sel yang berasal dari input pengguna harus dinetralkan bila diawali `=`, `+`, `-`, `@`, `\t`, atau `\r` saat fitur ekspor tabel pengguna/transaksi ditambahkan.
- **Dilarang** menjalankan migrasi destruktif (`DROP`, `TRUNCATE`) atau mengubah berkas migrasi yang sudah diterapkan (Fase B).
- **Dilarang** memakai nomor telepon, email, rekening bank, atau data identitas asli pada seed dan test; gunakan hanya data fiktif.
- **Dilarang** menambah library atau fitur di luar persetujuan/issue.

---

## 7. Aturan Akses & RBAC

Peran resmi pada `AdminSessionSchema` adalah **`Super Admin`**, **`Finance Reviewer`**, dan **`Operations Lead`**. Tidak ada pendaftaran admin publik.

### Matriks Hak Akses Target (Wajib Ditegakkan di Server pada Fase B)
- **`Super Admin`**: Akses penuh seluruh modul operasional, manajemen user (buat/aktifkan/nonaktifkan), katalog produk, kategori, cashback, konfigurasi 8 level user, serta pengaturan sistem/rahasia.
- **`Finance Reviewer`**: Peninjauan & persetujuan `Antrean Transaksi` (Top Up & Withdrawal), verifikasi & publikasi bukti transfer (`Publikasi Withdrawal`), pemantauan arus kas, dan ekspor laporan keuangan. Tidak mengubah aturan produk/cashback/level user.
- **`Operations Lead`**: Pemantauan & pengelolaan `Produk Investasi`, `Category`, `Investment`, `Komisi Produk`, dan diagnostik `Data User` (tanpa otoritas pencairan/persetujuan withdrawal atau perubahan kredensial sistem).

### Kewajiban Implementasi Fase A vs Fase B
- **Fase A (Saat Ini):** `DEFAULT_ADMIN_SESSION` hanya representasi sesi demo di klien dan **bukan** pengaman akses. Jangan pernah menganggap penyembunyian elemen UI sebagai kontrol keamanan.
- **Fase B (Wajib Sebelum Produksi):**
  - Setiap Server Action dan Route Handler (`/api/*`) wajib memanggil `requireSession()` dan `requireRole([...])` di awal eksekusi sebelum logika apa pun.
  - Pemeriksaan hak akses juga wajib diterapkan di Data Access Layer (DAL), bukan hanya di middleware atau UI.
  - Setiap query `by id` wajib menyertakan filter kepemilikan/scope peran di klausa `WHERE`.
  - Perubahan status finansial (approve/reject Top Up & Withdrawal, perubahan status investasi, toggle akun user, publikasi bukti transfer) wajib berjalan dalam transaksi atomik dan mencatat jejak audit (`actor`, `reason`, `timestamp`).
  - Unggahan gambar produk & bukti withdrawal wajib melewati verifikasi magic bytes (`file-type`) dan re-encoding (`sharp`) di server; nilai rahasia terenkripsi AES-256-GCM dan tidak pernah dikirim ke browser.

---

## 8. Gaya Kode & Konvensi Next.js 15

- **Server vs Client Component:** Gunakan Server Component sebagai default pada rute `app/`. Gunakan `'use client'` hanya pada komponen interaktif/daun. Pada Next.js 15+, selalu `await params` dan `await searchParams` di rute/halaman dinamis.
- **Modularitas:** Satu berkas satu tanggung jawab; jaga ukuran fungsi tetap ringkas (~40 baris) dan pecah tampilan besar saat menambah atau merefaktor fitur agar mudah diuji dan direview.
- **Konvensi Penamaan:** Modul helper di `src/lib/` memakai `kebab-case`, komponen `PascalCase`, fungsi/variabel `camelCase`, konstanta `SCREAMING_SNAKE_CASE`. Gunakan impor absolut `@/`.
- **Tanpa Magic Number/String:** Simpan konstanta domain dan batas validasi secara terpusat (mis. `MAX_PRODUCT_IMAGE_BYTES`, `TIME_RANGE_OPTIONS`, `DEFAULT_USER_LEVEL_RULES`).
- **Komentar:** Jelaskan *mengapa*, bukan *apa*.
- **Konsistensi Format Finansial & Visual:** Gunakan `formatNumber`, `formatRupiah`, `formatSignedRupiah`, `formatCompactRupiah`, `formatProductCommission`, `formatProductStock`, serta kelas `font-mono-num` untuk angka tabular; dukung mode terang & gelap via token/kelas konsisten; selesaikan gambar produk melalui `resolveProductImageSrc`.
- **Commit:** Gunakan format Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

---

## 9. Alur Kerja Wajib (Fase & GitHub)

- **Urutan Fase:** Selesaikan dan validasi UI/UX serta pure domain logic di **Fase A** terlebih dahulu sebelum mengaktifkan koneksi database/auth produksi di **Fase B**, lalu lanjutkan pengerasan di **Fase C**.
- **Data Dummy:** Seluruh data seed fiktif di `src/lib/*` diakses melalui kontrak skema/service yang jelas agar dapat diganti ke DAL/database pada akhir Fase B tanpa merusak UI.
- **Issue Dulu, Kode Kemudian:** Sebelum menambah, mengubah, atau menghapus berkas/fitur, pastikan ada **issue GitHub** yang memuat latar belakang, ruang lingkup perubahan, dan kriteria selesai.
- **Branch & Pull Request:** Gunakan branch `<tipe>/<nomor-issue>-<slug>`, buat commit kecil yang merujuk nomor issue, buka PR dengan `Closes #N`, dan lampirkan hasil nyata perintah Definition of Done. Tunggu review pemilik setelah PR dibuka.
- **Dilarang:** Merge PR sendiri, push langsung ke `main`, force push, atau menyimpan token di berkas repositori.
- **Prasyarat:** Pastikan `gh auth status` aktif sebagai akun pemilik sebelum operasi GitHub; bila belum, berhenti dan minta pemilik login.

---

## 10. Kapan Wajib Berhenti

Berhenti total tanpa menulis kode, jelaskan masalah serta rekomendasi, dan tunggu persetujuan tertulis pemilik apabila:
- Spesifikasi fitur atau rumus perhitungan finansial/komisi/cashback ambigu atau saling bertentangan.
- Membutuhkan library baru di luar stack resmi.
- Perubahan menyentuh berkas di luar issue atau bertentangan dengan aturan keamanan di dokumen ini.
- Membutuhkan klaim bisnis, nomor kontak/rekening resmi, atau kredensial produksi yang belum dikonfirmasi pemilik.

---

## 11. Identitas Author & Kebersihan Riwayat Git

- **Identitas Git:** `user.name` dan `user.email` harus sesuai akun pemilik (`ID+USERNAME@users.noreply.github.com`). Bila belum dikonfigurasi, berhenti dan konfirmasikan ke pemilik.
- **Kebersihan Konten GitHub:** Dilarang memunculkan trailer `Co-Authored-By`, baris atribusi otomatis, tautan sesi, atau penanda tool asisten pada commit, issue, PR, komentar review, README, komentar kode, nama branch, maupun label. Tulis secara ringkas, spesifik, dan konsisten layaknya pengembang manusia.
- **Berkas Internal Lokal:** Pastikan folder konfigurasi tool lokal (mis. `.claude/`, `.gemini/`) dan berkas catatan lokal yang tidak semestinya dipublikasikan masuk ke `.git/info/exclude`, bukan membocorkan konfigurasi pribadi ke repo.
- **Pemeriksaan Sebelum Push** (hasil wajib kosong untuk jejak terlarang & secret):
  - Periksa `git status` dan `git diff --cached` untuk memastikan tidak ada secret, `.env`, atau berkas internal yang ikut ter-stage.
  - Periksa log & diff terhadap kata/trailer terlarang sebelum melakukan push.
