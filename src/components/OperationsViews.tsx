'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  FileCheck2,
  ImagePlus,
  Infinity as InfinityIcon,
  LayoutGrid,
  Link2,
  List,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { BankLogoBadge } from '@/src/components/BankLogoBadge';
import { ProductEditModal } from '@/src/components/ProductEditModal';
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
import {
  filterAdminUsers,
  getNextProductId,
  getNonActiveUserSummary,
  type UserSegmentFilter,
} from '@/src/lib/dashboard-data';
import {
  ALL_USER_LEVELS,
  formatAllowedLevelsLabel,
} from '@/src/lib/user-levels';
import type {
  AdminUserRecord,
  DashboardSnapshot,
  InvestmentProduct,
  ProductCategory,
  QueueTransaction,
} from '@/src/lib/dashboard-schema';
import {
  buildReferralRegistrationLink,
  deriveUserReferralCode,
} from '@/src/lib/product-commissions';
import {
  getNextUserSequence,
  type CreateAdminUserInput,
} from '@/src/lib/user-diagnostics';
import { resolveProductImageSrc } from '@/src/lib/product-images';
import { cn, formatNumber, formatProductCommission, formatRupiah, validateProductImageFile } from '@/src/lib/utils';

function resolveProductImage(product: InvestmentProduct): string {
  return resolveProductImageSrc(product);
}

function ProductThumbnail({
  product,
  className,
}: {
  product: InvestmentProduct;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolveProductImage(product);
  const hasError = failedSrc === src;

  if (hasError || !src) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
          className
        )}
        aria-label={product.name}
      >
        <PackageCheck className="h-5 w-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={product.name}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={cn('object-cover', className)}
    />
  );
}

interface AntreanViewProps {
  transactions: QueueTransaction[];
  operational: DashboardSnapshot['operational'];
  initialTypeFilter: 'semua' | 'topup' | 'withdrawal';
  onProcessTransaction: (txId: string, action: 'disetujui' | 'ditolak') => void;
  onApproveWithdrawalWithProof: (
    txId: string,
    payload: { proofUrl: string; proofFileName: string; publishImmediately: boolean }
  ) => void;
  onOpenWithdrawalPublication?: () => void;
  onResetQueue: () => void;
}

