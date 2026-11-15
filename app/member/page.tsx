import type { Metadata } from 'next';
import { MemberAppView } from '@/src/components/member/MemberAppView';

export const metadata: Metadata = {
  title: 'Nature Republic Member — Aplikasi Investasi & Dompet Member',
  description:
    'Aplikasi member mobile-first Nature Republic Investasi untuk pengelolaan saldo, klaim imbal hasil harian, top up, penarikan, dan penukaran voucher.',
};

export default function MemberAppPage() {
  return <MemberAppView />;
}
