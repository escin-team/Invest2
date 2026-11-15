'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  HandCoins,
  Link2,
  PackageCheck,
  Search,
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
  InvestmentProduct,
  ProductCommissionEntry,
} from '@/src/lib/dashboard-schema';
import {
  aggregateProductCommissionRecipients,
  calculateProductCommissionAmount,
  filterProductCommissionRecipients,
  getProductCommissionOverview,
  isProductCommissionActive,
  type ProductCommissionRecipientSummary,
} from '@/src/lib/product-commissions';
import { resolveProductImageSrc } from '@/src/lib/product-images';
import {
  cn,
  formatNumber,
  formatProductCommission,
  formatRupiah,
} from '@/src/lib/utils';

function ProductThumb({
  product,
  sizeClass = 'h-9 w-9',
}: {
  product: Pick<InvestmentProduct, 'id' | 'imageUrl' | 'name'> | null;
  sizeClass?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = product
    ? resolveProductImageSrc({ id: product.id, imageUrl: product.imageUrl })
    : '';
  const hasError = failedSrc === src;

  if (hasError || !src || !product) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500',
          sizeClass
        )}
        aria-hidden="true"
      >
        <PackageCheck className="h-4 w-4" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={product.name}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={cn(
        'shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700',
        sizeClass
      )}
    />
  );
}

interface ProductCommissionViewProps {
  entries: ProductCommissionEntry[];
  products: InvestmentProduct[];
  onSelectUser: (userId: string) => void;
}

type CommissionSubTab = 'penerima' | 'produk';