export function AntreanView({
  transactions,
  operational,
  initialTypeFilter,
  onProcessTransaction,
  onApproveWithdrawalWithProof,
  onOpenWithdrawalPublication,
  onResetQueue,
}: AntreanViewProps) {
  const [typeFilter, setTypeFilter] = useState<'semua' | 'topup' | 'withdrawal'>(
    initialTypeFilter
  );
  const [query, setQuery] = useState('');
  const [approvingWithdrawalTx, setApprovingWithdrawalTx] = useState<QueueTransaction | null>(null);
  const [approvalProofUrl, setApprovalProofUrl] = useState('');
  const [approvalProofName, setApprovalProofName] = useState('');
  const [approvalProofError, setApprovalProofError] = useState<string | null>(null);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const approvalFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!approvingWithdrawalTx) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setApprovingWithdrawalTx(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [approvingWithdrawalTx]);

  const openWithdrawalApprovalModal = (tx: QueueTransaction) => {
    setApprovingWithdrawalTx(tx);
    setApprovalProofUrl('');
    setApprovalProofName('');
    setApprovalProofError(null);
    setPublishImmediately(false);
  };

  const handleApprovalProofFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validation = validateProductImageFile(file);
    if (!validation.valid) {
      setApprovalProofError(validation.error ?? 'File bukti transfer tidak valid.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setApprovalProofUrl(reader.result);
        setApprovalProofName(file.name);
        setApprovalProofError(null);
      }
    };
    reader.onerror = () => {
      setApprovalProofError('Gagal membaca file gambar dari galeri. Coba file lain.');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmWithdrawalApproval = () => {
    if (!approvingWithdrawalTx) return;
    onApproveWithdrawalWithProof(approvingWithdrawalTx.id, {
      proofUrl: approvalProofUrl,
      proofFileName: approvalProofName,
      publishImmediately,
    });
    setApprovingWithdrawalTx(null);
  };

  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'semua' && tx.type !== typeFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.userName.toLowerCase().includes(q) ||
      tx.channel.toLowerCase().includes(q)
    );
  });

  const hasProcessed = transactions.some((tx) => tx.status !== 'menunggu');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Antrean Persetujuan
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Verifikasi permintaan Top Up dan Withdrawal yang masih berstatus menunggu.
          </p>
        </div>
        {hasProcessed && (
          <Button variant="outline" size="sm" onClick={onResetQueue}>
            Pulihkan Antrean Awal
          </Button>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Top Up Menunggu
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono-num text-2xl font-bold text-amber-700 dark:text-amber-400">
                {formatNumber(operational.pendingTopUpCount)}
              </span>
              <span className="font-mono-num text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatRupiah(operational.pendingTopUpAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Withdrawal Menunggu
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono-num text-2xl font-bold text-amber-700 dark:text-amber-400">
                {formatNumber(operational.pendingWithdrawalCount)}
              </span>
              <span className="font-mono-num text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatRupiah(operational.pendingWithdrawalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              role="group"
              aria-label="Filter tipe transaksi antrean"
            >
              {(
                [
                  { id: 'semua', label: 'Semua' },
                  { id: 'topup', label: 'Top Up' },
                  { id: 'withdrawal', label: 'Withdrawal' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  aria-pressed={typeFilter === tab.id}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    typeFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari ID, nama user, atau bank..."
                aria-label="Cari transaksi antrean"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Tidak ada transaksi yang cocok
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ubah kata kunci pencarian atau pilih tipe transaksi lainnya.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery('');
                  setTypeFilter('semua');
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kanal / Tujuan</TableHead>
                  <TableHead>Waktu Pengajuan</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono-num text-xs font-medium text-slate-900 dark:text-slate-100">
                      {tx.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {tx.userName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {tx.userEmail}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {tx.type === 'topup' ? (
                        <span className="text-emerald-700 dark:text-emerald-400">Top Up</span>
                      ) : (
                        <span className="text-rose-700 dark:text-rose-400">Withdrawal</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <BankLogoBadge bankOrChannelName={tx.channel} size="sm" />
                        <span>{tx.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      {tx.submittedAt}
                    </TableCell>
                    <TableCell className="text-right font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                      {formatRupiah(tx.amount)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {tx.status === 'menunggu' && (
                        <span className="text-amber-700 dark:text-amber-400">Menunggu</span>
                      )}
                      {tx.status === 'disetujui' && (
                        <span className="text-emerald-700 dark:text-emerald-400">Disetujui</span>
                      )}
                      {tx.status === 'ditolak' && (
                        <span className="text-rose-700 dark:text-rose-400">Ditolak</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.status === 'menunggu' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (tx.type === 'withdrawal') {
                                openWithdrawalApprovalModal(tx);
                              } else {
                                onProcessTransaction(tx.id, 'disetujui');
                              }
                            }}
                            aria-label={`Setujui ${tx.id}`}
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            <span>Setujui</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onProcessTransaction(tx.id, 'ditolak')}
                            aria-label={`Tolak ${tx.id}`}
                          >
                            <X className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                            <span>Tolak</span>
                          </Button>
                        </div>
                      ) : tx.type === 'withdrawal' && tx.status === 'disetujui' && onOpenWithdrawalPublication ? (
                        <button
                          type="button"
                          onClick={onOpenWithdrawalPublication}
                          className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline dark:text-purple-400 cursor-pointer"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Masuk Publikasi Withdrawal</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Selesai diproses
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {approvingWithdrawalTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-wd-title"
          onClick={() => setApprovingWithdrawalTx(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <div>
                  <h2
                    id="approve-wd-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    Setujui Withdrawal · {approvingWithdrawalTx.id}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Data otomatis masuk ke menu Publikasi Withdrawal setelah disetujui.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingWithdrawalTx(null)}
                aria-label="Tutup modal persetujuan withdrawal"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">User</p>
                  <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                    {approvingWithdrawalTx.userName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <BankLogoBadge bankOrChannelName={approvingWithdrawalTx.channel} size="sm" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {approvingWithdrawalTx.channel}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 dark:text-slate-400">Amount</p>
                  <p className="mt-0.5 font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatRupiah(approvingWithdrawalTx.amount)}
                  </p>
                  <p className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                    {approvingWithdrawalTx.submittedAt}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Upload Bukti Transfer (Opsional)
                  </p>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    JPG, PNG, WebP · Maks 5 MB
                  </span>
                </div>

                {approvalProofError && (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    {approvalProofError}
                  </p>
                )}

                <input
                  ref={approvalFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Upload bukti transfer withdrawal dari galeri"
                  onChange={handleApprovalProofFileChange}
                />

                {approvalProofUrl ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                    <img
                      src={approvalProofUrl}
                      alt={`Pratinjau bukti ${approvingWithdrawalTx.id}`}
                      className="max-h-48 w-full object-contain"
                    />
                    <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
                      <span className="truncate font-mono-num text-slate-600 dark:text-slate-300">
                        {approvalProofName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => approvalFileInputRef.current?.click()}
                        >
                          Ganti
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-rose-700 hover:bg-rose-50 dark:text-rose-400"
                          onClick={() => {
                            setApprovalProofUrl('');
                            setApprovalProofName('');
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => approvalFileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center transition-colors hover:border-slate-400 hover:bg-slate-100/70 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600 cursor-pointer"
                  >
                    <ImagePlus className="h-6 w-6 text-slate-400" aria-hidden="true" />
                    <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Pilih Foto Bukti dari Galeri
                    </span>
                    <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Boleh dikosongkan dan langsung disetujui tanpa bukti.
                    </span>
                  </button>
                )}
              </div>

              <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                />
                <span>Langsung tampilkan sebagai Published di menu Publikasi Withdrawal</span>
              </label>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setApprovingWithdrawalTx(null)}
                >
                  Batal
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={handleConfirmWithdrawalApproval}>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Setujui &amp; Simpan</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProdukViewProps {
  products: InvestmentProduct[];
  categories?: ProductCategory[];
  operational: DashboardSnapshot['operational'];
  onAddProduct: (created: InvestmentProduct) => void;
  onUpdateProduct: (updated: InvestmentProduct) => void;
  onDeleteProduct: (productId: string) => void;
}

export function ProdukView({
  products,
  categories,
  operational,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: ProdukViewProps) {
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');
  const [viewMode, setViewMode] = useState<'tabel' | 'grid'>('tabel');
  const [query, setQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<InvestmentProduct | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const nextProductId = getNextProductId(products);
  const newProductTemplate: InvestmentProduct = {
    id: nextProductId,
    name: '',
    category: '',
    imageUrl: '',
    minCapital: 1_000_000,
    tenorDays: 30,
    dailyReturnRate: 1.5,
    claimIncome: 15_000,
    commissionType: 'percent',
    commissionRate: 5,
    maxPerUser: 5,
    stockMode: 'limited',
    activeHolders: 100,
    totalCapitalIn: 0,
    allowedLevels: [...ALL_USER_LEVELS],
    status: 'aktif',
  };

  const filtered = products.filter((p) => {
    if (statusFilter !== 'semua' && p.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Katalog &amp; Produk Berjalan
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Pemantauan {formatNumber(operational.activeProductsCount)} produk aktif dari {formatNumber(operational.totalCatalogProducts)} produk di katalog.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Produk Berjalan
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(operational.runningProductsCount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Modal Masuk
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatRupiah(operational.runningProductsCapital)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Produk Aktif / Katalog
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(operational.activeProductsCount)}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / {formatNumber(operational.totalCatalogProducts)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="order-1 w-full sm:w-auto">
                <div
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
                  role="group"
                  aria-label="Filter status produk"
                >
                  {(['semua', 'aktif', 'nonaktif'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      aria-pressed={statusFilter === status}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium capitalize whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                        statusFilter === status
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsCreatingProduct(true)}
                className="order-3 ml-auto h-9 shrink-0 sm:order-2 sm:ml-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Tambah Produk</span>
              </Button>

              <div
                className="order-2 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950 sm:order-3"
                role="group"
                aria-label="Mode tampilan produk"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('tabel')}
                  aria-pressed={viewMode === 'tabel'}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    viewMode === 'tabel'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  <List className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Daftar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Kartu</span>
                </button>
              </div>
            </div>

            <div className="relative w-full shrink-0 md:w-56 lg:w-64 xl:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau kategori produk..."
                aria-label="Cari produk investasi"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Produk tidak ditemukan
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('semua');
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : viewMode === 'tabel' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3">Produk</TableHead>
                  <TableHead className="px-2 text-right">Harga Investasi</TableHead>
                  <TableHead className="px-2 text-right">Durasi</TableHead>
                  <TableHead className="px-2 text-right">Pendapatan / Klaim</TableHead>
                  <TableHead className="px-2 text-right">Komisi</TableHead>
                  <TableHead className="px-2 text-right">Batas/User</TableHead>
                  <TableHead className="px-2">VIP User</TableHead>
                  <TableHead className="px-2 text-right">Imbal Harian</TableHead>
                  <TableHead className="px-2 text-right">Stok</TableHead>
                  <TableHead className="px-2 text-right">Modal Masuk</TableHead>
                  <TableHead className="px-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow
                    key={p.id}
                    onClick={() => setEditingProduct(p)}
                    className="cursor-pointer"
                  >
                    <TableCell className="px-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(p);
                        }}
                        aria-label={`Kelola produk ${p.name}`}
                        className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40 rounded-lg"
                      >
                        <div className="h-11 w-[54px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                          <ProductThumbnail product={p} className="h-full w-full" />
                        </div>
                        <div className="min-w-0 max-w-[164px]">
                          <p className="font-medium leading-snug text-slate-900 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400">
                            {p.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono-num">{p.id}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{p.category}</span>
                          </p>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono-num text-xs whitespace-nowrap">
                      {formatRupiah(p.minCapital)}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono-num text-xs whitespace-nowrap">
                      {p.tenorDays} hari
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono-num text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {formatRupiah(p.claimIncome)}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono-num text-xs whitespace-nowrap">
                      {formatProductCommission(p.commissionRate, p.commissionType)}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono-num text-xs whitespace-nowrap">
                      {formatNumber(p.maxPerUser)} unit
                    </TableCell>
                    <TableCell className="px-2 text-xs whitespace-nowrap">
                      <span
                        className={cn(
                          'font-medium',
                          p.allowedLevels.length < ALL_USER_LEVELS.length
                            ? 'text-purple-700 dark:text-purple-400'
                            : 'text-slate-600 dark:text-slate-300'
                        )}
                      >
                        {formatAllowedLevelsLabel(p.allowedLevels)}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono-num text-xs whitespace-nowrap">
                      {p.dailyReturnRate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono-num text-xs font-medium whitespace-nowrap">
                      {p.stockMode === 'unlimited' ? (
                        <span
                          className="inline-flex items-center justify-end gap-1 text-purple-700 dark:text-purple-400"
                          title="Unlimited stock"
                        >
                          <InfinityIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Unlimited</span>
                        </span>
                      ) : (
                        formatNumber(p.activeHolders)
                      )}
                    </TableCell>
                    <TableCell className="px-2 text-right font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatRupiah(p.totalCapitalIn)}
                    </TableCell>
                    <TableCell className="px-3 text-xs font-medium whitespace-nowrap">
                      {p.status === 'aktif' ? (
                        <span className="text-emerald-700 dark:text-emerald-400">Aktif</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Nonaktif</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
              {filtered.map((p) => (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => setEditingProduct(p)}
                    aria-label={`Kelola produk ${p.name}`}
                    className="flex h-full w-full flex-col text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden border-b border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                      <ProductThumbnail product={p} className="h-full w-full" />
                    </div>
                    <div className="flex flex-1 w-full flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            <span className="font-mono-num">{p.id}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{p.category}</span>
                          </span>
                          <span
                            className={cn(
                              'font-medium',
                              p.status === 'aktif'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-500 dark:text-slate-400'
                            )}
                          >
                            {p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <h3 className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </h3>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Modal Masuk</p>
                          <p className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                            {formatRupiah(p.totalCapitalIn)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 dark:text-slate-400">Stok</p>
                          <p className="mt-0.5 font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                            {p.stockMode === 'unlimited' ? (
                              <span className="inline-flex items-center justify-end gap-1 text-purple-700 dark:text-purple-400">
                                <InfinityIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Unlimited</span>
                              </span>
                            ) : (
                              formatNumber(p.activeHolders)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Harga Investasi · Durasi</p>
                          <p className="mt-0.5 font-mono-num text-slate-700 dark:text-slate-300">
                            {formatRupiah(p.minCapital)} · {p.tenorDays} hr
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 dark:text-slate-400">Pendapatan / Klaim</p>
                          <p className="mt-0.5 font-mono-num font-medium text-emerald-700 dark:text-emerald-400">
                            {formatRupiah(p.claimIncome)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Komisi · Imbal</p>
                          <p className="mt-0.5 font-mono-num text-slate-700 dark:text-slate-300">
                            {formatProductCommission(p.commissionRate, p.commissionType)} · {p.dailyReturnRate.toFixed(2)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 dark:text-slate-400">Batas/User</p>
                          <p className="mt-0.5 font-mono-num text-slate-700 dark:text-slate-300">
                            {formatNumber(p.maxPerUser)} unit
                          </p>
                        </div>
                        <div className="col-span-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">VIP Pembeli</span>
                          <span
                            className={cn(
                              'font-medium',
                              p.allowedLevels.length < ALL_USER_LEVELS.length
                                ? 'text-purple-700 dark:text-purple-400'
                                : 'text-slate-700 dark:text-slate-200'
                            )}
                          >
                            {formatAllowedLevelsLabel(p.allowedLevels)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingProduct && (
        <ProductEditModal
          mode="edit"
          product={editingProduct}
          imageSrc={resolveProductImage(editingProduct)}
          categories={categories}
          onSave={(updated) => {
            onUpdateProduct(updated);
            setEditingProduct(null);
          }}
          onDelete={(id) => {
            onDeleteProduct(id);
            setEditingProduct(null);
          }}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {isCreatingProduct && (
        <ProductEditModal
          mode="create"
          product={newProductTemplate}
          imageSrc={resolveProductImage(newProductTemplate)}
          categories={categories}
          onSave={(created) => {
            onAddProduct(created);
            setIsCreatingProduct(false);
          }}
          onDelete={() => setIsCreatingProduct(false)}
          onClose={() => setIsCreatingProduct(false)}
        />
      )}
    </div>
  );
}

interface DataUserViewProps {
  users: AdminUserRecord[];
  snapshot: DashboardSnapshot;
  onSelectUser: (userId: string) => void;
  onAddUser: (input: CreateAdminUserInput) => string | null;
}

export function DataUserView({
  users,
  snapshot,
  onSelectUser,
  onAddUser,
}: DataUserViewProps) {
  const [segmentFilter, setSegmentFilter] = useState<UserSegmentFilter>('semua');
  const [query, setQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [depositInput, setDepositInput] = useState('0');
  const [invitedByInput, setInvitedByInput] = useState('');
  const [accountStatusInput, setAccountStatusInput] = useState<'aktif' | 'nonaktif'>('aktif');
  const [emailVerifiedInput, setEmailVerifiedInput] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const nonActiveSummary = getNonActiveUserSummary(snapshot.activeBreakdown);
  const filtered = filterAdminUsers(users, { segmentFilter, query });
  const nextUserSeq = getNextUserSequence(users);
  const previewReferralCode = deriveUserReferralCode({
    name: nameInput.trim() || 'MEMBER',
    userNumber: nextUserSeq.userNumber,
  });
  const previewReferralLink = buildReferralRegistrationLink(previewReferralCode);

  useEffect(() => {
    if (!createModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCreateModalOpen(false);
        setFormError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createModalOpen]);

  const openCreateModal = () => {
    setNameInput('');
    setEmailInput('');
    setPhoneInput('');
    setDepositInput('0');
    setInvitedByInput('');
    setAccountStatusInput('aktif');
    setEmailVerifiedInput(true);
    setFormError(null);
    setCreateModalOpen(true);
  };

  const handleSubmitCreateUser = (e: FormEvent) => {
    e.preventDefault();
    const trimmedDeposit = depositInput.trim();
    const parsedDeposit = trimmedDeposit === '' ? 0 : Number(trimmedDeposit);
    const err = onAddUser({
      name: nameInput,
      email: emailInput,
      phone: phoneInput,
      depositBalance: parsedDeposit,
      invitedBy: invitedByInput.trim() || null,
      accountStatus: accountStatusInput,
      emailVerified: emailVerifiedInput,
    });
    if (err) {
      setFormError(err);
      return;
    }
    setCreateModalOpen(false);
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Segmentasi User Platform
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Total {formatNumber(snapshot.totalUsers)} user terdaftar (+{formatNumber(snapshot.newUsers30d)} user baru dalam 30 hari).
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          className="shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>User Baru</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              User Aktif (Inti)
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-purple-700 dark:text-purple-400">
              {formatNumber(snapshot.activeBreakdown.coreTotal)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Memenuhi minimal 1 syarat inti
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Nonaktif
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-rose-700 dark:text-rose-400">
              {formatNumber(nonActiveSummary.totalNonActive)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatNumber(nonActiveSummary.passiveCount)} pasif ·{' '}
              {formatNumber(nonActiveSummary.notStartedCount)} belum mulai
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pasif</p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatNumber(snapshot.activeBreakdown.passiveCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Pernah transaksi, kini berhenti
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Belum mulai</p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(snapshot.activeBreakdown.notStartedCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Belum pernah top up &amp; investasi
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              role="group"
              aria-label="Filter segmen user"
            >
              {(
                [
                  { id: 'semua', label: 'Semua' },
                  { id: 'aktif', label: 'Aktif' },
                  { id: 'nonaktif', label: 'Nonaktif' },
                  { id: 'pasif', label: 'Pasif' },
                  { id: 'belum_mulai', label: 'Belum mulai' },
                ] as const
              ).map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setSegmentFilter(seg.id)}
                  aria-pressed={segmentFilter === seg.id}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    segmentFilter === seg.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  {seg.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari ID, nama, atau no. telepon..."
                aria-label="Cari user"
                className="pl-9"
              />
            </div>
          </div>
          <CardDescription className="pt-2">
            Menampilkan sampel akun representatif per segmen aktif, nonaktif (pasif &amp; belum mulai), beserta alasan dan lama tidak aktif.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Data user tidak ditemukan
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery('');
                  setSegmentFilter('semua');
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3">ID User</TableHead>
                  <TableHead className="px-2">Nama &amp; Email</TableHead>
                  <TableHead className="px-2">No. Telepon</TableHead>
                  <TableHead className="px-2">Segmen</TableHead>
                  <TableHead className="px-2">Status / Info Nonaktif</TableHead>
                  <TableHead className="px-2 text-right">Saldo Deposit</TableHead>
                  <TableHead className="px-2 text-right">Saldo Bisa Ditarik</TableHead>
                  <TableHead className="px-2 text-right">Produk</TableHead>
                  <TableHead className="px-3">Aktivitas Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const [activityDate, activityDetail] = u.lastActivity.split(' · ');
                  return (
                    <TableRow
                      key={u.id}
                      onClick={() => onSelectUser(u.id)}
                      className="cursor-pointer"
                    >
                      <TableCell className="px-3 font-mono-num text-xs font-medium whitespace-nowrap">
                        {u.id}
                      </TableCell>
                      <TableCell className="px-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectUser(u.id);
                          }}
                          aria-label={`Lihat detail user ${u.name}`}
                          className="text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40 rounded"
                        >
                          <div className="font-medium text-slate-900 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400">
                            {u.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                        </button>
                      </TableCell>
                      <TableCell className="px-2 font-mono-num text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {u.phone}
                      </TableCell>
                      <TableCell className="px-2 text-xs font-medium whitespace-nowrap">
                        {u.segment === 'aktif' && (
                          <span className="text-purple-700 dark:text-purple-400">Aktif</span>
                        )}
                        {u.segment === 'pasif' && (
                          <span className="text-amber-700 dark:text-amber-400">Pasif</span>
                        )}
                        {u.segment === 'belum_mulai' && (
                          <span className="text-slate-500 dark:text-slate-400">Belum mulai</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 max-w-[170px]">
                        {u.accountStatus === 'aktif' ? (
                          <div>
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Aktif
                            </span>
                            <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                              {u.inactiveNote}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap">
                              Nonaktif ·{' '}
                              <span className="font-mono-num">{u.inactiveDays} hari</span>
                            </span>
                            <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                              {u.inactiveNote}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-2 text-right font-mono-num text-xs whitespace-nowrap">
                        {formatRupiah(u.depositBalance)}
                      </TableCell>
                      <TableCell className="px-2 text-right font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatRupiah(u.withdrawableBalance)}
                      </TableCell>
                      <TableCell className="px-2 text-right font-mono-num text-xs whitespace-nowrap">
                        {formatNumber(u.runningProducts)}
                      </TableCell>
                      <TableCell className="px-3">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {activityDate}
                        </div>
                        {activityDetail && (
                          <div className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                            {activityDetail}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Tambah User Baru (Khusus Admin) */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-modal-title"
          onClick={() => {
            setCreateModalOpen(false);
            setFormError(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <UserPlus
                  className="h-5 w-5 text-purple-600 dark:text-purple-400"
                  aria-hidden="true"
                />
                <div>
                  <h2
                    id="create-user-modal-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    Tambah User Baru (Khusus Admin)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ID {nextUserSeq.id} (#{nextUserSeq.userNumber}) beserta kode referal otomatis dibuat.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  setFormError(null);
                }}
                aria-label="Tutup modal tambah user baru"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreateUser} noValidate className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="admin-user-name"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Nama Lengkap
                </label>
                <Input
                  id="admin-user-name"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Contoh: Hendra Kusuma"
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="admin-user-email"
                    className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Email
                  </label>
                  <Input
                    id="admin-user-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="hendra@mail.id"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-user-phone"
                    className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Nomor WhatsApp / Telepon
                  </label>
                  <Input
                    id="admin-user-phone"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="0812-3456-7890"
                    className="mt-1.5 font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="admin-user-deposit"
                    className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Saldo Deposit Awal (Rp)
                  </label>
                  <Input
                    id="admin-user-deposit"
                    type="number"
                    min={0}
                    step={10000}
                    value={depositInput}
                    onChange={(e) => {
                      setDepositInput(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="mt-1.5 font-mono-num"
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-user-invited-by"
                    className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Diundang Oleh (Opsional)
                  </label>
                  <Input
                    id="admin-user-invited-by"
                    value={invitedByInput}
                    onChange={(e) => setInvitedByInput(e.target.value)}
                    placeholder="Contoh: #2298 rizky"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                <div>
                  <label
                    htmlFor="admin-user-status"
                    className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Status Akun
                  </label>
                  <select
                    id="admin-user-status"
                    value={accountStatusInput}
                    onChange={(e) =>
                      setAccountStatusInput(e.target.value as 'aktif' | 'nonaktif')
                    }
                    className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>

                <label className="flex h-10 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailVerifiedInput}
                    onChange={(e) => setEmailVerifiedInput(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                  />
                  <span>Email terverifikasi</span>
                </label>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                <p className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Link2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  <span>Kode &amp; Link Referal Otomatis Member</span>
                </p>
                <p className="mt-1 font-mono-num text-slate-900 dark:text-slate-100">
                  Kode: <span className="font-bold text-purple-700 dark:text-purple-400">{previewReferralCode}</span>
                </p>
                <p className="mt-0.5 truncate font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                  {previewReferralLink}
                </p>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setFormError(null);
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Simpan User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
