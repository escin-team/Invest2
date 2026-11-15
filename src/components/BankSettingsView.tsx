'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { BankLogoBadge } from '@/src/components/BankLogoBadge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  INDONESIAN_BANK_OPTIONS,
  INDONESIAN_EWALLET_OPTIONS,
} from '@/src/lib/bank-logos';
import {
  filterPaymentMethods,
  formatBankAccountNumber,
  type ManualBankAccountInput,
  type PaymentMethodFilter,
} from '@/src/lib/bank-settings';
import type {
  BankSettingsState,
  DokuGatewayPublicStatus,
  ManualBankAccount,
  PaymentMethodConfig,
} from '@/src/lib/dashboard-schema';
import { cn, formatNumber } from '@/src/lib/utils';

interface BankSettingsViewProps {
  settings: BankSettingsState;
  onAddManualBank: (input: ManualBankAccountInput) => string | null;
  onUpdateManualBank: (bankId: string, input: ManualBankAccountInput) => string | null;
  onToggleManualBankStatus: (bankId: string) => void;
  onDeleteManualBank: (bankId: string) => void;
  onToggleDokuGateway: () => void;
  onTogglePaymentMethod: (methodId: string) => void;
}

const EMPTY_BANK_FORM: ManualBankAccountInput = {
  accountType: 'bank',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  branchOrNote: '',
  isActive: true,
};

const QUICK_PICK_BANKS: ReadonlyArray<string> = [
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'BSI',
  'CIMB Niaga',
  'Permata Bank',
  'SeaBank',
  'Bank Jago',
];

const QUICK_PICK_EWALLETS: ReadonlyArray<string> = [
  'DANA',
  'OVO',
  'GoPay',
  'Shopee Pay',
  'LinkAja',
  'Astra Pay',
];

