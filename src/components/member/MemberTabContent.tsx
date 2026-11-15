'use client';

import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  BellRing,
  Check,
  ChevronRight,
  Coins,
  Copy,
  Eye,
  EyeOff,
  FileCheck2,
  Gift,
  Landmark,
  LayoutGrid,
  Lock,
  LogOut,
  Megaphone,
  Moon,
  Plus,
  Share2,
  ShieldCheck,
  Sun,
  Ticket,
  TrendingUp,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { BankLogoBadge } from '@/src/components/BankLogoBadge';
import type {
  AnnouncementRecord,
  InvestmentProduct,
  MarqueeDurationSeconds,
  ProductCategory,
  UserLevelRule,
  WithdrawalPublication,
} from '@/src/lib/dashboard-schema';
import {
  buildMemberMarqueeText,
  getMarqueeDurationClassName,
} from '@/src/lib/announcements';
import type {
  MemberActiveInvestment,
  MemberAppState,
  MemberTabId,
  MemberTransactionItem,
} from '@/src/lib/member-app';
import {
  buildReferralRegistrationLink,
  deriveUserReferralCode,
} from '@/src/lib/product-commissions';
import { resolveProductImageSrc } from '@/src/lib/product-images';
import {
  ALL_USER_LEVELS,
  canUserLevelPurchaseProduct,
  countUserActiveReferrals,
  evaluateUserLevel,
  formatAllowedLevelsLabel,
  formatProductVipLevelBadge,
  formatSalaryPeriodLabel,
  type UserLevelEvaluation,
} from '@/src/lib/user-levels';
import {
  cn,
  formatCompactRupiah,
  formatNumber,
  formatProductCommission,
  formatRupiah,
  formatSignedRupiah,
} from '@/src/lib/utils';

