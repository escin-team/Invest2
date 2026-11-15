'use client';

import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Lock,
  Megaphone,
  Minus,
  Plus,
  Ticket,
  Wallet,
} from 'lucide-react';
import { BankLogoBadge } from '@/src/components/BankLogoBadge';
import { MemberBottomSheet } from '@/src/components/member/MemberBottomSheet';
import {
  INDONESIAN_BANK_OPTIONS,
  INDONESIAN_EWALLET_OPTIONS,
  resolvePaymentChannelSlugs,
} from '@/src/lib/bank-logos';
import type {
  AccountChannelType,
  AnnouncementRecord,
  InvestmentProduct,
  PaymentMethodConfig,
  UserBankAccount,
  UserLevelRule,
} from '@/src/lib/dashboard-schema';
import {
  MEMBER_MIN_TOPUP,
  MEMBER_MIN_WITHDRAWAL,
  MEMBER_TOPUP_PRESETS,
} from '@/src/lib/member-app';
import { resolveProductImageSrc } from '@/src/lib/product-images';
import {
  canUserLevelPurchaseProduct,
  formatAllowedLevelsLabel,
} from '@/src/lib/user-levels';
import { cn, formatNumber, formatRupiah } from '@/src/lib/utils';

interface TopUpBottomSheetProps {
  open: boolean;
  paymentMethods: ReadonlyArray<PaymentMethodConfig>;
  onClose: () => void;
  onSubmit: (payload: {
    amount: number;
    channelLabel: string;
    isInstantGateway: boolean;
  }) => { error: string | null };
}

