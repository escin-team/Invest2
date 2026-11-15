'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  HelpCircle,
  Link2,
  Loader2,
  Mail,
  PackageCheck,
  Power,
  ShieldAlert,
  UserPlus,
  X,
} from 'lucide-react';
import { BankLogoBadge } from '@/src/components/BankLogoBadge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type {
  AdminUserRecord,
  InvestmentProduct,
  ProductCommissionEntry,
} from '@/src/lib/dashboard-schema';
import { getUserProductCommissionSummary } from '@/src/lib/product-commissions';
import { resolveProductImageSrc } from '@/src/lib/product-images';
import {
  checkUserEmailLive,
  checkWhatsAppNumber,
  normalizeIndonesianPhone,
  type DiagnosticCheckResult,
} from '@/src/lib/user-diagnostics';
import {
  cn,
  formatNumber,
  formatProductCommission,
  formatRupiah,
} from '@/src/lib/utils';

type DetailTab =
  | 'topup'
  | 'withdrawal'
  | 'investasi'
  | 'transaksi'
  | 'bank'
  | 'referral'
  | 'komisi_produk';

interface UserDetailViewProps {
  user: AdminUserRecord;
  allUsers: AdminUserRecord[];
  productCommissions: ProductCommissionEntry[];
  products: InvestmentProduct[];
  onBack: () => void;
  onToggleAccountStatus: (userId: string, reason?: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

interface DiagnosticState {
  result: DiagnosticCheckResult;
  checkedAt: string;
}

function formatCheckTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Z"
        fill="#25D366"
      />
      <path
        d="M17.47 15.99c-.23.64-1.33 1.22-1.85 1.29-.47.07-1.06.1-1.71-.11-.4-.13-.91-.3-1.56-.58-2.74-1.18-4.53-3.95-4.67-4.13-.14-.18-1.12-1.49-1.12-2.84 0-1.35.71-2.01.96-2.29.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.47.23.55.78 1.91.85 2.05.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.21 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.6.75 1.87.89.27.14.46.21.53.32.07.12.07.66-.16 1.3Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function DiagnosticStatusIcon({ status }: { status: 'pass' | 'fail' | 'unknown' }) {
  if (status === 'pass') {
    return (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (status === 'fail') {
    return (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}

export function UserDetailView({
  user,
  allUsers,
  productCommissions,
  products,
  onBack,
  onToggleAccountStatus,
}: UserDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('topup');
  const [phoneCheck, setPhoneCheck] = useState<DiagnosticState | null>(null);
  const [emailCheck, setEmailCheck] = useState<DiagnosticState | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [confirmingStatusToggle, setConfirmingStatusToggle] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);

  const userCommissionSummary = getUserProductCommissionSummary(
    user,
    productCommissions,
    products
  );

  const phoneTimerRef = useRef<number | null>(null);
  const activeUserIdRef = useRef(user.id);

  useEffect(() => {
    activeUserIdRef.current = user.id;

    return () => {
      if (phoneTimerRef.current !== null) {
        window.clearTimeout(phoneTimerRef.current);
        phoneTimerRef.current = null;
      }
    };
  }, [user.id]);

  const normalizedPhone = normalizeIndonesianPhone(user.whatsappRaw || user.phone);
  const whatsappUrl = `https://wa.me/${normalizedPhone.internationalDigits}`;

  const handleRunPhoneCheck = () => {
    if (checkingPhone) return;
    if (phoneTimerRef.current !== null) {
      window.clearTimeout(phoneTimerRef.current);
    }
    const targetId = user.id;
    setCheckingPhone(true);
    phoneTimerRef.current = window.setTimeout(() => {
      phoneTimerRef.current = null;
      if (activeUserIdRef.current !== targetId) return;
      const result = checkWhatsAppNumber(user, allUsers);
      setPhoneCheck({
        result,
        checkedAt: formatCheckTime(new Date()),
      });
      setCheckingPhone(false);
    }, 240);
  };

  const handleRunEmailCheck = async () => {
    if (checkingEmail) return;
    const targetId = user.id;
    setCheckingEmail(true);
    const minDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 220);
    });
    try {
      const [result] = await Promise.all([checkUserEmailLive(user, allUsers), minDelay]);
      if (activeUserIdRef.current !== targetId) return;
      setEmailCheck({
        result,
        checkedAt: formatCheckTime(new Date()),
      });
    } finally {
      if (activeUserIdRef.current === targetId) {
        setCheckingEmail(false);
      }
    }
  };

  const handleConfirmToggleStatus = () => {
    onToggleAccountStatus(user.id, statusReason);
    setConfirmingStatusToggle(false);
    setStatusReason('');
  };

  const metricCards: ReadonlyArray<{
    label: string;
    value: string;
    subtext: string;
    tone?: 'default' | 'accent' | 'emerald' | 'amber';
  }> = [
    {
      label: 'Saldo Deposit',
      value: formatRupiah(user.depositBalance),
      subtext: 'Siap dipakai beli produk',
      tone: 'accent',
    },
    {
      label: 'Saldo Withdrawable',
      value: formatRupiah(user.withdrawableBalance),
      subtext: 'Bisa ditarik user',
      tone: 'emerald',
    },
    {
      label: 'Total Pernah Top Up',
      value: formatRupiah(user.totalTopUp),
      subtext: `${formatNumber(user.totalTopUpCount)} transaksi`,
    },
    {
      label: 'Total Withdrawal',
      value: formatRupiah(user.totalWithdrawal),
      subtext: `${formatNumber(user.totalWithdrawalCount)} pengajuan`,
    },
    {
      label: 'Total Investasi (Modal)',
      value: formatRupiah(user.totalInvestmentModal),
      subtext: `${formatNumber(user.totalInvestmentCount)} pembelian · ${formatNumber(user.activeInvestmentCount)} masih aktif`,
    },
    {
      label: 'Total Akan Diterima',
      value: formatRupiah(user.totalExpectedReturn),
      subtext: 'Estimasi hasil seluruh investasi',
    },
    {
      label: 'Total Sudah Didapat',
      value: formatRupiah(user.totalEarnedReturn),
      subtext: 'Dari klaim harian yang berhasil',
      tone: 'emerald',
    },
    {
      label: 'Sisa Akan Didapat',
      value: formatRupiah(user.remainingExpectedReturn),
      subtext: 'Estimasi dikurangi yang sudah didapat',
    },
    {
      label: 'Cashback Diterima',
      value: formatRupiah(user.cashbackReceived),
      subtext: 'Dari pembelian produk',
    },
    {
      label: 'Komisi Referral Diterima',
      value: formatRupiah(user.referralCommissionReceived),
      subtext: 'Komisi dari downline yang berbelanja',
    },
    {
      label: 'Voucher Diklaim',
      value: formatRupiah(user.voucherClaimed),
      subtext: 'Nilai voucher yang sudah dipakai',
    },
  ];

  const tabs: ReadonlyArray<{ id: DetailTab; label: string; count: number }> = [
    { id: 'topup', label: 'Top-Up', count: user.topUps.length },
    { id: 'withdrawal', label: 'Withdrawal', count: user.withdrawals.length },
    { id: 'investasi', label: 'Investasi', count: user.investments.length },
    { id: 'transaksi', label: 'Transaksi', count: user.transactions.length },
    { id: 'bank', label: 'Bank', count: user.banks.length },
    { id: 'referral', label: 'Referral', count: user.referrals.length },
    {
      id: 'komisi_produk',
      label: 'Komisi Produk',
      count: userCommissionSummary.commissionCount,
    },
  ];

  const handleCopyUserReferralLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(userCommissionSummary.referralLink).catch(() => {});
    }
    setCopiedReferralLink(true);
    window.setTimeout(() => setCopiedReferralLink(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali ke Data User</span>
          </Button>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            Detail User
          </h1>
        </div>
      </div>

      {/* Identity & Actions Card */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-700 font-display text-xl font-bold text-white dark:bg-purple-600"
                aria-hidden="true"
              >
                {getInitials(user.name)}
              </div>

              <div className="min-w-0 space-y-2">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </h2>
                  <p className="mt-0.5 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                    #{user.userNumber} · Daftar {user.registeredAt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md border px-2 py-0.5',
                      user.emailVerified
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400'
                    )}
                  >
                    {user.emailVerified ? 'Email terverifikasi' : 'Email belum terverifikasi'}
                  </span>

                  <span
                    className={cn(
                      'inline-flex items-center rounded-md border px-2 py-0.5',
                      user.accountStatus === 'aktif'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400'
                    )}
                  >
                    {user.accountStatus === 'aktif'
                      ? 'Aktif'
                      : `Nonaktif · ${user.inactiveDays} hari`}
                  </span>

                  {user.invitedBy && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                      <UserPlus className="h-3 w-3" aria-hidden="true" />
                      <span>Diundang oleh {user.invitedBy}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
              >
                <WhatsAppLogo className="h-4 w-4 shrink-0" />
                <span>Chat WhatsApp</span>
              </a>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmingStatusToggle((prev) => !prev)}
                className={cn(
                  'h-9',
                  user.accountStatus === 'aktif'
                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                )}
              >
                <Power className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{user.accountStatus === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}</span>
              </Button>
            </div>
          </div>

          {confirmingStatusToggle && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label
                  htmlFor="user-status-reason"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {user.accountStatus === 'aktif'
                    ? `Alasan penonaktifan akun ${user.name} (opsional)`
                    : `Alasan pengaktifan kembali akun ${user.name} (opsional)`}
                </label>
                <Input
                  id="user-status-reason"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={
                    user.accountStatus === 'aktif'
                      ? 'Contoh: Verifikasi keamanan atau permintaan user...'
                      : 'Contoh: Verifikasi identitas selesai...'
                  }
                  className="mt-1.5 h-9"
                />
              </div>
              <div className="flex items-center gap-2 self-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmingStatusToggle(false);
                    setStatusReason('');
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant={user.accountStatus === 'aktif' ? 'destructive' : 'primary'}
                  size="sm"
                  onClick={handleConfirmToggleStatus}
                >
                  {user.accountStatus === 'aktif' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 11 Financial & Activity Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <p
                className={cn(
                  'mt-2 font-mono-num text-xl font-bold tracking-tight',
                  card.tone === 'accent'
                    ? 'text-purple-700 dark:text-purple-400'
                    : card.tone === 'emerald'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-slate-100'
                )}
              >
                {card.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diagnostics: Nomor WhatsApp & Email */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Nomor WhatsApp Card */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <WhatsAppLogo className="h-4 w-4 shrink-0" />
                  <CardTitle className="text-base">Nomor WhatsApp</CardTitle>
                </div>
                <p className="mt-1 font-mono-num text-lg font-bold text-slate-900 dark:text-slate-100">
                  {normalizedPhone.internationalDigits}
                </p>
                <CardDescription className="mt-0.5 font-mono-num text-xs">
                  Format internasional: {normalizedPhone.plusInternational}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunPhoneCheck}
                disabled={checkingPhone}
              >
                {checkingPhone ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <WhatsAppLogo className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{checkingPhone ? 'Memeriksa...' : 'Cek Nomor'}</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            {phoneCheck ? (
              <>
                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                    phoneCheck.result.isValid
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
                  )}
                >
                  <span>{phoneCheck.result.summary}</span>
                  <span className="font-mono-num text-[11px] opacity-80">
                    Dicek pukul {phoneCheck.checkedAt}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {phoneCheck.result.checks.map((item) => (
                    <li key={item.id} className="flex items-start gap-2.5 text-xs">
                      <DiagnosticStatusIcon status={item.status} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-slate-500 dark:text-slate-400">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                Belum diperiksa. Klik tombol <span className="font-semibold text-slate-900 dark:text-slate-200">Cek Nomor</span> di atas untuk mengecek format, perkiraan operator, dan bentrok dengan user lain.
              </div>
            )}

            <p className="border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Tombol Cek Nomor memeriksa format, perkiraan operator, dan bentrok dengan user lain.
              Keberadaan akun WhatsApp tidak bisa dipastikan gratis dari server — karena itu tombol
              Chat WhatsApp di atas membuka chat, dan WhatsApp sendiri akan memberi tahu kalau
              nomornya tidak terdaftar.
            </p>
          </CardContent>
        </Card>

        {/* Email Card */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                  <CardTitle className="text-base">Email</CardTitle>
                </div>
                <p className="mt-1 break-all text-base font-bold text-slate-900 dark:text-slate-100">
                  {user.email}
                </p>
                <CardDescription className="mt-0.5 text-xs">
                  {user.emailVerified ? 'Sudah diverifikasi sistem' : 'Belum diverifikasi sistem'}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunEmailCheck}
                disabled={checkingEmail}
              >
                {checkingEmail ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{checkingEmail ? 'Memeriksa...' : 'Cek Email'}</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            {emailCheck ? (
              <>
                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                    emailCheck.result.isValid
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
                  )}
                >
                  <span>{emailCheck.result.summary}</span>
                  <span className="font-mono-num text-[11px] opacity-80">
                    Dicek pukul {emailCheck.checkedAt}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {emailCheck.result.checks.map((item) => (
                    <li key={item.id} className="flex items-start gap-2.5 text-xs">
                      <DiagnosticStatusIcon status={item.status} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.label}
                        </p>
                        <p className="mt-0.5 break-all text-slate-500 dark:text-slate-400">
                          {item.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                Belum diperiksa. Klik tombol <span className="font-semibold text-slate-900 dark:text-slate-200">Cek Email</span> di atas untuk memvalidasi format alamat, record MX/domain, domain sekali pakai, dan bentrok user.
              </div>
            )}

            <p className="border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Tombol Cek Email memeriksa format alamat, record MX/domain, daftar domain email
              sementara, dan apakah email ini dipakai user lain.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Status Akun */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <CardTitle className="text-base">Riwayat Status Akun</CardTitle>
          <CardDescription>
            Catatan permanen setiap penonaktifan dan aktivasi kembali akun ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {user.statusHistory.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              <ShieldAlert className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span>Belum ada riwayat status. Akun ini belum pernah dinonaktifkan.</span>
            </div>
          ) : (
            <ul className="space-y-3">
              {user.statusHistory.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span
                      className={cn(
                        'font-semibold',
                        item.action === 'dinonaktifkan'
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      )}
                    >
                      {item.action === 'dinonaktifkan' ? 'Dinonaktifkan' : 'Diaktifkan kembali'}
                    </span>
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-700 dark:text-slate-300">{item.reason}</span>
                  </div>
                  <div className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                    {item.timestamp} · {item.actor}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Bottom Activity Tabs */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-3 dark:border-slate-800/80">
          <div
            role="tablist"
            aria-label="Detail aktivitas user"
            className="flex flex-wrap items-center gap-1.5"
          >
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                    isSelected
                      ? 'border-purple-700 bg-purple-700 text-white dark:border-purple-600 dark:bg-purple-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'font-mono-num text-[11px] font-semibold',
                      isSelected ? 'text-slate-200' : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {formatNumber(tab.count)}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {activeTab === 'topup' &&
            (user.topUps.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada data Top-Up untuk user ini.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Kanal</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.topUps.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono-num text-xs font-medium">{row.id}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <BankLogoBadge bankOrChannelName={row.channel} size="sm" />
                          <span>{row.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono-num text-xs text-slate-500">{row.createdAt}</TableCell>
                      <TableCell className="text-right font-mono-num text-xs font-semibold">
                        {formatRupiah(row.amount)}
                      </TableCell>
                      <TableCell className="text-xs capitalize">{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {activeTab === 'withdrawal' &&
            (user.withdrawals.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada pengajuan Withdrawal untuk user ini.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.withdrawals.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono-num text-xs font-medium">{row.id}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <BankLogoBadge bankOrChannelName={row.destination} size="sm" />
                          <span>{row.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono-num text-xs text-slate-500">{row.createdAt}</TableCell>
                      <TableCell className="text-right font-mono-num text-xs font-semibold">
                        {formatRupiah(row.amount)}
                      </TableCell>
                      <TableCell className="text-xs capitalize">{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {activeTab === 'investasi' &&
            (user.investments.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada pembelian investasi untuk user ini.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead className="text-right">Modal</TableHead>
                    <TableHead className="text-right">Sudah Didapat</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.investments.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono-num text-xs font-medium">{row.id}</TableCell>
                      <TableCell className="text-xs font-medium">{row.productName}</TableCell>
                      <TableCell className="font-mono-num text-xs text-slate-500">{row.startedAt}</TableCell>
                      <TableCell className="text-right font-mono-num text-xs">{formatRupiah(row.capital)}</TableCell>
                      <TableCell className="text-right font-mono-num text-xs text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(row.earnedReturn)}
                      </TableCell>
                      <TableCell className="text-xs capitalize">{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {activeTab === 'transaksi' &&
            (user.transactions.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada riwayat transaksi untuk user ini.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.transactions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono-num text-xs font-medium">{row.id}</TableCell>
                      <TableCell className="text-xs font-medium">{row.type}</TableCell>
                      <TableCell className="text-xs">{row.description}</TableCell>
                      <TableCell className="font-mono-num text-xs text-slate-500">{row.createdAt}</TableCell>
                      <TableCell className="text-right font-mono-num text-xs font-semibold">
                        {formatRupiah(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {activeTab === 'bank' &&
            (user.banks.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada rekening bank terdaftar untuk user ini.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank</TableHead>
                    <TableHead>Nomor Rekening</TableHead>
                    <TableHead>Pemilik Rekening</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.banks.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-2.5">
                          <BankLogoBadge bankOrChannelName={row.bankName} size="sm" />
                          <span>{row.bankName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono-num text-xs">{row.accountNumber}</TableCell>
                      <TableCell className="text-xs">{row.accountHolder}</TableCell>
                      <TableCell className="text-xs">{row.isPrimary ? 'Utama' : 'Sekunder'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {activeTab === 'referral' &&
            (user.referrals.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada referral downline untuk user ini.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User Terundang</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead className="text-right">Komisi</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.referrals.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono-num text-xs font-medium">{row.id}</TableCell>
                      <TableCell className="text-xs font-medium">{row.userName}</TableCell>
                      <TableCell className="font-mono-num text-xs text-slate-500">{row.joinedAt}</TableCell>
                      <TableCell className="text-right font-mono-num text-xs text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(row.commissionEarned)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.status === 'aktif' ? 'Aktif' : 'Belum transaksi'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {activeTab === 'komisi_produk' && (
            <div className="space-y-4 p-5">
              {/* Referral Code & Link + Summary */}
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Link2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    <span>Link Referal Member ({userCommissionSummary.referralCode})</span>
                  </p>
                  <p className="mt-1 truncate font-mono-num text-xs text-slate-600 dark:text-slate-400">
                    {userCommissionSummary.referralLink}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUserReferralLink}
                  className="shrink-0"
                >
                  {copiedReferralLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Salin Link</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Jumlah Komisi</p>
                  <p className="mt-1 font-mono-num text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatNumber(userCommissionSummary.commissionCount)} kali
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Diterima</p>
                  <p className="mt-1 font-mono-num text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(userCommissionSummary.totalReceived)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Komisi Terakhir</p>
                  <p className="mt-1 font-mono-num text-lg font-bold text-slate-900 dark:text-slate-100">
                    {userCommissionSummary.latestCommission
                      ? formatRupiah(userCommissionSummary.latestCommission.commissionAmount)
                      : 'Rp 0'}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {userCommissionSummary.latestCommission
                      ? `${userCommissionSummary.latestCommission.productName} · ${userCommissionSummary.latestCommission.earnedAt}`
                      : 'Belum ada komisi produk masuk'}
                  </p>
                </div>
              </div>

              {userCommissionSummary.entries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Belum ada komisi produk yang diterima untuk user ini.
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Komisi akan masuk otomatis apabila user yang mendaftar melalui kode referal{' '}
                    <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-200">
                      {userCommissionSummary.referralCode}
                    </span>{' '}
                    membeli produk dengan komisi aktif.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-3 text-[11px]">Produk Investasi</TableHead>
                        <TableHead className="px-2 text-[11px]">User Terdaftar</TableHead>
                        <TableHead className="px-2 text-right text-[11px]">Pembelian</TableHead>
                        <TableHead className="px-2 text-right text-[11px]">Tarif Produk</TableHead>
                        <TableHead className="px-2 text-right text-[11px]">Komisi</TableHead>
                        <TableHead className="px-3 text-[11px]">Waktu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userCommissionSummary.entries.map((entry) => {
                        const thumbSrc = entry.matchedProduct
                          ? resolveProductImageSrc({
                              id: entry.matchedProduct.id,
                              imageUrl: entry.matchedProduct.imageUrl,
                            })
                          : '';
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                {thumbSrc ? (
                                  <img
                                    src={thumbSrc}
                                    alt={entry.productName}
                                    referrerPolicy="no-referrer"
                                    className="h-8 w-10 shrink-0 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                                  />
                                ) : (
                                  <div
                                    className="flex h-8 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                                    aria-hidden="true"
                                  >
                                    <PackageCheck className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    {entry.productName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="font-mono-num">{entry.productId}</span>
                                    <span aria-hidden="true"> · </span>
                                    <span
                                      className={
                                        entry.isProductCommissionCurrentlyActive
                                          ? 'text-emerald-700 dark:text-emerald-400'
                                          : 'text-slate-500 dark:text-slate-400'
                                      }
                                    >
                                      {entry.isProductCommissionCurrentlyActive
                                        ? 'Aktif di katalog'
                                        : 'Nonaktif di katalog'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2.5">
                              <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                {entry.referredUserName}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {entry.referredUserEmail}
                              </p>
                            </TableCell>
                            <TableCell className="px-2 py-2.5 text-right font-mono-num text-xs whitespace-nowrap">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {formatRupiah(entry.purchaseAmount)}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {entry.purchaseUnits} unit
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2.5 text-right font-mono-num text-xs text-purple-700 dark:text-purple-400 whitespace-nowrap">
                              {formatProductCommission(
                                entry.commissionRate,
                                entry.commissionType
                              )}
                            </TableCell>
                            <TableCell className="px-2 py-2.5 text-right font-mono-num text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                              {formatRupiah(entry.commissionAmount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-mono-num text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {entry.earnedAt}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