function ProductThumb({ product }: { product: Pick<InvestmentProduct, 'id' | 'name' | 'imageUrl'> }) {
  const [failed, setFailed] = useState(false);
  const src = resolveProductImageSrc(product);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-700 to-amber-500 text-xs font-bold text-white">
        {product.id}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={product.name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

function ProductVipCornerBadge({
  allowedLevels,
  isEligible,
}: {
  allowedLevels: ReadonlyArray<number>;
  isEligible: boolean;
}) {
  const badgeLabel = formatProductVipLevelBadge(allowedLevels);
  const isRestricted = allowedLevels.length < ALL_USER_LEVELS.length;

  return (
    <span
      className={cn(
        'pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono-num text-[11px] font-bold tracking-tight shadow-sm backdrop-blur-xs',
        !isEligible
          ? 'border border-amber-300/70 bg-amber-500/95 text-slate-950'
          : isRestricted
            ? 'border border-amber-300/60 bg-slate-950/85 text-amber-300'
            : 'border border-white/15 bg-slate-950/80 text-white'
      )}
    >
      {isEligible ? (
        <Award className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span>{badgeLabel}</span>
    </span>
  );
}

interface BerandaTabProps {
  state: MemberAppState;
  announcements: ReadonlyArray<AnnouncementRecord>;
  marqueeDuration: MarqueeDurationSeconds;
  products: ReadonlyArray<InvestmentProduct>;
  memberLevel: number;
  activeVipRule: UserLevelRule;
  vipEvaluation: UserLevelEvaluation;
  onOpenTopUp: () => void;
  onOpenWithdraw: () => void;
  onOpenVoucher: () => void;
  onOpenAnnouncements: () => void;
  onOpenAdPopup: () => void;
  onClaimDaily: (investmentId: string) => void;
  onSelectProduct: (product: InvestmentProduct) => void;
  onSwitchTab: (tab: MemberTabId) => void;
}

export function BerandaTab({
  state,
  announcements,
  marqueeDuration,
  products,
  memberLevel,
  activeVipRule,
  vipEvaluation,
  onOpenTopUp,
  onOpenWithdraw,
  onOpenVoucher,
  onOpenAnnouncements,
  onOpenAdPopup,
  onClaimDaily,
  onSelectProduct,
  onSwitchTab,
}: BerandaTabProps) {
  const [hideBalances, setHideBalances] = useState(false);

  const marqueeText = buildMemberMarqueeText(announcements);
  const durationClass = getMarqueeDurationClassName(marqueeDuration);
  const claimableInvestments = state.activeInvestments.filter(
    (inv) => inv.status === 'aktif' && !inv.claimedToday
  );
  const featuredProducts = products.filter((p) => p.status === 'aktif').slice(0, 4);
  const dailyYieldPotential = state.activeInvestments
    .filter((inv) => inv.status === 'aktif')
    .reduce((sum, inv) => sum + inv.dailyClaimIncome, 0);

  return (
    <div className="space-y-5">
      {/* Live Running Announcement Ticker (from Admin Konten -> Pengumuman) */}
      {marqueeText && (
        <button
          type="button"
          onClick={onOpenAnnouncements}
          className="flex min-h-[44px] w-full items-center gap-2.5 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/90 px-3.5 text-left transition-colors hover:bg-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/35 dark:hover:bg-amber-950/50 cursor-pointer"
          aria-label="Lihat detail pengumuman member"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <BellRing className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="relative flex-1 overflow-hidden whitespace-nowrap">
            <div className={cn('animate-finvault-marquee text-xs font-medium text-amber-950 dark:text-amber-100', durationClass)}>
              <span className="pr-12">{marqueeText}</span>
              <span className="pr-12" aria-hidden="true">
                {marqueeText}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
        </button>
      )}

      {/* Top Desktop Split: Hero Dompet Android Card + Daily Claim Missions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Elevated Material Wallet Card */}
        <section
          aria-label="Ringkasan Dompet Member"
          className="rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900 to-slate-950 p-5 text-white shadow-sm dark:border dark:border-purple-800/60 lg:col-span-7"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeVipRule.badgeImageUrl}
                  alt={`Logo VIP ${activeVipRule.level} ${activeVipRule.tierTitle}`}
                  className="h-9 w-9 shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-300">
                    VIP {activeVipRule.level} · {activeVipRule.tierTitle}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Maks Withdraw: {activeVipRule.maxWithdrawal > 0 ? formatCompactRupiah(activeVipRule.maxWithdrawal) : 'Tanpa Batas'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-300">
                Saldo Bisa Ditarik
              </p>
              <p className="mt-0.5 font-mono-num text-2xl font-bold tracking-tight sm:text-3xl">
                {hideBalances
                  ? 'Rp ••••••••'
                  : formatRupiah(state.member.withdrawableBalance)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHideBalances((prev) => !prev)}
              aria-label={hideBalances ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200 hover:bg-white/20 active:scale-95 cursor-pointer"
            >
              {hideBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white/8 p-3.5">
            <div>
              <p className="text-[11px] text-slate-300">Saldo Deposit</p>
              <p className="mt-0.5 font-mono-num text-sm font-bold text-white">
                {hideBalances ? 'Rp ••••••' : formatRupiah(state.member.depositBalance)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-300">Potensi Hasil / Hari</p>
              <p className="mt-0.5 font-mono-num text-sm font-bold text-emerald-400">
                +{hideBalances ? 'Rp ••••' : formatRupiah(dailyYieldPotential)}
              </p>
            </div>
          </div>

          {vipEvaluation.nextRule && (
            <button
              type="button"
              onClick={() => onSwitchTab('akun')}
              className="mt-3 w-full rounded-2xl bg-white/8 p-3 text-left transition-colors hover:bg-white/12 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-100">
                  Progres ke VIP {vipEvaluation.nextRule.level} ({vipEvaluation.nextRule.tierTitle})
                </span>
                <span className="font-mono-num font-bold text-amber-300">
                  {vipEvaluation.overallProgressPercent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`Progres menuju VIP ${vipEvaluation.nextRule.level}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={vipEvaluation.overallProgressPercent}
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-purple-400 transition-all duration-300"
                  style={{ width: `${vipEvaluation.overallProgressPercent}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-300">
                <span>
                  {vipEvaluation.missingReferrals > 0
                    ? `Kurang ${formatNumber(vipEvaluation.missingReferrals)} referral aktif`
                    : 'Syarat referral terpenuhi'}
                  {vipEvaluation.missingPurchase > 0
                    ? ` · Deposit ${formatCompactRupiah(vipEvaluation.missingPurchase)} lagi`
                    : ''}
                </span>
                <span className="shrink-0 font-semibold text-amber-300">Detail</span>
              </div>
            </button>
          )}

          {/* 4 Thumb-Friendly Android Quick Action Tiles */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={onOpenTopUp}
              className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/10 px-1 py-2 transition-colors hover:bg-white/15 active:scale-95 cursor-pointer"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-purple-950">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-semibold text-white">Top Up</span>
            </button>

            <button
              type="button"
              onClick={onOpenWithdraw}
              className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/10 px-1 py-2 transition-colors hover:bg-white/15 active:scale-95 cursor-pointer"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-semibold text-white">Tarik</span>
            </button>

            <button
              type="button"
              onClick={onOpenVoucher}
              className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/10 px-1 py-2 transition-colors hover:bg-white/15 active:scale-95 cursor-pointer"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300 text-purple-950">
                <Ticket className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-semibold text-white">Voucher</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab('akun')}
              className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/10 px-1 py-2 transition-colors hover:bg-white/15 active:scale-95 cursor-pointer"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 text-white">
                <UserPlus className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-semibold text-white">Undang</span>
            </button>
          </div>
        </section>

        {/* Daily Yield Claim & Promo Banner Column */}
        <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Klaim Imbal Harian
              </h2>
              <button
                type="button"
                onClick={() => onSwitchTab('aset')}
                className="min-h-[36px] text-xs font-semibold text-purple-700 hover:underline dark:text-amber-300 cursor-pointer"
              >
                Lihat Portofolio
              </button>
            </div>

            {claimableInvestments.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 dark:border-purple-900/50 dark:bg-purple-950/30">
                <p className="text-sm font-semibold text-purple-950 dark:text-amber-200">
                  Semua imbal hasil hari ini sudah diklaim
                </p>
                <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                  Kembali lagi besok atau tambah paket investasi baru di tab Produk.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {claimableInvestments.slice(0, 2).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {inv.productName}
                      </p>
                      <p className="mt-0.5 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        Hari {inv.claimsCompleted}/{inv.durationDays} ·{' '}
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          +{formatRupiah(inv.dailyClaimIncome)}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onClaimDaily(inv.id)}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-purple-700 px-3.5 text-xs font-semibold text-white transition-transform hover:bg-purple-800 active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
                    >
                      Klaim
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenAdPopup}
            className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 cursor-pointer"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                  Promo Reward Member Aktif
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  Ketuk untuk lihat poster promo &amp; reward
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </button>
        </section>
      </div>

      {/* Featured Products Grid */}
      <section aria-label="Produk Investasi Pilihan" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Paket Investasi Populer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Imbal hasil harian otomatis masuk ke Saldo Bisa Ditarik
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSwitchTab('produk')}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl px-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/40 cursor-pointer"
          >
            <span>Semua</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => {
            const levelLabel = formatAllowedLevelsLabel(product.allowedLevels);
            const isEligible = canUserLevelPurchaseProduct(memberLevel, product.allowedLevels);
            return (
              <article
                key={product.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800">
                  <ProductThumb product={product} />
                  <ProductVipCornerBadge
                    allowedLevels={product.allowedLevels}
                    isEligible={isEligible}
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {product.category} · {product.tenorDays} hari · {levelLabel}
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                      {product.name}
                    </h3>
                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Harga Paket
                        </p>
                        <p className="font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatRupiah(product.minCapital)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Klaim / Hari
                        </p>
                        <p className="font-mono-num text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          +{formatRupiah(product.claimIncome)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className={cn(
                      'mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-xs font-semibold transition-transform active:scale-[0.98] cursor-pointer',
                      isEligible
                        ? 'bg-purple-700 text-white hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500'
                        : 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    )}
                  >
                    {!isEligible && <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    <span>{isEligible ? 'Beli Paket' : `Khusus ${levelLabel}`}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

interface ProdukTabProps {
  products: ReadonlyArray<InvestmentProduct>;
  categories: ReadonlyArray<ProductCategory>;
  depositBalance: number;
  memberLevel: number;
  onSelectProduct: (product: InvestmentProduct) => void;
  onOpenTopUp: () => void;
}

export function ProdukTab({
  products,
  categories,
  depositBalance,
  memberLevel,
  onSelectProduct,
  onOpenTopUp,
}: ProdukTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');

  const activeCategories = categories.filter((c) => c.status === 'aktif');
  const activeProducts = products.filter((p) => p.status === 'aktif');
  const filteredProducts =
    selectedCategory === 'semua'
      ? activeProducts
      : activeProducts.filter(
          (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saldo Deposit Tersedia
          </p>
          <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatRupiah(depositBalance)}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenTopUp}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-purple-700 px-4 text-xs font-semibold text-white hover:bg-purple-800 active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Isi Saldo</span>
        </button>
      </div>

      {/* Category Filter Strip */}
      <div
        role="tablist"
        aria-label="Filter kategori produk"
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === 'semua'}
          onClick={() => setSelectedCategory('semua')}
          className={cn(
            'min-h-[44px] shrink-0 rounded-full px-4 text-xs font-semibold transition-colors cursor-pointer',
            selectedCategory === 'semua'
              ? 'bg-purple-700 text-white dark:bg-amber-400 dark:text-purple-950'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          )}
        >
          Semua ({activeProducts.length})
        </button>
        {activeCategories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                'min-h-[44px] shrink-0 rounded-full px-4 text-xs font-semibold transition-colors cursor-pointer',
                isSelected
                  ? 'bg-purple-700 text-white dark:bg-amber-400 dark:text-purple-950'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <LayoutGrid className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Belum ada produk di kategori ini
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pilih kategori lain untuk melihat paket investasi aktif.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const totalEstimasi = product.claimIncome * product.tenorDays;
            const levelLabel = formatAllowedLevelsLabel(product.allowedLevels);
            const isEligible = canUserLevelPurchaseProduct(memberLevel, product.allowedLevels);
            return (
              <article
                key={product.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800">
                  <ProductThumb product={product} />
                  <ProductVipCornerBadge
                    allowedLevels={product.allowedLevels}
                    isEligible={isEligible}
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {product.category} · Tenor {product.tenorDays} hari · Komisi{' '}
                      {formatProductCommission(product.commissionRate, product.commissionType)} ·{' '}
                      <span
                        className={cn(
                          isEligible
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'font-semibold text-amber-700 dark:text-amber-400'
                        )}
                      >
                        {levelLabel}
                      </span>
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-slate-100">
                      {product.name}
                    </h3>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Modal</p>
                        <p className="font-mono-num text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatRupiah(product.minCapital)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Harian</p>
                        <p className="font-mono-num text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          +{formatRupiah(product.claimIncome)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Hasil</p>
                        <p className="font-mono-num text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatRupiah(totalEstimasi)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className={cn(
                      'mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-transform active:scale-[0.98] cursor-pointer',
                      isEligible
                        ? 'bg-purple-700 text-white hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500'
                        : 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    )}
                  >
                    {!isEligible && <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    <span>{isEligible ? 'Investasi Sekarang' : `Khusus ${levelLabel}`}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AsetTabProps {
  investments: ReadonlyArray<MemberActiveInvestment>;
  transactions: ReadonlyArray<MemberTransactionItem>;
  publications: ReadonlyArray<WithdrawalPublication>;
  onClaimDaily: (investmentId: string) => void;
  onGoToProducts: () => void;
}

export function AsetTab({
  investments,
  transactions,
  publications,
  onClaimDaily,
  onGoToProducts,
}: AsetTabProps) {
  const [subTab, setSubTab] = useState<'portofolio' | 'riwayat' | 'pencairan'>('portofolio');

  const publishedProofs = publications.filter((p) => p.publicationStatus === 'published');

  return (
    <div className="space-y-4">
      {/* Android Material Segmented Control */}
      <div
        role="tablist"
        aria-label="Submenu aset member"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'portofolio'}
          onClick={() => setSubTab('portofolio')}
          className={cn(
            'min-h-[44px] rounded-xl px-2 text-xs font-semibold transition-colors cursor-pointer',
            subTab === 'portofolio'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          Portofolio ({investments.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'riwayat'}
          onClick={() => setSubTab('riwayat')}
          className={cn(
            'min-h-[44px] rounded-xl px-2 text-xs font-semibold transition-colors cursor-pointer',
            subTab === 'riwayat'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          Riwayat ({transactions.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'pencairan'}
          onClick={() => setSubTab('pencairan')}
          className={cn(
            'min-h-[44px] rounded-xl px-2 text-xs font-semibold transition-colors cursor-pointer',
            subTab === 'pencairan'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          Bukti WD ({publishedProofs.length})
        </button>
      </div>

      {subTab === 'portofolio' && (
        <>
          {investments.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <TrendingUp className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada investasi aktif
              </p>
              <button
                type="button"
                onClick={onGoToProducts}
                className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-purple-700 px-5 text-xs font-semibold text-white hover:bg-purple-800 cursor-pointer"
              >
                Pilih Produk Investasi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {investments.map((inv) => {
                const ratio = Math.min(
                  100,
                  Math.round((inv.claimsCompleted / Math.max(1, inv.durationDays)) * 100)
                );
                return (
                  <article
                    key={inv.id}
                    className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {inv.category} · {inv.units} unit · Mulai {inv.startedAt}
                          </p>
                          <h3 className="mt-0.5 truncate font-display text-base font-bold text-slate-900 dark:text-slate-100">
                            {inv.productName}
                          </h3>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 text-xs font-semibold',
                            inv.status === 'aktif'
                              ? 'text-purple-700 dark:text-amber-300'
                              : 'text-slate-500 dark:text-slate-400'
                          )}
                        >
                          {inv.status === 'aktif' ? 'Aktif' : 'Selesai'}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Progres Klaim
                          </span>
                          <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                            {inv.claimsCompleted} / {inv.durationDays} hari ({ratio}%)
                          </span>
                        </div>
                        <svg
                          viewBox="0 0 100 6"
                          preserveAspectRatio="none"
                          className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                          aria-hidden="true"
                        >
                          <rect
                            x="0"
                            y="0"
                            width={ratio}
                            height="6"
                            rx="3"
                            className="fill-purple-700 dark:fill-amber-400"
                          />
                        </svg>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-950">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Modal</p>
                          <p className="font-mono-num font-bold text-slate-900 dark:text-slate-100">
                            {formatRupiah(inv.capital)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Klaim / Hari</p>
                          <p className="font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                            +{formatRupiah(inv.dailyClaimIncome)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Terkumpul</p>
                          <p className="font-mono-num font-bold text-slate-900 dark:text-slate-100">
                            {formatRupiah(inv.earnedReturn)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={inv.status !== 'aktif' || inv.claimedToday}
                      onClick={() => onClaimDaily(inv.id)}
                      className={cn(
                        'mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-xs font-semibold transition-transform cursor-pointer',
                        inv.status === 'aktif' && !inv.claimedToday
                          ? 'bg-purple-700 text-white hover:bg-purple-800 active:scale-[0.98] dark:bg-purple-600 dark:hover:bg-purple-500'
                          : 'bg-slate-100 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      <Coins className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {inv.status !== 'aktif'
                          ? 'Siklus Investasi Selesai'
                          : inv.claimedToday
                            ? 'Sudah Diklaim Hari Ini'
                            : `Klaim Hasil Harian (+${formatRupiah(inv.dailyClaimIncome)})`}
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {subTab === 'riwayat' && (
        <div className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {transactions.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Belum ada riwayat transaksi.
            </p>
          ) : (
            transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {tx.title}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {tx.subtitle} · {tx.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        'font-mono-num text-sm font-bold',
                        isPositive
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      )}
                    >
                      {formatSignedRupiah(tx.amount)}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-medium',
                        tx.status === 'berhasil'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : tx.status === 'menunggu'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {tx.status === 'berhasil'
                        ? 'Berhasil'
                        : tx.status === 'menunggu'
                          ? 'Diproses'
                          : 'Ditolak'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {subTab === 'pencairan' && (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {publishedProofs.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
              <FileCheck2 className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Belum ada bukti pencairan yang dipublikasikan.
              </p>
            </div>
          ) : (
            publishedProofs.map((proof) => (
              <article
                key={proof.id}
                className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <BankLogoBadge bankOrChannelName={proof.bankChannel} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      #{proof.userNumber} {proof.userName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {proof.bankChannel} · {proof.withdrawalDate}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono-num text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(proof.amount)}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Terbukti Cair
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface AkunTabProps {
  state: MemberAppState;
  userLevels: ReadonlyArray<UserLevelRule>;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAddBank: () => void;
  onLogout: () => void;
}

export function AkunTab({
  state,
  userLevels,
  darkMode,
  onToggleDarkMode,
  onOpenAddBank,
  onLogout,
}: AkunTabProps) {
  const [copiedReferral, setCopiedReferral] = useState(false);

  const activeReferrals = countUserActiveReferrals(state.member);
  const levelEval = evaluateUserLevel(
    activeReferrals,
    state.member.totalInvestmentModal,
    userLevels
  );
  const currentVip = levelEval.currentRule;
  const referralCode = deriveUserReferralCode(state.member);
  const referralLink = buildReferralRegistrationLink(referralCode);

  const handleCopyReferral = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink).catch(() => {});
    }
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left Column: Profile & Level + Referral */}
      <div className="space-y-4 lg:col-span-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3.5">
            <img
              src={currentVip.badgeImageUrl}
              alt={`Logo VIP ${currentVip.level} ${currentVip.tierTitle}`}
              className="h-16 w-16 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {state.member.name}
                </h2>
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              </div>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                ID #{state.member.userNumber} · VIP {currentVip.level} {currentVip.tierTitle} · {state.member.phone}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                VIP {currentVip.level} · {currentVip.tierTitle}
              </span>
              {levelEval.nextRule && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Target: VIP {levelEval.nextRule.level} ({levelEval.nextRule.tierTitle})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 border-t border-slate-200 pt-2.5 text-xs dark:border-slate-800">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Akses Withdraw</p>
                <p className="mt-0.5 font-mono-num font-bold text-slate-900 dark:text-slate-100">
                  {formatCompactRupiah(currentVip.minWithdrawal)} –{' '}
                  {currentVip.maxWithdrawal > 0
                    ? formatCompactRupiah(currentVip.maxWithdrawal)
                    : 'Tanpa Batas'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Gaji Rutin</p>
                <p className="mt-0.5 font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                  {formatRupiah(currentVip.salaryAmount)} /{' '}
                  {formatSalaryPeriodLabel(currentVip.salaryPeriod)}
                </p>
              </div>
            </div>

            {currentVip.extraBenefits.length > 0 && (
              <div className="space-y-1 border-t border-slate-200 pt-2.5 text-xs dark:border-slate-800">
                {currentVip.extraBenefits.map((benefit) => (
                  <div key={benefit.id} className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400">{benefit.label}</span>
                    <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                      {benefit.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {levelEval.nextRule ? (
              <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={levelEval.nextRule.badgeImageUrl}
                      alt={`Logo VIP ${levelEval.nextRule.level} ${levelEval.nextRule.tierTitle}`}
                      className="h-6 w-6 shrink-0 object-contain"
                    />
                    <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Progres Menuju VIP {levelEval.nextRule.level} ({levelEval.nextRule.tierTitle})
                    </span>
                  </div>
                  <span className="shrink-0 font-mono-num text-xs font-bold text-purple-700 dark:text-amber-300">
                    {levelEval.overallProgressPercent}%
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label={`Progres menuju VIP ${levelEval.nextRule.level}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={levelEval.overallProgressPercent}
                  className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-700 to-amber-500 transition-all duration-300"
                    style={{ width: `${levelEval.overallProgressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-2.5 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        Referral Aktif
                      </span>
                      <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatNumber(activeReferrals)} / {formatNumber(levelEval.nextRule.minActiveReferrals)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-purple-600 transition-all duration-300"
                        style={{ width: `${levelEval.referralProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-2.5 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        Total Deposit
                      </span>
                      <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatCompactRupiah(state.member.totalInvestmentModal)} /{' '}
                        {formatCompactRupiah(levelEval.nextRule.minTotalPurchase)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${levelEval.purchaseProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Butuh{' '}
                  <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    {formatNumber(levelEval.missingReferrals)} referral aktif
                  </span>{' '}
                  dan deposit{' '}
                  <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    {formatRupiah(levelEval.missingPurchase)}
                  </span>{' '}
                  lagi untuk naik ke VIP {levelEval.nextRule.level}.
                </p>
              </div>
            ) : (
              <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-amber-300">
                  <span>Progres VIP Maksimal Tercapai</span>
                  <span className="font-mono-num">100%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Progres VIP maksimal tercapai"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={100}
                  className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                >
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-purple-700 to-amber-500" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Jenjang & Benefit VIP 1-8 */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Jenjang &amp; Benefit VIP 1 – 8
            </h3>
          </div>

          <div className="mt-3 space-y-2.5">
            {userLevels.map((rule) => {
              const isCurrent = rule.level === currentVip.level;
              return (
                <div
                  key={rule.level}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border p-3 transition-colors',
                    isCurrent
                      ? 'border-purple-500/70 bg-purple-50/60 dark:border-purple-600 dark:bg-purple-950/30'
                      : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/60'
                  )}
                >
                  <img
                    src={rule.badgeImageUrl}
                    alt={`Logo VIP ${rule.level} ${rule.tierTitle}`}
                    className="h-12 w-12 shrink-0 object-contain"
                  />
                  <div className="min-w-0 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display font-bold text-slate-900 dark:text-slate-100">
                        VIP {rule.level} · {rule.tierTitle}
                      </p>
                      {isCurrent && (
                        <span className="font-semibold text-purple-700 dark:text-amber-300">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="font-mono-num text-[11px] text-slate-600 dark:text-slate-400">
                      Syarat: {formatNumber(rule.minActiveReferrals)} Ref · Min Deposit{' '}
                      {formatCompactRupiah(rule.minTotalPurchase)}
                      {rule.extraRequirements.map((req) => ` · ${req.label}: ${req.value}`).join('')}
                    </p>
                    <p className="font-mono-num text-[11px] font-medium text-slate-800 dark:text-slate-200">
                      WD {formatCompactRupiah(rule.minWithdrawal)}–
                      {rule.maxWithdrawal > 0
                        ? formatCompactRupiah(rule.maxWithdrawal)
                        : 'Tanpa Batas'}{' '}
                      · Gaji {formatCompactRupiah(rule.salaryAmount)}/
                      {formatSalaryPeriodLabel(rule.salaryPeriod)}
                      {rule.extraBenefits.map((ben) => ` · ${ben.label}: ${ben.value}`).join('')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Program Referral */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-slate-100">
              <Share2 className="h-4 w-4 text-purple-700 dark:text-amber-300" aria-hidden="true" />
              <span>Kode &amp; Link Referral</span>
            </h3>
            <span className="font-mono-num text-xs font-bold text-purple-700 dark:text-amber-300">
              {formatRupiah(state.member.referralCommissionReceived)} komisi
            </span>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Kode Referral Anda</p>
            <p className="mt-0.5 font-mono-num text-base font-bold tracking-wider text-slate-900 dark:text-slate-100">
              {referralCode}
            </p>
            <p className="mt-2 truncate font-mono-num text-xs text-slate-500 dark:text-slate-400">
              {referralLink}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyReferral}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 px-4 text-xs font-semibold text-white transition-transform hover:bg-purple-800 active:scale-[0.98] dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
          >
            {copiedReferral ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Link Referral Disalin</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span>Salin Link Pendaftaran</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* Right Column: Rekening Bank & Pengaturan */}
      <div className="space-y-4 lg:col-span-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-slate-100">
              <Landmark className="h-4 w-4 text-purple-700 dark:text-amber-300" aria-hidden="true" />
              <span>Rekening &amp; E-Wallet Penarikan ({state.member.banks.length})</span>
            </h3>
            <button
              type="button"
              onClick={onOpenAddBank}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:text-amber-300 dark:hover:bg-purple-950/40 cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {state.member.banks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Belum ada rekening bank atau E-Wallet tersimpan. Tambahkan tujuan penarikan untuk mulai menarik saldo.
              </p>
            ) : (
              state.member.banks.map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <BankLogoBadge bankOrChannelName={bank.bankName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bank.bankName}{' '}
                        <span className="text-xs font-medium text-purple-700 dark:text-amber-300">
                          · {bank.accountType === 'ewallet' ? 'E-Wallet' : 'Bank'}
                        </span>
                      </p>
                      <p className="truncate font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        {bank.accountNumber} · {bank.accountHolder}
                      </p>
                    </div>
                  </div>
                  {bank.isPrimary && (
                    <span className="shrink-0 text-xs font-semibold text-purple-700 dark:text-amber-300">
                      Utama
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Pengaturan Aplikasi Android */}
        <section className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex min-h-[56px] w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <span className="inline-flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
              {darkMode ? (
                <Sun className="h-5 w-5 text-amber-500" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" aria-hidden="true" />
              )}
              <span>Tampilan {darkMode ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}</span>
            </span>
            <span className="text-xs font-semibold text-purple-700 dark:text-amber-300">
              Ubah
            </span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-[56px] w-full items-center justify-between px-5 py-3 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
          >
            <span className="inline-flex items-center gap-3 text-sm font-semibold">
              <LogOut className="h-5 w-5" aria-hidden="true" />
              <span>Keluar Akun Member</span>
            </span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      </div>
    </div>
  );
}
