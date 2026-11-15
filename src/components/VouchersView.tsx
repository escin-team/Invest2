'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { VoucherRecord, VoucherStatus } from '@/src/lib/dashboard-schema';
import {
  filterVouchers,
  generateVoucherCode,
  getVoucherSummary,
  type CreateVoucherInput,
  type VoucherStatusFilter,
} from '@/src/lib/vouchers';
import { cn, formatNumber, formatRupiah } from '@/src/lib/utils';

interface VouchersViewProps {
  vouchers: VoucherRecord[];
  onCreateVoucher: (input: CreateVoucherInput) => string | null;
  onToggleVoucherStatus: (voucherId: string) => string | null;
  onDeleteVoucher: (voucherId: string) => void;
}

const STATUS_BADGE_MAP: Record<VoucherStatus, string> = {
  Active:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400',
  Expired:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
  Depleted:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
  Inactive:
    'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

function getDefaultExpiryDatetimeLocal(): string {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const year = future.getFullYear();
  const month = String(future.getMonth() + 1).padStart(2, '0');
  const day = String(future.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T23:59`;
}

export function VouchersView({
  vouchers,
  onCreateVoucher,
  onToggleVoucherStatus,
  onDeleteVoucher,
}: VouchersViewProps) {
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState<VoucherStatusFilter>('all');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<VoucherStatusFilter>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [totalAmountInput, setTotalAmountInput] = useState('100000');
  const [quotaInput, setQuotaInput] = useState('10');
  const [expiredAtInput, setExpiredAtInput] = useState('');
  const [createStatusInput, setCreateStatusInput] = useState<'Active' | 'Inactive'>(
    'Active'
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [viewingVoucherId, setViewingVoucherId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const viewingVoucher =
    vouchers.find((item) => item.id === viewingVoucherId) ?? null;

  const filteredVouchers = filterVouchers(vouchers, {
    query: appliedQuery,
    statusFilter: appliedStatus,
  });
  const summary = getVoucherSummary(vouchers);

  useEffect(() => {
    if (!createOpen && !viewingVoucherId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (viewingVoucherId) {
          setViewingVoucherId(null);
          setConfirmDeleteId(null);
          setDetailError(null);
        } else {
          setCreateOpen(false);
          setFormError(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createOpen, viewingVoucherId]);

  const openCreateModal = () => {
    setCodeInput(generateVoucherCode(vouchers));
    setTotalAmountInput('100000');
    setQuotaInput('10');
    setExpiredAtInput(getDefaultExpiryDatetimeLocal());
    setCreateStatusInput('Active');
    setFormError(null);
    setCreateOpen(true);
  };

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedQuery(searchInput);
    setAppliedStatus(statusInput);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusInput('all');
    setAppliedQuery('');
    setAppliedStatus('all');
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number.parseInt(totalAmountInput.replace(/[^\d]/g, ''), 10);
    const parsedQuota = Number.parseInt(quotaInput.replace(/[^\d]/g, ''), 10);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Total Amount harus lebih dari Rp 0.');
      return;
    }
    if (!Number.isFinite(parsedQuota) || parsedQuota < 1) {
      setFormError('Quota minimal 1 penerima.');
      return;
    }

    const error = onCreateVoucher({
      code: codeInput,
      totalAmount: parsedAmount,
      quota: parsedQuota,
      expiredAt: expiredAtInput,
      status: createStatusInput,
    });
    if (error) {
      setFormError(error);
      return;
    }

    setFeedbackMessage(
      `Voucher "${codeInput.trim().toUpperCase()}" dengan anggaran ${formatRupiah(parsedAmount)} berhasil dibuat.`
    );
    setCreateOpen(false);
    setFormError(null);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1800);
    }
  };

  const handleToggleViewingStatus = () => {
    if (!viewingVoucher) return;
    const err = onToggleVoucherStatus(viewingVoucher.id);
    if (err) {
      setDetailError(err);
      return;
    }
    setDetailError(null);
    setFeedbackMessage(
      `Status voucher "${viewingVoucher.code}" diperbarui.`
    );
  };

  const handleConfirmDelete = (voucher: VoucherRecord) => {
    onDeleteVoucher(voucher.id);
    setViewingVoucherId(null);
    setConfirmDeleteId(null);
    setDetailError(null);
    setFeedbackMessage(`Voucher "${voucher.code}" telah dihapus.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Vouchers
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Kelola kode voucher saldo promo, pantau sisa anggaran, kuota klaim, dan riwayat penukaran member.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Create Voucher</span>
        </Button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Vouchers
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(summary.totalCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatNumber(summary.activeCount)} aktif · {formatNumber(summary.expiredCount)} kedaluwarsa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Vouchers
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatNumber(summary.activeCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Siap diklaim oleh member
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Amount Pool
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatRupiah(summary.totalBudget)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Akumulasi anggaran seluruh voucher
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Remaining Pool
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-purple-700 dark:text-purple-400">
              {formatRupiah(summary.totalRemaining)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sisa saldo yang belum diklaim
            </p>
          </CardContent>
        </Card>
      </div>

      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{feedbackMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            aria-label="Tutup notifikasi voucher"
            className="rounded-md p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Vouchers Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="relative w-full md:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(e) => {
                  const next = e.target.value;
                  setSearchInput(next);
                  setAppliedQuery(next);
                }}
                placeholder="Search voucher code"
                aria-label="Search voucher code"
                className="pl-9 font-mono-num uppercase placeholder:normal-case"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusInput}
                onChange={(e) => {
                  const next = e.target.value as VoucherStatusFilter;
                  setStatusInput(next);
                  setAppliedStatus(next);
                }}
                aria-label="Filter status voucher"
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Depleted">Depleted</option>
                <option value="Inactive">Inactive</option>
              </select>

              <Button type="submit" variant="outline" size="sm" className="h-10 px-4">
                Filter
              </Button>
            </div>
          </form>
          <CardDescription className="pt-2">
            Menampilkan {formatNumber(filteredVouchers.length)} dari{' '}
            {formatNumber(vouchers.length)} kode voucher.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filteredVouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Ticket
                className="h-8 w-8 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Voucher tidak ditemukan
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Belum ada kode voucher yang cocok dengan filter atau pencarian saat ini.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {(appliedQuery || appliedStatus !== 'all') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                  >
                    Reset Filter
                  </Button>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={openCreateModal}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Create Voucher</span>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Code</TableHead>
                  <TableHead className="px-3">Total Amount</TableHead>
                  <TableHead className="px-3">Remaining</TableHead>
                  <TableHead className="px-3 text-right">Quota</TableHead>
                  <TableHead className="px-3 text-right">Claimed</TableHead>
                  <TableHead className="px-3 whitespace-nowrap">Expired At</TableHead>
                  <TableHead className="px-3">Status</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono-num text-xs font-bold tracking-wider text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {voucher.code}
                      </span>
                    </TableCell>

                    <TableCell className="px-3 font-mono-num text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatRupiah(voucher.totalAmount)}
                    </TableCell>

                    <TableCell className="px-3 font-mono-num text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatRupiah(voucher.remainingAmount)}
                    </TableCell>

                    <TableCell className="px-3 text-right font-mono-num text-sm text-slate-700 dark:text-slate-300">
                      {formatNumber(voucher.quota)}
                    </TableCell>

                    <TableCell className="px-3 text-right font-mono-num text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatNumber(voucher.claimedCount)}
                    </TableCell>

                    <TableCell className="px-3 font-mono-num text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {voucher.expiredAt}
                    </TableCell>

                    <TableCell className="px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                          STATUS_BADGE_MAP[voucher.status]
                        )}
                      >
                        {voucher.status}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingVoucherId(voucher.id);
                          setConfirmDeleteId(null);
                          setDetailError(null);
                        }}
                        aria-label={`View voucher ${voucher.code}`}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Voucher Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-voucher-modal-title"
          onClick={() => {
            setCreateOpen(false);
            setFormError(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2
                  id="create-voucher-modal-title"
                  className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  Create Voucher
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Buat kode voucher baru dengan anggaran dana, batas kuota penerima, dan tanggal kedaluwarsa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setFormError(null);
                }}
                aria-label="Tutup modal create voucher"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 p-5" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="voucher-code-input"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Code
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="voucher-code-input"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: 5N9JK5"
                    className="font-mono-num uppercase tracking-wider"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCodeInput(generateVoucherCode(vouchers))}
                    className="h-10 shrink-0"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Acak</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="voucher-amount-input"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Total Amount (Rp)
                  </label>
                  <Input
                    id="voucher-amount-input"
                    type="number"
                    min={1000}
                    step={1000}
                    value={totalAmountInput}
                    onChange={(e) => setTotalAmountInput(e.target.value)}
                    placeholder="100000"
                    className="font-mono-num"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="voucher-quota-input"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Quota
                  </label>
                  <Input
                    id="voucher-quota-input"
                    type="number"
                    min={1}
                    step={1}
                    value={quotaInput}
                    onChange={(e) => setQuotaInput(e.target.value)}
                    placeholder="10"
                    className="font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="voucher-expired-input"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Expired At
                  </label>
                  <Input
                    id="voucher-expired-input"
                    type="datetime-local"
                    value={expiredAtInput}
                    onChange={(e) => setExpiredAtInput(e.target.value)}
                    className="font-mono-num"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="voucher-status-select"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Status
                  </label>
                  <select
                    id="voucher-status-select"
                    value={createStatusInput}
                    onChange={(e) =>
                      setCreateStatusInput(
                        e.target.value as 'Active' | 'Inactive'
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreateOpen(false);
                    setFormError(null);
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Simpan Voucher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Voucher Detail Modal */}
      {viewingVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-voucher-modal-title"
          onClick={() => {
            setViewingVoucherId(null);
            setConfirmDeleteId(null);
            setDetailError(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono-num text-sm font-bold tracking-wider text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {viewingVoucher.code}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                      STATUS_BADGE_MAP[viewingVoucher.status]
                    )}
                  >
                    {viewingVoucher.status}
                  </span>
                </div>
                <h2
                  id="view-voucher-modal-title"
                  className="mt-2 font-display text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  Detail Voucher
                </h2>
                <p className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                  Dibuat {viewingVoucher.createdAt} · Kedaluwarsa{' '}
                  {viewingVoucher.expiredAt}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyCode(viewingVoucher.code)}
                >
                  {copiedCode === viewingVoucher.code ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingVoucherId(null);
                    setConfirmDeleteId(null);
                    setDetailError(null);
                  }}
                  aria-label="Tutup detail voucher"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Total Amount
                  </p>
                  <p className="mt-1 font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatRupiah(viewingVoucher.totalAmount)}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Remaining
                  </p>
                  <p className="mt-1 font-mono-num text-sm font-bold text-purple-700 dark:text-purple-400">
                    {formatRupiah(viewingVoucher.remainingAmount)}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Quota
                  </p>
                  <p className="mt-1 font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatNumber(viewingVoucher.quota)}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Claimed
                  </p>
                  <p className="mt-1 font-mono-num text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatNumber(viewingVoucher.claimedCount)}
                  </p>
                </div>
              </div>

              {/* Claimed Progress SVG */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Pemakaian Anggaran &amp; Kuota</span>
                  <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    {formatRupiah(
                      viewingVoucher.totalAmount - viewingVoucher.remainingAmount
                    )}{' '}
                    terklaim ({formatNumber(viewingVoucher.claimedCount)}/
                    {formatNumber(viewingVoucher.quota)} user)
                  </span>
                </div>
                <svg
                  viewBox="0 0 100 4"
                  preserveAspectRatio="none"
                  className="h-2 w-full overflow-hidden rounded-full"
                  role="progressbar"
                  aria-label="Persentase anggaran voucher terklaim"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(
                    ((viewingVoucher.totalAmount - viewingVoucher.remainingAmount) /
                      Math.max(1, viewingVoucher.totalAmount)) *
                      100
                  )}
                >
                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="4"
                    className="fill-slate-200 dark:fill-slate-800"
                  />
                  <rect
                    x="0"
                    y="0"
                    width={Math.min(
                      100,
                      Math.max(
                        0,
                        ((viewingVoucher.totalAmount - viewingVoucher.remainingAmount) /
                          Math.max(1, viewingVoucher.totalAmount)) *
                          100
                      )
                    )}
                    height="4"
                    className="fill-purple-600"
                  />
                </svg>
              </div>

              {/* Claims History */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Riwayat Klaim ({formatNumber(viewingVoucher.claims.length)})
                </h3>
                {viewingVoucher.claims.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    Belum ada member yang mengklaim kode voucher ini.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                    {viewingVoucher.claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {claim.claimerName}
                          </p>
                          <p className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                            {claim.claimerMaskedPhone} · {claim.claimedAt}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                          {formatRupiah(claim.claimedAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {detailError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{detailError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  {(viewingVoucher.status === 'Active' ||
                    viewingVoucher.status === 'Inactive') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleToggleViewingStatus}
                    >
                      {viewingVoucher.status === 'Active'
                        ? 'Nonaktifkan Voucher'
                        : 'Aktifkan Voucher'}
                    </Button>
                  )}

                  {confirmDeleteId === viewingVoucher.id ? (
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleConfirmDelete(viewingVoucher)}
                      >
                        Konfirmasi Hapus
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDeleteId(viewingVoucher.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Hapus Voucher</span>
                    </Button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewingVoucherId(null);
                    setConfirmDeleteId(null);
                    setDetailError(null);
                  }}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