export function BankSettingsView({
  settings,
  onAddManualBank,
  onUpdateManualBank,
  onToggleManualBankStatus,
  onDeleteManualBank,
  onToggleDokuGateway,
  onTogglePaymentMethod,
}: BankSettingsViewProps) {
  const [dokuStatus, setDokuStatus] = useState<DokuGatewayPublicStatus | null>(null);
  const [dokuLoading, setDokuLoading] = useState(true);
  const [dokuLoadError, setDokuLoadError] = useState<string | null>(null);
  const [dokuTestPending, setDokuTestPending] = useState(false);
  const [dokuTestFeedback, setDokuTestFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<ManualBankAccountInput>(EMPTY_BANK_FORM);
  const [bankFormFeedback, setBankFormFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [methodFilter, setMethodFilter] = useState<PaymentMethodFilter>('semua');
  const [methodFeedback, setMethodFeedback] = useState<string | null>(null);

  const fetchDokuStatus = useCallback(async () => {
    const response = await fetch('/api/payment-gateway/doku', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('Gagal membaca status konfigurasi DOKU dari server.');
    }
    return (await response.json()) as DokuGatewayPublicStatus;
  }, []);

  const loadDokuStatus = useCallback(async () => {
    setDokuLoading(true);
    setDokuLoadError(null);
    try {
      const data = await fetchDokuStatus();
      setDokuStatus(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Tidak dapat menghubungi endpoint status DOKU.';
      setDokuLoadError(message);
    } finally {
      setDokuLoading(false);
    }
  }, [fetchDokuStatus]);

  useEffect(() => {
    let cancelled = false;
    fetchDokuStatus()
      .then((data) => {
        if (!cancelled) {
          setDokuStatus(data);
          setDokuLoadError(null);
          setDokuLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Tidak dapat menghubungi endpoint status DOKU.';
          setDokuLoadError(message);
          setDokuLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDokuStatus]);

  const handleTestDokuSandbox = async () => {
    setDokuTestPending(true);
    setDokuTestFeedback(null);
    try {
      const response = await fetch('/api/payment-gateway/doku', {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        status?: DokuGatewayPublicStatus;
      };
      if (payload.status) {
        setDokuStatus(payload.status);
      }
      if (!response.ok || !payload.ok) {
        setDokuTestFeedback({
          type: 'error',
          message:
            payload.error ??
            'Kredensial DOKU Sandbox belum siap di environment server.',
        });
        return;
      }
      setDokuTestFeedback({
        type: 'success',
        message:
          payload.message ??
          'Kredensial DOKU Sandbox terverifikasi aktif di server.',
      });
    } catch {
      setDokuTestFeedback({
        type: 'error',
        message: 'Terjadi kesalahan saat menguji kesiapan gateway DOKU di server.',
      });
    } finally {
      setDokuTestPending(false);
    }
  };

  const handleBankSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = editingBankId
      ? onUpdateManualBank(editingBankId, bankForm)
      : onAddManualBank(bankForm);

    if (error) {
      setBankFormFeedback({ type: 'error', message: error });
      return;
    }

    setBankFormFeedback({
      type: 'success',
      message: editingBankId
        ? 'Data tujuan transfer manual berhasil diperbarui.'
        : `Tujuan ${bankForm.accountType === 'ewallet' ? 'E-Wallet' : 'Rekening Bank'} manual baru berhasil ditambahkan.`,
    });
    setEditingBankId(null);
    setBankForm(EMPTY_BANK_FORM);
  };

  const handleStartEditBank = (bank: ManualBankAccount) => {
    setEditingBankId(bank.id);
    setBankForm({
      accountType: bank.accountType ?? 'bank',
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountHolder: bank.accountHolder,
      branchOrNote: bank.branchOrNote,
      isActive: bank.isActive,
    });
    setBankFormFeedback(null);
  };

  const handleCancelEditBank = () => {
    setEditingBankId(null);
    setBankForm(EMPTY_BANK_FORM);
    setBankFormFeedback(null);
  };

  const handleToggleMethod = (method: PaymentMethodConfig) => {
    onTogglePaymentMethod(method.id);
    setMethodFeedback(
      `${method.name} diubah menjadi ${method.enabled ? 'Nonaktif (OFF)' : 'Aktif (ON)'}.`
    );
  };

  const activeManualBanksCount = settings.manualBanks.filter((b) => b.isActive).length;
  const activePaymentMethodsCount = settings.paymentMethods.filter(
    (m) => m.enabled && (m.provider === 'manual' || settings.dokuEnabled)
  ).length;
  const filteredMethods = useMemo(
    () => filterPaymentMethods(settings.paymentMethods, methodFilter),
    [settings.paymentMethods, methodFilter]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pengaturan Bank &amp; Pembayaran
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Kelola rekening bank transfer manual, integrasi server-side DOKU, serta status ON / OFF metode pembayaran seperti QRIS dan Virtual Account.
          </p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Bank TF Manual Aktif
            </p>
            <p className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(activeManualBanksCount)}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / {formatNumber(settings.manualBanks.length)} rekening
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Gateway DOKU
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {settings.dokuEnabled ? 'Aktif (ON)' : 'Nonaktif (OFF)'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {dokuStatus?.configured
                ? `Env ${dokuStatus.environment === 'production' ? 'Production' : 'Sandbox'} terhubung`
                : 'Menunggu env DOKU_MERCHANT_ID & DOKU_SECRET_KEY'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Metode Pembayaran Aktif
            </p>
            <p className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(activePaymentMethodsCount)}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / {formatNumber(settings.paymentMethods.length)} kanal
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: DOKU Server-Side Integration */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg">
              <BankLogoBadge bankOrChannelName="DOKU" slugsOverride={['doku']} size="sm" />
              <span>Integrasi Payment Gateway DOKU</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Kredensial DOKU dibaca aman di sisi server melalui environment variable (.env / Secrets) dan tidak pernah dikirim atau disimpan di browser.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {settings.dokuEnabled ? 'DOKU ON' : 'DOKU OFF'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.dokuEnabled}
              aria-label="Aktifkan atau matikan payment gateway DOKU"
              onClick={onToggleDokuGateway}
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40',
                settings.dokuEnabled
                  ? 'border-purple-600 bg-purple-600'
                  : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform',
                  settings.dokuEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {dokuLoading ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300"
            >
              <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>Memeriksa status kredensial DOKU di environment server...</span>
            </div>
          ) : dokuLoadError ? (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{dokuLoadError}</span>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadDokuStatus()}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Coba Lagi</span>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Status Kredensial Server (.env)
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-semibold',
                      dokuStatus?.configured
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    )}
                  >
                    {dokuStatus?.configured ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Siap Digunakan</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Belum Lengkap</span>
                      </>
                    )}
                  </span>
                </div>

                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      DOKU_ENVIRONMENT
                    </dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">
                      {dokuStatus?.environment === 'production' ? 'Production (Live)' : 'Sandbox (Tester)'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      DOKU_MERCHANT_ID
                    </dt>
                    <dd
                      className={cn(
                        'text-xs font-semibold',
                        dokuStatus?.merchantIdConfigured
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      )}
                    >
                      {dokuStatus?.merchantIdConfigured ? 'Terkonfigurasi di .env' : 'Belum diisi'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      DOKU_SECRET_KEY
                    </dt>
                    <dd
                      className={cn(
                        'text-xs font-semibold',
                        dokuStatus?.secretKeyConfigured
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      )}
                    >
                      {dokuStatus?.secretKeyConfigured ? 'Terkonfigurasi di .env' : 'Belum diisi'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      DOKU_PUBLIC_KEY
                    </dt>
                    <dd
                      className={cn(
                        'text-xs font-semibold',
                        dokuStatus?.publicKeyConfigured
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {dokuStatus?.publicKeyConfigured ? 'Terkonfigurasi di .env' : 'Opsional (belum diisi)'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Endpoint &amp; Penjelasan Variabel
                </span>
                <dl className="space-y-2 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">API Base URL</dt>
                    <dd className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all">
                      {dokuStatus?.apiBaseUrl ?? 'https://api-sandbox.doku.com'}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">Callback / Webhook Path</dt>
                    <dd className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all">
                      {dokuStatus?.webhookPath ?? '/api/payment-gateway/doku/webhook'}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <code className="font-mono text-slate-700 dark:text-slate-300">DOKU_ENVIRONMENT</code> adalah penanda mode server (<code className="font-mono">sandbox</code> untuk tester, <code className="font-mono">production</code> untuk live), bukan kunci dari DOKU. Isi <code className="font-mono text-slate-700 dark:text-slate-300">DOKU_MERCHANT_ID</code>, <code className="font-mono text-slate-700 dark:text-slate-300">DOKU_SECRET_KEY</code>, dan opsional <code className="font-mono text-slate-700 dark:text-slate-300">DOKU_PUBLIC_KEY</code> di panel Secrets / <code className="font-mono">.env</code>.
                </p>
              </div>
            </div>
          )}

          {dokuTestFeedback && (
            <div
              role={dokuTestFeedback.type === 'error' ? 'alert' : 'status'}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm',
                dokuTestFeedback.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              )}
            >
              {dokuTestFeedback.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{dokuTestFeedback.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadDokuStatus()}
              disabled={dokuLoading}
            >
              <RefreshCw className={cn('h-4 w-4', dokuLoading && 'animate-spin')} aria-hidden="true" />
              <span>Muat Ulang Status .env</span>
            </Button>
            <Button
              type="button"
              onClick={() => void handleTestDokuSandbox()}
              disabled={dokuTestPending || dokuLoading}
            >
              {dokuTestPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Uji Kesiapan Sandbox</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Manual Bank Transfer */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingBankId ? 'Edit Tujuan Transfer Manual' : 'Tambah Bank / E-Wallet Manual'}
            </CardTitle>
            <CardDescription>
              Daftarkan rekening bank atau akun E-Wallet tujuan yang ditampilkan kepada user untuk top up manual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Jenis Tujuan
                </span>
                <div
                  role="group"
                  aria-label="Pilih jenis tujuan rekening bank atau e-wallet"
                  className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
                >
                  {(
                    [
                      { id: 'bank', label: 'Rekening Bank' },
                      { id: 'ewallet', label: 'E-Wallet' },
                    ] as const
                  ).map((opt) => {
                    const isSelected = (bankForm.accountType ?? 'bank') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          setBankForm((prev) => ({
                            ...prev,
                            accountType: opt.id,
                            bankName: '',
                          }))
                        }
                        className={cn(
                          'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-white text-purple-900 shadow-xs dark:bg-slate-900 dark:text-amber-300'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="manual-bank-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {(bankForm.accountType ?? 'bank') === 'ewallet'
                    ? 'Nama E-Wallet'
                    : 'Nama Bank'}
                </label>
                <div className="flex items-center gap-2.5">
                  <BankLogoBadge bankOrChannelName={bankForm.bankName} size="md" />
                  <input
                    id="manual-bank-name"
                    type="text"
                    list={
                      (bankForm.accountType ?? 'bank') === 'ewallet'
                        ? 'indonesian-ewallet-options'
                        : 'indonesian-bank-options'
                    }
                    value={bankForm.bankName}
                    onChange={(e) =>
                      setBankForm((prev) => ({ ...prev, bankName: e.target.value }))
                    }
                    placeholder={
                      (bankForm.accountType ?? 'bank') === 'ewallet'
                        ? 'Ketik atau pilih E-Wallet (DANA, OVO, GoPay...)'
                        : 'Ketik atau pilih dari seluruh bank Indonesia...'
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <datalist id="indonesian-bank-options">
                    {INDONESIAN_BANK_OPTIONS.map((bank) => (
                      <option key={bank.slug} value={bank.name} />
                    ))}
                  </datalist>
                  <datalist id="indonesian-ewallet-options">
                    {INDONESIAN_EWALLET_OPTIONS.map((wallet) => (
                      <option key={wallet.slug} value={wallet.name} />
                    ))}
                  </datalist>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {(bankForm.accountType ?? 'bank') === 'ewallet'
                    ? `Otomatis mencocokkan ${formatNumber(INDONESIAN_EWALLET_OPTIONS.length)} logo E-Wallet populer di Indonesia.`
                    : `Otomatis mencocokkan ${formatNumber(INDONESIAN_BANK_OPTIONS.length)} logo bank di Indonesia (termasuk BPD & bank digital).`}
                </p>
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label={
                    (bankForm.accountType ?? 'bank') === 'ewallet'
                      ? 'Pilih cepat E-Wallet populer Indonesia'
                      : 'Pilih cepat bank populer Indonesia'
                  }
                >
                  {(
                    (bankForm.accountType ?? 'bank') === 'ewallet'
                      ? QUICK_PICK_EWALLETS
                      : QUICK_PICK_BANKS
                  ).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setBankForm((prev) => ({ ...prev, bankName: label }))
                      }
                      className={cn(
                        'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                        bankForm.bankName.toLowerCase() === label.toLowerCase()
                          ? 'border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-950/50 dark:text-purple-300'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-700'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="manual-bank-number"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {(bankForm.accountType ?? 'bank') === 'ewallet'
                    ? 'Nomor HP / ID E-Wallet'
                    : 'Nomor Rekening'}
                </label>
                <input
                  id="manual-bank-number"
                  type="text"
                  inputMode="numeric"
                  value={bankForm.accountNumber}
                  onChange={(e) =>
                    setBankForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                  placeholder={
                    (bankForm.accountType ?? 'bank') === 'ewallet'
                      ? 'Masukkan nomor HP terdaftar (contoh: 081234567890)'
                      : 'Masukkan 6–20 digit nomor rekening'
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono-num text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="manual-bank-holder"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {(bankForm.accountType ?? 'bank') === 'ewallet'
                    ? 'Atas Nama Akun E-Wallet'
                    : 'Atas Nama Rekening'}
                </label>
                <input
                  id="manual-bank-holder"
                  type="text"
                  value={bankForm.accountHolder}
                  onChange={(e) =>
                    setBankForm((prev) => ({ ...prev, accountHolder: e.target.value }))
                  }
                  placeholder={
                    (bankForm.accountType ?? 'bank') === 'ewallet'
                      ? 'Nama pemilik akun E-Wallet resmi'
                      : 'Nama penerima resmi rekening'
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="manual-bank-note"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Cabang / Catatan Verifikasi (Opsional)
                </label>
                <input
                  id="manual-bank-note"
                  type="text"
                  value={bankForm.branchOrNote}
                  onChange={(e) =>
                    setBankForm((prev) => ({ ...prev, branchOrNote: e.target.value }))
                  }
                  placeholder="Contoh: KCU Jakarta Pusat · Cantumkan kode unik"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800 cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tampilkan sebagai tujuan tersedia (Aktif)
                </span>
                <input
                  type="checkbox"
                  checked={bankForm.isActive}
                  onChange={(e) =>
                    setBankForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                />
              </label>

              {bankFormFeedback && (
                <div
                  role={bankFormFeedback.type === 'error' ? 'alert' : 'status'}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                    bankFormFeedback.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  )}
                >
                  {bankFormFeedback.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{bankFormFeedback.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button type="submit">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {editingBankId
                      ? 'Simpan Perubahan'
                      : (bankForm.accountType ?? 'bank') === 'ewallet'
                        ? 'Simpan E-Wallet Manual'
                        : 'Simpan Bank Manual'}
                  </span>
                </Button>
                {editingBankId && (
                  <Button type="button" variant="outline" onClick={handleCancelEditBank}>
                    Batal Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-lg">Daftar Bank &amp; E-Wallet Transfer Manual</CardTitle>
            <CardDescription>
              Aktifkan atau nonaktifkan rekening bank maupun akun E-Wallet manual tanpa menghapus riwayat konfigurasinya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settings.manualBanks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-800">
                <Landmark className="h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Belum ada rekening bank atau E-Wallet transfer manual
                </p>
                <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                  Tambahkan rekening bank atau akun E-Wallet tujuan pada formulir di samping agar user dapat melakukan top up transfer manual.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {settings.manualBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <BankLogoBadge bankOrChannelName={bank.bankName} size="md" />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {bank.bankName}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                            ·
                          </span>
                          <span className="text-xs font-medium text-purple-700 dark:text-amber-300">
                            {bank.accountType === 'ewallet' ? 'E-Wallet' : 'Bank'}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                            ·
                          </span>
                          <span className="font-mono-num font-medium text-slate-800 dark:text-slate-200">
                            {formatBankAccountNumber(bank.accountNumber)}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                            ·
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              bank.isActive
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-500 dark:text-slate-400'
                            )}
                          >
                            {bank.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          a.n. {bank.accountHolder}
                          {bank.branchOrNote ? ` · ${bank.branchOrNote}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={bank.isActive}
                        aria-label={`Aktifkan rekening ${bank.bankName} ${bank.accountNumber}`}
                        onClick={() => onToggleManualBankStatus(bank.id)}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40',
                          bank.isActive
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform',
                            bank.isActive ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleStartEditBank(bank)}
                        aria-label={`Edit rekening ${bank.bankName} ${bank.accountNumber}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (editingBankId === bank.id) {
                            handleCancelEditBank();
                          }
                          onDeleteManualBank(bank.id);
                        }}
                        aria-label={`Hapus rekening ${bank.bankName} ${bank.accountNumber}`}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Payment Methods ON / OFF */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Kontrol ON / OFF Metode Pembayaran</CardTitle>
            <CardDescription className="mt-1">
              Nyalakan atau matikan kanal pembayaran yang tampil saat user melakukan top up, termasuk QRIS, Virtual Account, E-Wallet, dan Transfer Bank Manual.
            </CardDescription>
          </div>

          <div
            role="group"
            aria-label="Filter penyedia metode pembayaran"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 shrink-0"
          >
            {(
              [
                { id: 'semua', label: 'Semua' },
                { id: 'doku', label: 'DOKU Gateway' },
                { id: 'manual', label: 'Manual' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={methodFilter === tab.id}
                onClick={() => setMethodFilter(tab.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                  methodFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!settings.dokuEnabled && (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Gateway DOKU sedang dimatikan (OFF). Pengaturan kanal DOKU di bawah tetap tersimpan, tetapi tidak akan ditawarkan ke user hingga DOKU diaktifkan kembali.
              </span>
            </div>
          )}

          {methodFeedback && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{methodFeedback}</span>
            </div>
          )}

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredMethods.map((method) => {
              const blockedByDokuOff = method.provider === 'doku' && !settings.dokuEnabled;
              const stackLogoAboveText = method.code === 'EWALLET_DOKU';
              return (
                <div
                  key={method.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div
                    className={cn(
                      'flex items-start min-w-0',
                      stackLogoAboveText ? 'flex-col gap-2.5' : 'gap-3'
                    )}
                  >
                    <BankLogoBadge
                      bankOrChannelName={method.name}
                      fallbackCategory={method.category}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {method.name}
                        </p>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {method.provider === 'doku' ? 'DOKU' : 'Manual'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                          ·
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {method.feeLabel}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        {method.description}
                      </p>
                      {blockedByDokuOff && method.enabled && (
                        <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                          Tertunda sementara karena Gateway DOKU berstatus OFF.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span
                      className={cn(
                        'font-mono-num text-xs font-semibold w-14 text-right',
                        method.enabled
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {method.enabled ? 'ON' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={method.enabled}
                      aria-label={`Ubah status metode pembayaran ${method.name}`}
                      onClick={() => handleToggleMethod(method)}
                      className={cn(
                        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40',
                        method.enabled
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform',
                          method.enabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
