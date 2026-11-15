'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Eye,
  Power,
  Search,
  TrendingUp,
  UserCheck,
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
import type {
  AdminInvestmentRecord,
  AdminInvestmentStatus,
} from '@/src/lib/dashboard-schema';
import {
  filterAdminInvestments,
  getInvestmentSummary,
  type InvestmentFilter,
} from '@/src/lib/investments';
import { cn, formatNumber, formatRupiah } from '@/src/lib/utils';

interface InvestmentViewProps {
  investments: AdminInvestmentRecord[];
  onChangeStatus: (
    investmentId: string,
    nextStatus: Extract<AdminInvestmentStatus, 'Active' | 'Nonaktif'>,
    reason: string
  ) => string | null;
  onSelectUser?: (userId: string) => void;
}

const FILTER_TABS: ReadonlyArray<{ id: InvestmentFilter; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'Active', label: 'Active' },
  { id: 'Nonaktif', label: 'Nonaktif' },
  { id: 'Selesai', label: 'Selesai' },
];

function StatusBadge({ status }: { status: AdminInvestmentStatus }) {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
        {status}
      </span>
    );
  }
  if (status === 'Nonaktif') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {status}
    </span>
  );
}

export function InvestmentView({
  investments,
  onChangeStatus,
  onSelectUser,
}: InvestmentViewProps) {
  const [filter, setFilter] = useState<InvestmentFilter>('semua');
  const [query, setQuery] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<{
    record: AdminInvestmentRecord;
    nextStatus: Extract<AdminInvestmentStatus, 'Active' | 'Nonaktif'>;
  } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  const summary = getInvestmentSummary(investments);
  const filtered = filterAdminInvestments(investments, { filter, query });
  const viewingRecord = viewingId
    ? (investments.find((item) => item.id === viewingId) ?? null)
    : null;

  useEffect(() => {
    if (!viewingRecord && !statusModalTarget) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (statusModalTarget) {
          setStatusModalTarget(null);
          setStatusReason('');
          setStatusError(null);
        } else {
          setViewingId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingRecord, statusModalTarget]);

  const openStatusModal = (
    record: AdminInvestmentRecord,
    nextStatus: Extract<AdminInvestmentStatus, 'Active' | 'Nonaktif'>
  ) => {
    setViewingId(null);
    setStatusModalTarget({ record, nextStatus });
    setStatusReason('');
    setStatusError(null);
  };

  const handleConfirmStatusChange = () => {
    if (!statusModalTarget) return;
    const err = onChangeStatus(
      statusModalTarget.record.id,
      statusModalTarget.nextStatus,
      statusReason
    );
    if (err) {
      setStatusError(err);
      return;
    }
    setStatusModalTarget(null);
    setStatusReason('');
    setStatusError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Investment
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Pemantauan investasi berjalan per user, progres klaim harian, estimasi total hasil, dan kontrol status aktif.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Investment
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="inv-total-count"
            >
              {formatNumber(summary.totalCount)}
            </p>
            <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
              {formatRupiah(summary.totalSellingValue)} total harga jual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Status Active
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-emerald-700 dark:text-emerald-400"
              data-testid="inv-active-count"
            >
              {formatNumber(summary.activeCount)}
            </p>
            <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
              {formatRupiah(summary.activeSellingValue)} modal berjalan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Estimasi Hasil
            </p>
            <p
              className="mt-2 font-mono-num text-xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="inv-total-estimated"
            >
              {formatRupiah(summary.totalEstimatedValue)}
            </p>
            <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
              {formatRupiah(summary.totalPaidClaimsValue)} sudah diklaim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Nonaktif / Selesai
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="inv-inactive-completed-count"
            >
              {formatNumber(summary.inactiveCount + summary.completedCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatNumber(summary.inactiveCount)} nonaktif · {formatNumber(summary.completedCount)} selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              role="group"
              aria-label="Filter status investment"
            >
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  aria-pressed={filter === tab.id}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari ID, nama user, no. HP, atau produk..."
                aria-label="Cari data investment"
                className="pl-9"
              />
            </div>
          </div>
          <CardDescription className="pt-2">
            Menampilkan {formatNumber(filtered.length)} dari {formatNumber(investments.length)} data investment user.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Data investment tidak ditemukan
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ubah kata kunci pencarian atau pilih filter status lainnya.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery('');
                  setFilter('semua');
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2.5 text-[11px]">ID</TableHead>
                  <TableHead className="px-1.5 text-[11px]">User</TableHead>
                  <TableHead className="px-1.5 text-[11px]">Product</TableHead>
                  <TableHead className="px-1.5 text-right text-[11px] whitespace-normal leading-tight">Harga Jual</TableHead>
                  <TableHead className="px-1.5 text-[11px] whitespace-normal leading-tight">Durasi / Klaim</TableHead>
                  <TableHead className="px-1.5 text-right text-[11px] whitespace-normal leading-tight">Pendapatan / Klaim</TableHead>
                  <TableHead className="px-1.5 text-right text-[11px] whitespace-normal leading-tight">Total Estimasi</TableHead>
                  <TableHead className="px-1.5 text-[11px]">Status</TableHead>
                  <TableHead className="px-1.5 text-[11px] whitespace-normal leading-tight">Start Date</TableHead>
                  <TableHead className="px-1.5 text-[11px] whitespace-normal leading-tight">End Date</TableHead>
                  <TableHead className="px-1.5 text-[11px] whitespace-normal leading-tight max-w-[115px]">Alasan Perubahan Status</TableHead>
                  <TableHead className="px-2.5 text-right text-[11px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const isActive = item.status === 'Active';
                  const isInactive = item.status === 'Nonaktif';

                  return (
                    <TableRow key={item.id} data-testid={`investment-row-${item.id}`}>
                      <TableCell className="px-2.5 py-2.5 font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {item.id}
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 whitespace-nowrap">
                        {item.userId && onSelectUser ? (
                          <button
                            type="button"
                            onClick={() => onSelectUser(item.userId!)}
                            className="text-left cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40"
                          >
                            <div className="text-xs font-semibold text-slate-900 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400">
                              {item.userName}
                            </div>
                            <div className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                              {item.userPhone}
                            </div>
                          </button>
                        ) : (
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {item.userName}
                            </div>
                            <div className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                              {item.userPhone}
                            </div>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 max-w-[118px] leading-snug">
                        {item.productName}
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 text-right font-mono-num text-xs font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatRupiah(item.sellingPrice)}
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 whitespace-nowrap">
                        <div className="font-mono-num text-xs font-medium text-slate-900 dark:text-slate-100">
                          {item.durationDays} Hari
                        </div>
                        <div className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                          {item.claimsCompleted}/{item.totalClaims} klaim
                        </div>
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 text-right font-mono-num text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {formatRupiah(item.incomePerClaim)}
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 text-right font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatRupiah(item.totalEstimated)}
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 font-mono-num text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        <span className="whitespace-nowrap">{item.startDate.split(' ')[0]}</span>
                        <br />
                        <span className="text-slate-400 dark:text-slate-500">{item.startDate.split(' ')[1] ?? ''}</span>
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 font-mono-num text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        <span className="whitespace-nowrap">{item.endDate.split(' ')[0]}</span>
                        <br />
                        <span className="text-slate-400 dark:text-slate-500">{item.endDate.split(' ')[1] ?? ''}</span>
                      </TableCell>

                      <TableCell className="px-1.5 py-2.5 text-[11px] text-slate-600 dark:text-slate-300 max-w-[115px] leading-snug">
                        <span className="line-clamp-2" title={item.statusChangeReason}>
                          {item.statusChangeReason}
                        </span>
                      </TableCell>

                      <TableCell className="px-2.5 py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex flex-col items-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            aria-label={`View investment ${item.id}`}
                            onClick={() => setViewingId(item.id)}
                          >
                            <Eye className="h-3 w-3" aria-hidden="true" />
                            <span>View</span>
                          </Button>

                          {isActive && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 border-rose-200 px-2 text-[11px] text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                              aria-label={`Nonaktifkan investment ${item.id}`}
                              onClick={() => openStatusModal(item, 'Nonaktif')}
                            >
                              <Power className="h-3 w-3" aria-hidden="true" />
                              <span>Nonaktifkan</span>
                            </Button>
                          )}

                          {isInactive && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 border-emerald-200 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              aria-label={`Aktifkan investment ${item.id}`}
                              onClick={() => openStatusModal(item, 'Active')}
                            >
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              <span>Aktifkan</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Detail Modal */}
      {viewingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-investment-title"
          onClick={() => setViewingId(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      id="view-investment-title"
                      className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                    >
                      Detail Investment #{viewingRecord.id}
                    </h2>
                    <StatusBadge status={viewingRecord.status} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {viewingRecord.productName} · {viewingRecord.userName} ({viewingRecord.userPhone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingId(null)}
                aria-label="Tutup modal detail investment"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {/* Financial Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/60 sm:grid-cols-3">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Harga Jual</p>
                  <p className="mt-0.5 font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatRupiah(viewingRecord.sellingPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Pendapatan / Klaim</p>
                  <p className="mt-0.5 font-mono-num text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(viewingRecord.incomePerClaim)}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-slate-500 dark:text-slate-400">Total Estimasi</p>
                  <p className="mt-0.5 font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatRupiah(viewingRecord.totalEstimated)}
                  </p>
                </div>
              </div>

              {/* Claim Progress */}
              <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Progres Klaim ({viewingRecord.durationDays} Hari)
                  </span>
                  <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    {viewingRecord.claimsCompleted}/{viewingRecord.totalClaims} klaim
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-xs bg-purple-600 transition-all duration-300 dark:bg-purple-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (viewingRecord.claimsCompleted / Math.max(1, viewingRecord.totalClaims)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 font-mono-num">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Mulai: {viewingRecord.startDate}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono-num">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Berakhir: {viewingRecord.endDate}
                  </span>
                </div>
              </div>

              {/* Status Reason & History */}
              <div className="space-y-2 rounded-lg border border-slate-200 p-3.5 text-xs dark:border-slate-800">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Alasan Perubahan Status Saat Ini
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {viewingRecord.statusChangeReason}
                </p>

                {viewingRecord.statusHistory.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <p className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Riwayat Perubahan Status
                    </p>
                    <ul className="space-y-1.5">
                      {viewingRecord.statusHistory.map((h) => (
                        <li
                          key={h.id}
                          className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-2.5 py-2 dark:bg-slate-950/60"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {h.fromStatus} → {h.toStatus}
                            </span>
                            <p className="text-slate-600 dark:text-slate-400">{h.reason}</p>
                          </div>
                          <div className="shrink-0 text-right font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                            <div>{h.changedAt}</div>
                            <div className="font-sans">{h.actor}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div>
                  {viewingRecord.userId && onSelectUser && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const uid = viewingRecord.userId!;
                        setViewingId(null);
                        onSelectUser(uid);
                      }}
                    >
                      <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Lihat Profil User</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {viewingRecord.status === 'Active' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      onClick={() => openStatusModal(viewingRecord, 'Nonaktif')}
                    >
                      <Power className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Nonaktifkan</span>
                    </Button>
                  )}
                  {viewingRecord.status === 'Nonaktif' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                      onClick={() => openStatusModal(viewingRecord, 'Active')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Aktifkan</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setViewingId(null)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusModalTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-investment-title"
          onClick={() => {
            setStatusModalTarget(null);
            setStatusReason('');
            setStatusError(null);
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2
                  id="status-investment-title"
                  className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  {statusModalTarget.nextStatus === 'Nonaktif'
                    ? `Nonaktifkan Investment #${statusModalTarget.record.id}`
                    : `Aktifkan Investment #${statusModalTarget.record.id}`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {statusModalTarget.record.userName} · {statusModalTarget.record.productName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusModalTarget(null);
                  setStatusReason('');
                  setStatusError(null);
                }}
                aria-label="Tutup modal ubah status investment"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Harga Jual</span>
                  <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    {formatRupiah(statusModalTarget.record.sellingPrice)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Progres Klaim</span>
                  <span className="font-mono-num text-slate-700 dark:text-slate-300">
                    {statusModalTarget.record.claimsCompleted}/{statusModalTarget.record.totalClaims} klaim
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="investment-status-reason"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Alasan Perubahan Status
                </label>
                <textarea
                  id="investment-status-reason"
                  rows={3}
                  value={statusReason}
                  onChange={(e) => {
                    setStatusReason(e.target.value);
                    if (statusError) setStatusError(null);
                  }}
                  placeholder={
                    statusModalTarget.nextStatus === 'Nonaktif'
                      ? 'Contoh: Permintaan verifikasi manual atau pelanggaran ketentuan'
                      : 'Contoh: Verifikasi selesai, kontrak diaktifkan kembali'
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                {statusError && (
                  <p
                    role="alert"
                    className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{statusError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusModalTarget(null);
                    setStatusReason('');
                    setStatusError(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusModalTarget.nextStatus === 'Nonaktif' ? 'outline' : 'primary'}
                  className={cn(
                    statusModalTarget.nextStatus === 'Nonaktif' &&
                      'border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:text-white dark:border-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700'
                  )}
                  onClick={handleConfirmStatusChange}
                >
                  {statusModalTarget.nextStatus === 'Nonaktif'
                    ? 'Konfirmasi Nonaktifkan'
                    : 'Konfirmasi Aktifkan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
