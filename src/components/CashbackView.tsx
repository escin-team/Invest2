'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  BadgePercent,
  Check,
  ChevronDown,
  PackageCheck,
  Pencil,
  Plus,
  Search,
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
import type {
  CashbackRule,
  CashbackTargetType,
  InvestmentProduct,
} from '@/src/lib/dashboard-schema';
import {
  filterCashbackRules,
  findProductForCashback,
  getCashbackProductOptions,
  getCashbackSummary,
  type CashbackInputPayload,
  type CashbackStatusFilter,
} from '@/src/lib/cashbacks';
import { resolveProductImageSrc } from '@/src/lib/product-images';
import { cn, formatNumber, formatRupiah } from '@/src/lib/utils';

function CashbackProductThumb({
  productId,
  imageUrl,
  alt,
  sizeClass = 'h-9 w-9',
}: {
  productId?: string | null;
  imageUrl: string;
  alt: string;
  sizeClass?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolveProductImageSrc({
    id: productId ?? '',
    imageUrl,
  });
  const hasError = failedSrc === src;

  if (hasError || !src) {
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
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={cn(
        'shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700',
        sizeClass
      )}
    />
  );
}

interface CashbackViewProps {
  cashbacks: CashbackRule[];
  products: InvestmentProduct[];
  onAddCashback: (input: CashbackInputPayload) => string | null;
  onUpdateCashback: (input: CashbackInputPayload & { id: string }) => string | null;
  onDeleteCashback: (cashbackId: string) => void;
}

export function CashbackView({
  cashbacks,
  products,
  onAddCashback,
  onUpdateCashback,
  onDeleteCashback,
}: CashbackViewProps) {
  const [statusFilter, setStatusFilter] = useState<CashbackStatusFilter>('semua');
  const [query, setQuery] = useState('');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingRule, setEditingRule] = useState<CashbackRule | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [targetTypeInput, setTargetTypeInput] =
    useState<CashbackTargetType>('produk_tertentu');
  const [targetProductInput, setTargetProductInput] = useState('');
  const [minTxInput, setMinTxInput] = useState('');
  const [cashbackAmountInput, setCashbackAmountInput] = useState('');
  const [statusInput, setStatusInput] = useState<'aktif' | 'nonaktif'>('aktif');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingRule, setDeletingRule] = useState<CashbackRule | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  const summary = getCashbackSummary(cashbacks);
  const filtered = filterCashbackRules(cashbacks, { statusFilter, query });

  const productOptions = getCashbackProductOptions(
    products,
    modalMode === 'edit' ? editingRule?.targetProduct : undefined
  );
  const selectedProductOption =
    productOptions.find(
      (opt) => opt.value.toLowerCase() === targetProductInput.trim().toLowerCase()
    ) ?? null;

  useEffect(() => {
    if (!productDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [productDropdownOpen]);

  useEffect(() => {
    if (!modalMode && !deletingRule) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (productDropdownOpen) {
          setProductDropdownOpen(false);
        } else if (deletingRule) {
          setDeletingRule(null);
        } else {
          setModalMode(null);
          setEditingRule(null);
          setFormError(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalMode, deletingRule, productDropdownOpen]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingRule(null);
    setNameInput('');
    setTargetTypeInput('produk_tertentu');
    setTargetProductInput('');
    setMinTxInput('');
    setCashbackAmountInput('');
    setStatusInput('aktif');
    setProductDropdownOpen(false);
    setFormError(null);
  };

  const openEditModal = (rule: CashbackRule) => {
    setModalMode('edit');
    setEditingRule(rule);
    setNameInput(rule.name);
    setTargetTypeInput(rule.targetType);
    setTargetProductInput(rule.targetProduct);
    setMinTxInput(String(rule.minTransaction));
    setCashbackAmountInput(String(rule.cashbackAmount));
    setStatusInput(rule.status);
    setProductDropdownOpen(false);
    setFormError(null);
  };

  const closeFormModal = () => {
    setModalMode(null);
    setEditingRule(null);
    setProductDropdownOpen(false);
    setFormError(null);
  };

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    const minTransaction =
      minTxInput.trim() === '' ? Number.NaN : Number(minTxInput);
    const cashbackAmount =
      cashbackAmountInput.trim() === ''
        ? Number.NaN
        : Number(cashbackAmountInput);

    const payload: CashbackInputPayload = {
      name: nameInput,
      targetType: targetTypeInput,
      targetProduct: targetProductInput,
      minTransaction,
      cashbackAmount,
      status: statusInput,
    };

    if (modalMode === 'create') {
      const err = onAddCashback(payload);
      if (err) {
        setFormError(err);
        return;
      }
      closeFormModal();
      return;
    }

    if (modalMode === 'edit' && editingRule) {
      const err = onUpdateCashback({ ...payload, id: editingRule.id });
      if (err) {
        setFormError(err);
        return;
      }
      closeFormModal();
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingRule) return;
    onDeleteCashback(deletingRule.id);
    setDeletingRule(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Cashback
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Kelola aturan promo cashback untuk pembelian produk investasi dan transaksi user.
          </p>
        </div>

        <Button type="button" variant="primary" size="sm" onClick={openCreateModal}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Cashback Baru</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Program Cashback
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="cb-total-count"
            >
              {formatNumber(summary.totalCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatNumber(summary.inactiveCount)} nonaktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Program Aktif
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-emerald-700 dark:text-emerald-400"
              data-testid="cb-active-count"
            >
              {formatNumber(summary.activeCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Berlaku untuk transaksi yang memenuhi syarat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cashback Aktif Tertinggi
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="cb-max-amount"
            >
              {formatRupiah(summary.maxCashbackAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Nilai promo tertinggi yang sedang berjalan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cashback Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              role="group"
              aria-label="Filter status cashback"
            >
              {(
                [
                  { id: 'semua', label: 'Semua' },
                  { id: 'aktif', label: 'Aktif' },
                  { id: 'nonaktif', label: 'Nonaktif' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  aria-pressed={statusFilter === tab.id}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                    statusFilter === tab.id
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
                placeholder="Cari nama cashback atau produk..."
                aria-label="Cari program cashback"
                className="pl-9"
              />
            </div>
          </div>
          <CardDescription className="pt-2">
            Menampilkan {formatNumber(filtered.length)} dari {formatNumber(cashbacks.length)} program cashback.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Program cashback tidak ditemukan
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ubah filter pencarian atau buat promo cashback baru.
              </p>
              <Button
                type="button"
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Nama</TableHead>
                  <TableHead className="px-3">Berlaku Untuk</TableHead>
                  <TableHead className="px-3 text-right">Minimum Transaksi</TableHead>
                  <TableHead className="px-3 text-right">Cashback</TableHead>
                  <TableHead className="px-3">Status</TableHead>
                  <TableHead className="px-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rule) => {
                  const matchedProduct = findProductForCashback(products, rule);
                  return (
                    <TableRow key={rule.id} data-testid={`cashback-row-${rule.id}`}>
                      <TableCell className="px-4 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {rule.name}
                      </TableCell>
                      <TableCell className="px-3 text-xs text-slate-700 dark:text-slate-300">
                        {matchedProduct ? (
                          <div className="flex items-center gap-2.5">
                            <CashbackProductThumb
                              productId={matchedProduct.id}
                              imageUrl={matchedProduct.imageUrl}
                              alt={matchedProduct.name}
                              sizeClass="h-9 w-9"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {rule.applicableLabel}
                              </p>
                              <p className="mt-0.5 font-mono-num text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                Harga produk: {formatRupiah(matchedProduct.minCapital)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="whitespace-nowrap">{rule.applicableLabel}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 text-right font-mono-num text-xs font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatRupiah(rule.minTransaction)}
                      </TableCell>
                      <TableCell className="px-3 text-right font-mono-num text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {formatRupiah(rule.cashbackAmount)}
                      </TableCell>
                      <TableCell className="px-3 whitespace-nowrap">
                        {rule.status === 'aktif' ? (
                          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Nonaktif
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            aria-label={`Edit cashback ${rule.name}`}
                            onClick={() => openEditModal(rule)}
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 border-rose-200 px-2.5 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            aria-label={`Hapus cashback ${rule.name}`}
                            onClick={() => setDeletingRule(rule)}
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            <span>Hapus</span>
                          </Button>
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

      {/* Create / Edit Cashback Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cashback-modal-title"
          onClick={closeFormModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <BadgePercent
                  className="h-5 w-5 text-purple-600 dark:text-purple-400"
                  aria-hidden="true"
                />
                <div>
                  <h2
                    id="cashback-modal-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    {modalMode === 'create'
                      ? 'Cashback Baru'
                      : `Edit Cashback · ${editingRule?.id}`}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tentukan syarat minimum transaksi dan nominal cashback.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                aria-label="Tutup modal cashback"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} noValidate className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="cashback-name-input"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Nama
                </label>
                <Input
                  id="cashback-name-input"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Contoh: Investment Growth"
                  className="mt-1.5"
                />
              </div>

              <div>
                <label
                  htmlFor="cashback-target-type"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Berlaku Untuk
                </label>
                <select
                  id="cashback-target-type"
                  value={targetTypeInput}
                  onChange={(e) => {
                    setTargetTypeInput(e.target.value as CashbackTargetType);
                    setProductDropdownOpen(false);
                    if (formError) setFormError(null);
                  }}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="produk_tertentu">Pembelian produk tertentu</option>
                  <option value="semua_produk">Semua produk investasi</option>
                  <option value="top_up">Top up saldo deposit</option>
                </select>
              </div>

              {targetTypeInput === 'produk_tertentu' && (
                <div ref={dropdownContainerRef}>
                  <label
                    id="cashback-target-product-label"
                    htmlFor="cashback-target-product"
                    className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Pilih Produk
                  </label>
                  <button
                    id="cashback-target-product"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={productDropdownOpen}
                    aria-labelledby="cashback-target-product-label cashback-target-product"
                    onClick={() => setProductDropdownOpen((prev) => !prev)}
                    className="mt-1.5 flex min-h-11 w-full items-center justify-between gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:border-slate-300 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 cursor-pointer"
                  >
                    {selectedProductOption ? (
                      <span className="flex min-w-0 flex-1 items-center gap-2.5">
                        <CashbackProductThumb
                          productId={selectedProductOption.productId}
                          imageUrl={selectedProductOption.imageUrl}
                          alt={selectedProductOption.value}
                          sizeClass="h-8 w-8"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {selectedProductOption.value}
                          </span>
                          <span className="block truncate font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                            {selectedProductOption.minCapital !== null
                              ? `${selectedProductOption.productId} · Harga ${formatRupiah(
                                  selectedProductOption.minCapital
                                )}`
                              : 'Produk tersimpan'}
                          </span>
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        {productOptions.length > 0
                          ? 'Pilih produk investasi'
                          : 'Belum ada produk di katalog'}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                        productDropdownOpen && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {productDropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="Daftar produk investasi"
                      className="mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-md dark:border-slate-800 dark:bg-slate-950"
                    >
                      {productOptions.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                          Belum ada produk di katalog.
                        </p>
                      ) : (
                        productOptions.map((opt) => {
                          const isSelected =
                            opt.value.toLowerCase() ===
                            targetProductInput.trim().toLowerCase();
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setTargetProductInput(opt.value);
                                setProductDropdownOpen(false);
                                if (formError) setFormError(null);
                              }}
                              className={cn(
                                'flex w-full items-center justify-between gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors cursor-pointer',
                                isSelected
                                  ? 'bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/70'
                              )}
                            >
                              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                                <CashbackProductThumb
                                  productId={opt.productId}
                                  imageUrl={opt.imageUrl}
                                  alt={opt.value}
                                  sizeClass="h-9 w-9"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                                      {opt.value}
                                    </span>
                                    {opt.status === 'nonaktif' && (
                                      <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                        Nonaktif
                                      </span>
                                    )}
                                  </span>
                                  <span className="mt-0.5 block truncate font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                                    {opt.minCapital !== null
                                      ? `${opt.productId} · Harga ${formatRupiah(opt.minCapital)}`
                                      : 'Produk tersimpan'}
                                  </span>
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                {opt.minCapital !== null && (
                                  <span className="font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    {formatRupiah(opt.minCapital)}
                                  </span>
                                )}
                                {isSelected && (
                                  <Check
                                    className="h-4 w-4 text-purple-600 dark:text-purple-400"
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="cashback-min-tx"
                    className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Minimum Transaksi (Rp)
                  </label>
                  <Input
                    id="cashback-min-tx"
                    type="number"
                    min={0}
                    step={10000}
                    value={minTxInput}
                    onChange={(e) => {
                      setMinTxInput(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="17600000"
                    className="mt-1.5 font-mono-num"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cashback-amount"
                    className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Cashback (Rp)
                  </label>
                  <Input
                    id="cashback-amount"
                    type="number"
                    min={1}
                    step={10000}
                    value={cashbackAmountInput}
                    onChange={(e) => {
                      setCashbackAmountInput(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="1600000"
                    className="mt-1.5 font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cashback-status-select"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Status
                </label>
                <select
                  id="cashback-status-select"
                  value={statusInput}
                  onChange={(e) =>
                    setStatusInput(e.target.value as 'aktif' | 'nonaktif')
                  }
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
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
                  onClick={closeFormModal}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Simpan Cashback
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-cashback-title"
          onClick={() => setDeletingRule(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2
                id="delete-cashback-title"
                className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Hapus Cashback {deletingRule.name}?
              </h2>
              <button
                type="button"
                onClick={() => setDeletingRule(null)}
                aria-label="Tutup konfirmasi hapus cashback"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-sm">
              <p className="text-slate-600 dark:text-slate-300">
                Program cashback{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {deletingRule.name}
                </span>{' '}
                ({deletingRule.applicableLabel} ·{' '}
                <span className="font-mono-num font-semibold">
                  {formatRupiah(deletingRule.cashbackAmount)}
                </span>
                ) akan dihapus permanen dari daftar promo.
              </p>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingRule(null)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDelete}
                >
                  Ya, Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
