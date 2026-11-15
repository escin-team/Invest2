import type { Metadata } from 'next';
import { JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-outfit',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Nature Republic Admin — Dashboard Operasional & Keuangan',
  description:
    'Dashboard admin analitik Nature Republic Investasi untuk pemantauan user aktif, arus kas Top Up vs Withdrawal, antrean persetujuan transaksi, produk investasi, dan metrik keuangan.',
  openGraph: {
    title: 'Nature Republic Admin — Dashboard Operasional & Keuangan',
    description:
      'Dashboard admin analitik Nature Republic Investasi untuk pemantauan user aktif, arus kas Top Up vs Withdrawal, antrean persetujuan transaksi, produk investasi, dan metrik keuangan.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nature Republic Admin — Dashboard Operasional & Keuangan',
    description:
      'Dashboard admin analitik Nature Republic Investasi untuk pemantauan user aktif, arus kas Top Up vs Withdrawal, antrean persetujuan transaksi, produk investasi, dan metrik keuangan.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100"
      >
        {children}
      </body>
    </html>
  );
}