export function TopUpBottomSheet({
  open,
  paymentMethods,
  onClose,
  onSubmit,
}: TopUpBottomSheetProps) {
  const availableMethods = paymentMethods.filter((m) => m.enabled);
  const effectiveMethods =
    availableMethods.length > 0 ? availableMethods : paymentMethods.slice(0, 4);

  const [amountInput, setAmountInput] = useState('500000');
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    effectiveMethods[0]?.id ?? 'PM-02'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeMethod =
    effectiveMethods.find((m) => m.id === selectedMethodId) ?? effectiveMethods[0];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number.parseInt(amountInput.replace(/\D/g, ''), 10) || 0;
    if (!activeMethod) {
      setErrorMessage('Pilih metode pembayaran Top Up terlebih dahulu.');
      return;
    }
    const res = onSubmit({
      amount: numericAmount,
      channelLabel: activeMethod.name,
      isInstantGateway: activeMethod.provider === 'doku',
    });
    if (res.error) {
      setErrorMessage(res.error);
      return;
    }
    setErrorMessage(null);
    onClose();
  };

  return (
    <MemberBottomSheet
      open={open}
      title="Top Up Saldo Deposit"
      subtitle={`Minimal ${formatRupiah(MEMBER_MIN_TOPUP)} · Otomatis / Verifikasi Admin`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="member-topup-amount"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Nominal Top Up (Rp)
          </label>
          <input
            id="member-topup-amount"
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value.replace(/[^\d]/g, ''));
              setErrorMessage(null);
            }}
            placeholder="500000"
            className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-mono-num text-base font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {MEMBER_TOPUP_PRESETS.map((preset) => {
              const isSelected = Number(amountInput) === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmountInput(String(preset));
                    setErrorMessage(null);
                  }}
                  className={cn(
                    'min-h-[44px] rounded-2xl border px-2 font-mono-num text-xs font-semibold transition-colors active:scale-[0.98] cursor-pointer',
                    isSelected
                      ? 'border-purple-600 bg-purple-50 text-purple-800 dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  )}
                >
                  {formatRupiah(preset)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Pilih Metode Pembayaran
          </p>
          <div className="space-y-2">
            {effectiveMethods.map((method) => {
              const isSelected = activeMethod?.id === method.id;
              const slugs = resolvePaymentChannelSlugs(method.code);
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    setSelectedMethodId(method.id);
                    setErrorMessage(null);
                  }}
                  className={cn(
                    'flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors active:scale-[0.99] cursor-pointer',
                    isSelected
                      ? 'border-purple-600 bg-purple-50/70 dark:border-purple-500 dark:bg-purple-950/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <BankLogoBadge
                      bankOrChannelName={method.name}
                      slugsOverride={slugs}
                      fallbackCategory={method.category}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {method.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {method.provider === 'doku' ? 'DOKU Instan' : 'Manual'} · {method.feeLabel}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2
                    className={cn(
                      'h-5 w-5 shrink-0',
                      isSelected
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-slate-300 dark:text-slate-700'
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-purple-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-purple-800 active:scale-[0.98] dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
        >
          Lanjutkan Top Up
        </button>
      </form>
    </MemberBottomSheet>
  );
}

interface WithdrawBottomSheetProps {
  open: boolean;
  withdrawableBalance: number;
  vipRule: UserLevelRule;
  banks: ReadonlyArray<UserBankAccount>;
  onClose: () => void;
  onOpenAddBank: () => void;
  onSubmit: (payload: { amount: number; bankId: string }) => { error: string | null };
}

export function WithdrawBottomSheet({
  open,
  withdrawableBalance,
  vipRule,
  banks,
  onClose,
  onOpenAddBank,
  onSubmit,
}: WithdrawBottomSheetProps) {
  const minAllowed = vipRule.minWithdrawal > 0 ? vipRule.minWithdrawal : MEMBER_MIN_WITHDRAWAL;
  const maxAllowed = vipRule.maxWithdrawal;

  const [amountInput, setAmountInput] = useState('250000');
  const [selectedBankId, setSelectedBankId] = useState<string>(banks[0]?.id ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const effectiveBankId = banks.some((b) => b.id === selectedBankId)
    ? selectedBankId
    : (banks[0]?.id ?? '');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number.parseInt(amountInput.replace(/\D/g, ''), 10) || 0;
    const res = onSubmit({ amount: numericAmount, bankId: effectiveBankId });
    if (res.error) {
      setErrorMessage(res.error);
      return;
    }
    setErrorMessage(null);
    onClose();
  };

  const quickRatios = [
    { label: '25%', amount: Math.floor(withdrawableBalance * 0.25) },
    { label: '50%', amount: Math.floor(withdrawableBalance * 0.5) },
    {
      label: maxAllowed > 0 && withdrawableBalance > maxAllowed ? 'Maks VIP' : 'Semua',
      amount: maxAllowed > 0 ? Math.min(withdrawableBalance, maxAllowed) : withdrawableBalance,
    },
  ];

  return (
    <MemberBottomSheet
      open={open}
      title="Tarik Dana"
      subtitle={`Saldo Bisa Ditarik: ${formatRupiah(withdrawableBalance)}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950">
          <img
            src={vipRule.badgeImageUrl}
            alt={`Logo VIP ${vipRule.level} ${vipRule.tierTitle}`}
            className="h-11 w-11 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Akses Withdraw VIP {vipRule.level} · {vipRule.tierTitle}
            </p>
            <p className="mt-0.5 font-mono-num text-xs text-slate-600 dark:text-slate-400">
              Min {formatRupiah(minAllowed)} — Maks{' '}
              {maxAllowed > 0 ? formatRupiah(maxAllowed) : 'Tanpa Batas'}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="member-wd-amount"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Nominal Penarikan (Min {formatRupiah(minAllowed)}
            {maxAllowed > 0 ? ` · Maks ${formatRupiah(maxAllowed)}` : ''})
          </label>
          <input
            id="member-wd-amount"
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value.replace(/[^\d]/g, ''));
              setErrorMessage(null);
            }}
            placeholder="250000"
            className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-mono-num text-base font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {quickRatios.map((ratio) => (
              <button
                key={ratio.label}
                type="button"
                onClick={() => {
                  setAmountInput(String(Math.max(0, ratio.amount)));
                  setErrorMessage(null);
                }}
                className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rekening Bank / E-Wallet Tujuan
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddBank();
              }}
              className="min-h-[36px] text-xs font-semibold text-purple-700 hover:underline dark:text-purple-400 cursor-pointer"
            >
              + Tambah Rekening / E-Wallet
            </button>
          </div>

          {banks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Belum ada rekening bank atau E-Wallet tersimpan.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddBank();
                }}
                className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-purple-700 px-4 text-xs font-semibold text-white hover:bg-purple-800 dark:bg-purple-600 cursor-pointer"
              >
                Tambah Rekening / E-Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {banks.map((bank) => {
                const isSelected = effectiveBankId === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      setSelectedBankId(bank.id);
                      setErrorMessage(null);
                    }}
                    className={cn(
                      'flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 dark:border-purple-500 dark:bg-purple-950/30'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <BankLogoBadge bankOrChannelName={bank.bankName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
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
                    <CheckCircle2
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isSelected
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-slate-300 dark:text-slate-700'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={banks.length === 0}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-purple-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-purple-800 active:scale-[0.98] disabled:opacity-50 dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
        >
          Ajukan Penarikan Dana
        </button>
      </form>
    </MemberBottomSheet>
  );
}

interface VoucherBottomSheetProps {
  open: boolean;
  onClose: () => void;
  onRedeem: (code: string) => { claimedAmount: number; error: string | null };
}

export function VoucherBottomSheet({
  open,
  onClose,
  onRedeem,
}: VoucherBottomSheetProps) {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const res = onRedeem(code);
    if (res.error) {
      setSuccessMessage(null);
      setErrorMessage(res.error);
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(
      `Berhasil! Bonus ${formatRupiah(res.claimedAmount)} ditambahkan ke Saldo Bisa Ditarik.`
    );
    setCode('');
  };

  return (
    <MemberBottomSheet
      open={open}
      title="Klaim Kode Voucher"
      subtitle="Tukarkan kode voucher promo menjadi saldo bonus"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="member-voucher-code"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Masukkan Kode Voucher
          </label>
          <div className="relative">
            <Ticket
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="member-voucher-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Contoh: FOLGERS25"
              className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 font-mono-num text-sm font-bold tracking-wider uppercase text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Kode tersedia:</span>
            <button
              type="button"
              onClick={() => {
                setCode('FOLGERS25');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="min-h-[36px] rounded-xl border border-purple-200 bg-purple-50 px-3 font-mono-num font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 cursor-pointer"
            >
              FOLGERS25 (Aktif)
            </button>
            <button
              type="button"
              onClick={() => {
                setCode('5N9JK5');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="min-h-[36px] rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono-num font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 cursor-pointer"
            >
              5N9JK5 (Kedaluwarsa)
            </button>
          </div>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-purple-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-purple-800 active:scale-[0.98] dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
        >
          Tukarkan Voucher Sekarang
        </button>
      </form>
    </MemberBottomSheet>
  );
}

interface BuyProductBottomSheetProps {
  product: InvestmentProduct | null;
  depositBalance: number;
  memberLevel: number;
  onClose: () => void;
  onOpenTopUp: () => void;
  onOpenAccountLevel: () => void;
  onConfirmPurchase: (product: InvestmentProduct, units: number) => { error: string | null };
}

export function BuyProductBottomSheet({
  product,
  depositBalance,
  memberLevel,
  onClose,
  onOpenTopUp,
  onOpenAccountLevel,
  onConfirmPurchase,
}: BuyProductBottomSheetProps) {
  const [units, setUnits] = useState(1);
  const [imgFailed, setImgFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!product) return null;

  const imgSrc = resolveProductImageSrc(product);
  const totalCost = product.minCapital * units;
  const dailyYield = product.claimIncome * units;
  const totalReturn = dailyYield * product.tenorDays;
  const isBalanceSufficient = depositBalance >= totalCost;
  const levelLabel = formatAllowedLevelsLabel(product.allowedLevels);
  const isLevelEligible = canUserLevelPurchaseProduct(memberLevel, product.allowedLevels);

  const handleConfirm = () => {
    const res = onConfirmPurchase(product, units);
    if (res.error) {
      setErrorMessage(res.error);
      return;
    }
    setErrorMessage(null);
    setUnits(1);
    onClose();
  };

  return (
    <MemberBottomSheet
      open={Boolean(product)}
      title="Konfirmasi Investasi"
      subtitle={`${product.category} · Tenor ${product.tenorDays} hari`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
            {imgSrc && !imgFailed ? (
              <img
                src={imgSrc}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-700 to-amber-500 text-xs font-bold text-white">
                {product.id}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              {product.name}
            </h3>
            <p className="mt-0.5 font-mono-num text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {formatRupiah(product.minCapital)} / unit
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Klaim harian {formatRupiah(product.claimIncome)} · Maks {product.maxPerUser} unit · {levelLabel}
            </p>
          </div>
        </div>

        {!isLevelEligible && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <div>
              <p className="font-semibold">Akses Terbatas ({levelLabel})</p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                Produk ini khusus untuk {levelLabel}. Status akun Anda saat ini adalah VIP {memberLevel}.
              </p>
            </div>
          </div>
        )}

        {/* Unit Stepper */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Jumlah Unit
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUnits((prev) => Math.max(1, prev - 1));
                setErrorMessage(null);
              }}
              aria-label="Kurangi unit"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-8 text-center font-mono-num text-base font-bold text-slate-900 dark:text-slate-100">
              {units}
            </span>
            <button
              type="button"
              onClick={() => {
                setUnits((prev) => Math.min(product.maxPerUser, prev + 1));
                setErrorMessage(null);
              }}
              aria-label="Tambah unit"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Ringkasan Kalkulasi */}
        <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Total Pembayaran</span>
            <span className="font-mono-num font-bold text-slate-900 dark:text-slate-100">
              {formatRupiah(totalCost)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Imbal Hasil / Hari</span>
            <span className="font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
              +{formatRupiah(dailyYield)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Estimasi Total ({formatNumber(product.tenorDays)} hari)
            </span>
            <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
              {formatRupiah(totalReturn)}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2 dark:border-slate-800 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              Saldo Deposit Anda
            </span>
            <span
              className={cn(
                'font-mono-num text-xs font-bold',
                isBalanceSufficient
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatRupiah(depositBalance)}
            </span>
          </div>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorMessage}
          </p>
        )}

        {!isLevelEligible ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAccountLevel();
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition-transform hover:bg-slate-800 active:scale-[0.98] dark:bg-amber-600 dark:hover:bg-amber-500 cursor-pointer"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>Lihat Syarat Naik ke {levelLabel}</span>
          </button>
        ) : isBalanceSufficient ? (
          <button
            type="button"
            onClick={handleConfirm}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-purple-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-purple-800 active:scale-[0.98] dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
          >
            Bayar &amp; Aktifkan Investasi
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTopUp();
            }}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-purple-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-purple-800 active:scale-[0.98] dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
          >
            Saldo Kurang · Top Up Sekarang
          </button>
        )}
      </div>
    </MemberBottomSheet>
  );
}

interface AddBankBottomSheetProps {
  open: boolean;
  defaultHolderName: string;
  onClose: () => void;
  onSubmit: (payload: {
    accountType: AccountChannelType;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }) => { error: string | null };
}

const FEATURED_MEMBER_BANKS = [
  'Bank BCA',
  'Bank Mandiri',
  'Bank BRI',
  'Bank BNI',
  'Bank Syariah Indonesia (BSI)',
  'SeaBank',
  'Bank Jago',
];

export function AddBankBottomSheet({
  open,
  defaultHolderName,
  onClose,
  onSubmit,
}: AddBankBottomSheetProps) {
  const [accountType, setAccountType] = useState<AccountChannelType>('bank');
  const [bankName, setBankName] = useState('Bank BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(defaultHolderName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const popularBanks = INDONESIAN_BANK_OPTIONS.filter(
    (b) => !FEATURED_MEMBER_BANKS.includes(b.name)
  ).slice(0, 30);

  const handleSwitchType = (nextType: AccountChannelType) => {
    setAccountType(nextType);
    setErrorMessage(null);
    if (nextType === 'ewallet') {
      setBankName(INDONESIAN_EWALLET_OPTIONS[0]?.name ?? 'DANA');
    } else {
      setBankName('Bank BCA');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const res = onSubmit({ accountType, bankName, accountNumber, accountHolder });
    if (res.error) {
      setErrorMessage(res.error);
      return;
    }
    setAccountNumber('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <MemberBottomSheet
      open={open}
      title="Tambah Rekening & E-Wallet"
      subtitle="Pilih rekening bank atau akun E-Wallet atas nama pribadi"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Jenis Tujuan Penarikan
          </span>
          <div
            role="tablist"
            aria-label="Pilih jenis rekening bank atau e-wallet"
            className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950"
          >
            {(
              [
                { id: 'bank', label: 'Rekening Bank' },
                { id: 'ewallet', label: 'E-Wallet' },
              ] as const
            ).map((tab) => {
              const isSelected = accountType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSwitchType(tab.id)}
                  className={cn(
                    'min-h-[42px] rounded-xl px-3 text-xs font-semibold transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-white text-purple-900 shadow-xs dark:bg-slate-800 dark:text-amber-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="member-bank-select"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {accountType === 'ewallet' ? 'Pilih E-Wallet' : 'Pilih Bank Indonesia'}
          </label>
          <div className="flex items-center gap-3">
            <BankLogoBadge bankOrChannelName={bankName} size="sm" />
            <select
              id="member-bank-select"
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                setErrorMessage(null);
              }}
              className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {accountType === 'ewallet' ? (
                INDONESIAN_EWALLET_OPTIONS.map((wallet) => (
                  <option key={wallet.slug} value={wallet.name}>
                    {wallet.name}
                  </option>
                ))
              ) : (
                <>
                  {FEATURED_MEMBER_BANKS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  {popularBanks.map((bank) => (
                    <option key={bank.slug} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="member-bank-number"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {accountType === 'ewallet' ? 'Nomor HP / Akun E-Wallet' : 'Nomor Rekening'}
          </label>
          <input
            id="member-bank-number"
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/[^\d]/g, ''));
              setErrorMessage(null);
            }}
            placeholder={accountType === 'ewallet' ? 'Contoh: 081234567890' : '8821044129'}
            className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-mono-num text-sm font-semibold text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="member-bank-holder"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {accountType === 'ewallet'
              ? 'Nama Pemilik Akun E-Wallet'
              : 'Nama Pemilik Rekening'}
          </label>
          <input
            id="member-bank-holder"
            type="text"
            value={accountHolder}
            onChange={(e) => {
              setAccountHolder(e.target.value);
              setErrorMessage(null);
            }}
            placeholder={
              accountType === 'ewallet'
                ? 'Sesuai nama akun terdaftar'
                : 'Sesuai buku tabungan'
            }
            className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-purple-700 px-5 text-sm font-semibold text-white transition-transform hover:bg-purple-800 active:scale-[0.98] dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
        >
          {accountType === 'ewallet' ? 'Simpan Akun E-Wallet' : 'Simpan Rekening Bank'}
        </button>
      </form>
    </MemberBottomSheet>
  );
}

interface AnnouncementDetailBottomSheetProps {
  open: boolean;
  announcements: ReadonlyArray<AnnouncementRecord>;
  onClose: () => void;
}

export function AnnouncementDetailBottomSheet({
  open,
  announcements,
  onClose,
}: AnnouncementDetailBottomSheetProps) {
  return (
    <MemberBottomSheet
      open={open}
      title="Pengumuman Resmi"
      subtitle="Informasi operasional terbaru untuk seluruh member"
      onClose={onClose}
    >
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Belum ada pengumuman aktif saat ini.
          </p>
        ) : (
          announcements.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Megaphone
                    className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                    aria-hidden="true"
                  />
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                </div>
                <span className="shrink-0 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                  {item.publishedAt}
                </span>
              </div>
              <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {item.message}
              </p>
              {item.message.includes('https://folgers.biz.id/') && (
                <a
                  href="https://folgers.biz.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-purple-700 px-3.5 text-xs font-semibold text-white hover:bg-purple-800"
                >
                  <span>Akses Domain Resmi</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </article>
          ))
        )}
      </div>
    </MemberBottomSheet>
  );
}