export function ProductCommissionView({
  entries,
  products,
  onSelectUser,
}: ProductCommissionViewProps) {
  const [activeTab, setActiveTab] = useState<CommissionSubTab>('penerima');
  const [query, setQuery] = useState('');
  const [productFilter, setProductFilter] = useState<string>('semua');
  const [detailRecipientKey, setDetailRecipientKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const recipients = aggregateProductCommissionRecipients(entries, products);
  const filteredRecipients = filterProductCommissionRecipients(recipients, {
    query,
    productId: productFilter,
  });
  const overview = getProductCommissionOverview(recipients, products);

  const detailRecipient: ProductCommissionRecipientSummary | null =
    detailRecipientKey
      ? (recipients.find((r) => r.recipientKey === detailRecipientKey) ?? null)
      : null;

  useEffect(() => {
    if (!detailRecipient) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailRecipientKey(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailRecipient]);

  const handleCopyReferralLink = (key: string, link: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const filteredCatalogProducts = products.filter((p) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Komisi Produk
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Informasi akun penerima komisi otomatis dari kode &amp; link referal pendaftaran member berdasarkan produk dengan komisi aktif.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Akun Penerima Komisi
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="kp-total-recipients"
            >
              {formatNumber(overview.totalRecipients)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Pemilik link referal pendaftaran aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Jumlah Komisi Masuk
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="kp-total-commissions"
            >
              {formatNumber(overview.totalCommissionsCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Transaksi produk dari link referal member
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Komisi Diterima
            </p>
            <p
              className="mt-2 font-mono-num text-xl font-bold text-emerald-700 dark:text-emerald-400"
              data-testid="kp-total-amount"
            >
              {formatRupiah(overview.totalCommissionPaid)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Akumulasi komisi yang disalurkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Produk Komisi Aktif
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-purple-700 dark:text-purple-400"
              data-testid="kp-active-products"
            >
              {formatNumber(overview.activeCommissionProductsCount)}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / {formatNumber(overview.totalCatalogProducts)}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Mengikuti status &amp; tarif di Produk Investasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card: Box Pencarian + Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <div
                className="inline-flex max-w-full flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
                role="tablist"
                aria-label="Tampilan komisi produk"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'penerima'}
                  onClick={() => setActiveTab('penerima')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    activeTab === 'penerima'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  Penerima Komisi
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'produk'}
                  onClick={() => setActiveTab('produk')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    activeTab === 'produk'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  Produk Komisi Aktif ({formatNumber(overview.activeCommissionProductsCount)})
                </button>
              </div>

              {activeTab === 'penerima' && (
                <select
                  aria-label="Filter berdasarkan produk investasi"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="h-9 max-w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="semua">Semua Produk</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.id} · {product.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Box Pencarian */}
            <div className="relative w-full lg:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, kode referal, atau produk..."
                aria-label="Box Pencarian Komisi Produk"
                className="pl-9"
              />
            </div>
          </div>
          <CardDescription className="pt-2">
            {activeTab === 'penerima'
              ? `Menampilkan ${formatNumber(filteredRecipients.length)} dari ${formatNumber(
                  recipients.length
                )} akun penerima komisi link referal.`
              : `Daftar ${formatNumber(
                  filteredCatalogProducts.length
                )} produk dari katalog beserta tarif komisi yang berlaku saat pendaftar referal bertransaksi.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {activeTab === 'penerima' ? (
            filteredRecipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Data penerima komisi tidak ditemukan
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Ubah kata kunci di box pencarian atau pilih produk lainnya.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setQuery('');
                    setProductFilter('semua');
                  }}
                >
                  Reset Pencarian
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">Penerima Komisi</TableHead>
                    <TableHead className="px-3 text-right">Jumlah Komisi</TableHead>
                    <TableHead className="px-3 text-right">Total Diterima</TableHead>
                    <TableHead className="px-3">Komisi Terakhir</TableHead>
                    <TableHead className="px-4 text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.map((rec) => {
                    const latest = rec.latestCommission;
                    return (
                      <TableRow
                        key={rec.recipientKey}
                        data-testid={`komisi-row-${rec.recipientUserNumber}`}
                      >
                        <TableCell className="px-4 py-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {rec.recipientUserId ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectUser(rec.recipientUserId!)}
                                  className="text-left text-sm font-semibold text-slate-900 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400 cursor-pointer"
                                >
                                  {rec.recipientName}
                                </button>
                              ) : (
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {rec.recipientName}
                                </span>
                              )}
                              <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                                #{rec.recipientUserNumber}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              <span>{rec.recipientEmail}</span>
                              <span aria-hidden="true"> · </span>
                              <span className="font-mono-num">{rec.recipientPhone}</span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              Kode Referal:{' '}
                              <span className="font-mono-num font-semibold text-purple-700 dark:text-purple-400">
                                {rec.referralCode}
                              </span>
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="px-3 py-3 text-right whitespace-nowrap">
                          <span className="font-mono-num text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(rec.commissionCount)}
                          </span>
                          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                            komisi
                          </span>
                        </TableCell>

                        <TableCell className="px-3 py-3 text-right font-mono-num text-sm font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          {formatRupiah(rec.totalReceived)}
                        </TableCell>

                        <TableCell className="px-3 py-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {formatRupiah(latest.commissionAmount)}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {latest.productName}
                              </span>
                              <span className="font-mono-num text-[11px] font-medium text-purple-700 dark:text-purple-400">
                                ({formatProductCommission(latest.commissionRate, latest.commissionType)})
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono-num">{latest.earnedAt}</span>
                              <span aria-hidden="true"> · </span>
                              <span>Dari {latest.referredUserName}</span>
                              <span aria-hidden="true"> · </span>
                              <span
                                className={
                                  latest.isProductCommissionCurrentlyActive
                                    ? 'font-medium text-emerald-700 dark:text-emerald-400'
                                    : 'font-medium text-slate-500 dark:text-slate-400'
                                }
                              >
                                {latest.isProductCommissionCurrentlyActive
                                  ? 'Komisi produk aktif'
                                  : 'Komisi produk nonaktif'}
                              </span>
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            aria-label={`Detail komisi ${rec.recipientName}`}
                            onClick={() => setDetailRecipientKey(rec.recipientKey)}
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Detail</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Produk</TableHead>
                  <TableHead className="px-3 text-right">Harga Produk</TableHead>
                  <TableHead className="px-3 text-right">Tarif Komisi</TableHead>
                  <TableHead className="px-3 text-right">Komisi / 1 Unit</TableHead>
                  <TableHead className="px-4">Status Komisi Produk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCatalogProducts.map((product) => {
                  const active = isProductCommissionActive(product);
                  const perUnitCommission = calculateProductCommissionAmount(product, 1);
                  return (
                    <TableRow key={product.id} data-testid={`komisi-product-${product.id}`}>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <ProductThumb product={product} sizeClass="h-9 w-11" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-mono-num">{product.id}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{product.category}</span>
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-mono-num text-xs font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatRupiah(product.minCapital)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-mono-num text-xs font-semibold text-purple-700 dark:text-purple-400 whitespace-nowrap">
                        {formatProductCommission(product.commissionRate, product.commissionType)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-mono-num text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {active ? formatRupiah(perUnitCommission) : 'Rp 0'}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {active ? (
                          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Komisi Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {product.status === 'nonaktif'
                              ? 'Produk Nonaktif'
                              : 'Komisi 0'}
                          </span>
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

      {/* Detail Komisi Modal */}
      {detailRecipient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="komisi-detail-title"
          onClick={() => setDetailRecipientKey(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <HandCoins
                  className="h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="komisi-detail-title"
                      className="truncate font-display text-base font-bold text-slate-900 dark:text-slate-100"
                    >
                      Detail Komisi Produk · {detailRecipient.recipientName}
                    </h2>
                    <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      #{detailRecipient.recipientUserNumber}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {detailRecipient.recipientEmail} ·{' '}
                    <span className="font-mono-num">{detailRecipient.recipientPhone}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailRecipientKey(null)}
                aria-label="Tutup modal detail komisi"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Referral Registration Link Card */}
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Link2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    <span>Link Referal Member ({detailRecipient.referralCode})</span>
                  </p>
                  <p className="mt-1 truncate font-mono-num text-xs text-slate-600 dark:text-slate-400">
                    {detailRecipient.referralLink}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopyReferralLink(
                      detailRecipient.recipientKey,
                      detailRecipient.referralLink
                    )
                  }
                  className="shrink-0"
                >
                  {copiedKey === detailRecipient.recipientKey ? (
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

              {/* 3 Summary Figures */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Jumlah Komisi</p>
                  <p className="mt-1 font-mono-num text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatNumber(detailRecipient.commissionCount)} kali
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Diterima</p>
                  <p className="mt-1 font-mono-num text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(detailRecipient.totalReceived)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Komisi Terakhir</p>
                  <p className="mt-1 font-mono-num text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatRupiah(detailRecipient.latestCommission.commissionAmount)}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {detailRecipient.latestCommission.earnedAt}
                  </p>
                </div>
              </div>

              {/* Commission History Table */}
              <div>
                <h3 className="mb-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Rincian Komisi per Pembelian Produk Referal
                </h3>
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
                      {detailRecipient.entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <ProductThumb
                                product={entry.matchedProduct}
                                sizeClass="h-8 w-10"
                              />
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <div>
                {detailRecipient.recipientUserId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const uid = detailRecipient.recipientUserId!;
                      setDetailRecipientKey(null);
                      onSelectUser(uid);
                    }}
                  >
                    <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Lihat Profil User</span>
                  </Button>
                )}
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setDetailRecipientKey(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
