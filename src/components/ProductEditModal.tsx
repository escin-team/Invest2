'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Infinity as InfinityIcon, Power, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  InvestmentProductSchema,
  type InvestmentProduct,
  type ProductCategory,
} from '@/src/lib/dashboard-schema';
import {
  ALL_USER_LEVELS,
  formatAllowedLevelsLabel,
  normalizeAllowedLevels,
} from '@/src/lib/user-levels';
import {
  cn,
  formatNumber,
  formatProductCommission,
  formatRupiah,
  validateProductImageFile,
} from '@/src/lib/utils';

interface ProductEditModalProps {
  mode?: 'edit' | 'create';
  product: InvestmentProduct;
  imageSrc: string;
  categories?: ProductCategory[];
  onSave: (updated: InvestmentProduct) => void;
  onDelete: (productId: string) => void;
  onClose: () => void;
}

function parseNumberInput(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw);
}

export function ProductEditModal({
  mode = 'edit',
  product,
  imageSrc,
  categories,
  onSave,
  onDelete,
  onClose,
}: ProductEditModalProps) {
  const isCreate = mode === 'create';

  const activeCategoryNames = (categories ?? [])
    .filter((c) => c.status === 'aktif' || (!isCreate && c.name === product.category))
    .map((c) => c.name);
  const categoryOptions =
    !isCreate && product.category && !activeCategoryNames.includes(product.category)
      ? [product.category, ...activeCategoryNames]
      : activeCategoryNames;

  const [name, setName] = useState(isCreate ? '' : product.name);
  const [category, setCategory] = useState(
    isCreate ? (categoryOptions[0] ?? '') : product.category
  );
  const [minCapital, setMinCapital] = useState(isCreate ? '' : String(product.minCapital));
  const [tenorDays, setTenorDays] = useState(isCreate ? '' : String(product.tenorDays));
  const [dailyReturnRate, setDailyReturnRate] = useState(
    isCreate ? '' : String(product.dailyReturnRate)
  );
  const [claimIncome, setClaimIncome] = useState(isCreate ? '' : String(product.claimIncome));
  const [commissionType, setCommissionType] = useState<'percent' | 'idr'>(
    product.commissionType ?? 'percent'
  );
  const [commissionRate, setCommissionRate] = useState(
    isCreate ? '' : String(product.commissionRate)
  );
  const [maxPerUser, setMaxPerUser] = useState(isCreate ? '' : String(product.maxPerUser));
  const [stockMode, setStockMode] = useState<'limited' | 'unlimited'>(
    product.stockMode ?? 'limited'
  );
  const [activeHolders, setActiveHolders] = useState(isCreate ? '' : String(product.activeHolders));
  const [totalCapitalIn, setTotalCapitalIn] = useState(
    isCreate ? '0' : String(product.totalCapitalIn)
  );
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>(product.status);
  const [allowedLevels, setAllowedLevels] = useState<number[]>(() =>
    normalizeAllowedLevels(product.allowedLevels ?? ALL_USER_LEVELS)
  );
  const [imageUrl, setImageUrl] = useState(isCreate ? '' : product.imageUrl);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewSrc =
    !imageUrl ? '' : imageUrl === product.imageUrl && imageSrc ? imageSrc : imageUrl;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validateProductImageFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, imageUrl: validation.error }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setSelectedFileName(file.name);
        setImgError(false);
        setErrors((prev) => {
          if (!prev.imageUrl) return prev;
          const { imageUrl: _removed, ...rest } = prev;
          return rest;
        });
      }
    };
    reader.onerror = () => {
      setErrors((prev) => ({
        ...prev,
        imageUrl: 'Gagal membaca file gambar dari galeri. Silakan coba lagi.',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageUrl('');
    setSelectedFileName(null);
    setImgError(false);
    setErrors((prev) => {
      if (!prev.imageUrl) return prev;
      const { imageUrl: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const parsedCandidate = {
      id: product.id,
      imageUrl,
      name: name,
      category: category,
      minCapital: parseNumberInput(minCapital),
      tenorDays: parseNumberInput(tenorDays),
      dailyReturnRate: parseNumberInput(dailyReturnRate),
      claimIncome: parseNumberInput(claimIncome),
      commissionType,
      commissionRate: parseNumberInput(commissionRate),
      maxPerUser: parseNumberInput(maxPerUser),
      stockMode,
      activeHolders:
        stockMode === 'unlimited'
          ? Math.max(0, Math.trunc(Number(activeHolders) || 0))
          : parseNumberInput(activeHolders),
      totalCapitalIn: parseNumberInput(totalCapitalIn),
      allowedLevels,
      status,
    };

    const result = InvestmentProductSchema.safeParse(parsedCandidate);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!nextErrors[key]) {
          nextErrors[key] =
            issue.code === 'invalid_type'
              ? 'Wajib diisi dengan angka yang valid'
              : issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSave(result.data);
  };

  const handleCommissionTypeChange = (nextType: 'percent' | 'idr') => {
    if (nextType === commissionType) return;
    const capital = Number(minCapital);
    const current = Number(commissionRate);
    if (Number.isFinite(capital) && capital > 0 && Number.isFinite(current) && current > 0) {
      if (nextType === 'idr') {
        setCommissionRate(String(Math.round((current / 100) * capital)));
      } else {
        setCommissionRate(String(Number(((current / capital) * 100).toFixed(2))));
      }
    }
    setCommissionType(nextType);
    setErrors((prev) => {
      if (!prev.commissionRate) return prev;
      const { commissionRate: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleToggleStatus = () => {
    const nextStatus: 'aktif' | 'nonaktif' = status === 'aktif' ? 'nonaktif' : 'aktif';
    const candidate = {
      id: product.id,
      imageUrl,
      name,
      category,
      minCapital: Number(minCapital),
      tenorDays: Number(tenorDays),
      dailyReturnRate: Number(dailyReturnRate),
      claimIncome: Number(claimIncome),
      commissionType,
      commissionRate: Number(commissionRate),
      maxPerUser: Number(maxPerUser),
      stockMode,
      activeHolders:
        stockMode === 'unlimited'
          ? Math.max(0, Math.trunc(Number(activeHolders) || 0))
          : Number(activeHolders),
      totalCapitalIn: Number(totalCapitalIn),
      allowedLevels,
      status: nextStatus,
    };

    const result = InvestmentProductSchema.safeParse(candidate);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSave(result.data);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono-num text-xs font-medium text-slate-500 dark:text-slate-400">
              {product.id} · {isCreate ? 'Tambah Produk Baru' : 'Kelola Produk Investasi'}
            </p>
            <h2
              id="product-modal-title"
              className="mt-0.5 truncate font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              {isCreate ? 'Tambah Produk Investasi' : product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal (Cancel)"
            title="Cancel / Tutup"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Form (Body + Footer) */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Visual Product Banner */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-start">
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-40">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                  {imgError || !previewSrc ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-700/40 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <ImagePlus className="h-6 w-6" aria-hidden="true" />
                      <span className="text-[11px] font-medium">Pilih Foto Produk</span>
                    </button>
                  ) : (
                    <img
                      src={previewSrc}
                      alt={name || product.name || 'Foto produk'}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  aria-label="Pilih foto produk dari galeri"
                  className="sr-only"
                />

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 flex-1 justify-center gap-1.5 px-2.5 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{previewSrc ? 'Ganti Foto' : 'Upload Galeri'}</span>
                  </Button>
                  {previewSrc && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearImage}
                      aria-label="Hapus foto produk"
                      title="Hapus foto"
                      className="h-8 w-8 shrink-0 px-0 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>

                {selectedFileName && !errors.imageUrl && (
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedFileName}
                  </p>
                )}
                {errors.imageUrl && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    {errors.imageUrl}
                  </p>
                )}
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Modal Masuk Saat Ini</p>
                  <p className="mt-0.5 font-mono-num text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatRupiah(Number(totalCapitalIn) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Pendapatan / Klaim</p>
                  <p className="mt-0.5 font-mono-num text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(Number(claimIncome) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Durasi · Komisi</p>
                  <p className="mt-0.5 font-mono-num text-sm font-medium text-slate-700 dark:text-slate-200">
                    {Number(tenorDays) || 0} hari ·{' '}
                    {formatProductCommission(Number(commissionRate) || 0, commissionType)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Batas/User · Status</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span className="font-mono-num">{formatNumber(Number(maxPerUser) || 0)} unit</span>
                    {' · '}
                    <span
                      className={cn(
                        status === 'aktif'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </p>
                </div>
                <div className="col-span-2 border-t border-slate-200/70 pt-2 dark:border-slate-800/80">
                  <p className="text-slate-500 dark:text-slate-400">Akses VIP Pembeli</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatAllowedLevelsLabel(allowedLevels)}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="prod-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Nama Produk
                </label>
                <Input
                  id="prod-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-category"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Kategori
                </label>
                {categoryOptions.length > 0 ? (
                  <select
                    id="prod-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="" disabled>
                      Pilih kategori produk
                    </option>
                    {categoryOptions.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="prod-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5"
                  />
                )}
                {errors.category && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.category}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-status"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Status Produk
                </label>
                <select
                  id="prod-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'aktif' | 'nonaktif')}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="prod-min-capital"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Harga Investasi (Rp)
                </label>
                <Input
                  id="prod-min-capital"
                  type="number"
                  step="any"
                  value={minCapital}
                  onChange={(e) => setMinCapital(e.target.value)}
                  className="mt-1.5 font-mono-num"
                />
                {errors.minCapital && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.minCapital}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-tenor"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Durasi (Hari)
                </label>
                <Input
                  id="prod-tenor"
                  type="number"
                  step="1"
                  value={tenorDays}
                  onChange={(e) => setTenorDays(e.target.value)}
                  className="mt-1.5 font-mono-num"
                />
                {errors.tenorDays && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.tenorDays}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-claim-income"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Pendapatan / Klaim (Rp)
                </label>
                <Input
                  id="prod-claim-income"
                  type="number"
                  step="any"
                  value={claimIncome}
                  onChange={(e) => setClaimIncome(e.target.value)}
                  className="mt-1.5 font-mono-num"
                />
                {errors.claimIncome && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.claimIncome}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="prod-commission"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Komisi ({commissionType === 'percent' ? '%' : 'IDR'})
                  </label>
                  <div
                    role="group"
                    aria-label="Slicing tipe input komisi"
                    className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <button
                      type="button"
                      onClick={() => handleCommissionTypeChange('percent')}
                      aria-pressed={commissionType === 'percent'}
                      className={cn(
                        'rounded px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer',
                        commissionType === 'percent'
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      )}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCommissionTypeChange('idr')}
                      aria-pressed={commissionType === 'idr'}
                      className={cn(
                        'rounded px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer',
                        commissionType === 'idr'
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      )}
                    >
                      IDR
                    </button>
                  </div>
                </div>
                <div className="relative mt-1.5">
                  {commissionType === 'idr' && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-xs font-medium text-slate-500 dark:text-slate-400">
                      Rp
                    </span>
                  )}
                  <Input
                    id="prod-commission"
                    type="number"
                    step="any"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder={commissionType === 'percent' ? '5' : '50000'}
                    className={cn(
                      'font-mono-num',
                      commissionType === 'idr' ? 'pl-9' : 'pr-8'
                    )}
                  />
                  {commissionType === 'percent' && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono-num text-xs font-medium text-slate-500 dark:text-slate-400">
                      %
                    </span>
                  )}
                </div>
                {errors.commissionRate && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.commissionRate}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-max-per-user"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Batas/User (Unit)
                </label>
                <Input
                  id="prod-max-per-user"
                  type="number"
                  step="1"
                  value={maxPerUser}
                  onChange={(e) => setMaxPerUser(e.target.value)}
                  className="mt-1.5 font-mono-num"
                />
                {errors.maxPerUser && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.maxPerUser}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-daily-rate"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Imbal Harian (%)
                </label>
                <Input
                  id="prod-daily-rate"
                  type="number"
                  step="any"
                  value={dailyReturnRate}
                  onChange={(e) => setDailyReturnRate(e.target.value)}
                  className="mt-1.5 font-mono-num"
                />
                {errors.dailyReturnRate && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.dailyReturnRate}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="prod-holders"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Stok
                  </label>
                  <div
                    role="group"
                    aria-label="Slicing tipe stok"
                    className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setStockMode('limited');
                        setErrors((prev) => {
                          if (!prev.activeHolders) return prev;
                          const { activeHolders: _removed, ...rest } = prev;
                          return rest;
                        });
                      }}
                      aria-pressed={stockMode === 'limited'}
                      className={cn(
                        'rounded px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer',
                        stockMode === 'limited'
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      )}
                    >
                      Atur
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStockMode('unlimited');
                        setErrors((prev) => {
                          if (!prev.activeHolders) return prev;
                          const { activeHolders: _removed, ...rest } = prev;
                          return rest;
                        });
                      }}
                      aria-pressed={stockMode === 'unlimited'}
                      aria-label="Unlimited"
                      title="Unlimited stock"
                      className={cn(
                        'inline-flex items-center justify-center rounded px-2 py-0.5 transition-colors cursor-pointer',
                        stockMode === 'unlimited'
                          ? 'bg-white text-purple-700 shadow-xs dark:bg-slate-800 dark:text-purple-400'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      )}
                    >
                      <InfinityIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {stockMode === 'unlimited' ? (
                  <div className="mt-1.5 flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-purple-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-purple-400">
                    <InfinityIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Unlimited stock</span>
                  </div>
                ) : (
                  <Input
                    id="prod-holders"
                    type="number"
                    step="1"
                    value={activeHolders}
                    onChange={(e) => setActiveHolders(e.target.value)}
                    className="mt-1.5 font-mono-num"
                  />
                )}
                {errors.activeHolders && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.activeHolders}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-capital-in"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Total Modal Masuk (Rp)
                </label>
                <Input
                  id="prod-capital-in"
                  type="number"
                  step="any"
                  value={totalCapitalIn}
                  onChange={(e) => setTotalCapitalIn(e.target.value)}
                  className="mt-1.5 font-mono-num"
                />
                {errors.totalCapitalIn && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.totalCapitalIn}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      VIP User yang Diizinkan Membeli
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Aktif untuk: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatAllowedLevelsLabel(allowedLevels)}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAllowedLevels([...ALL_USER_LEVELS]);
                        setErrors((prev) => {
                          if (!prev.allowedLevels) return prev;
                          const { allowedLevels: _removed, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Semua VIP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAllowedLevels([2, 3, 4, 5, 6, 7, 8]);
                        setErrors((prev) => {
                          if (!prev.allowedLevels) return prev;
                          const { allowedLevels: _removed, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Min. VIP 2
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAllowedLevels([3, 4, 5, 6, 7, 8]);
                        setErrors((prev) => {
                          if (!prev.allowedLevels) return prev;
                          const { allowedLevels: _removed, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Min. VIP 3
                    </button>
                  </div>
                </div>

                <div
                  role="group"
                  aria-label="Pilih VIP user yang diizinkan membeli produk"
                  className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8"
                >
                  {ALL_USER_LEVELS.map((level) => {
                    const isSelected = allowedLevels.includes(level);
                    return (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setAllowedLevels((prev) =>
                            prev.includes(level)
                              ? prev.filter((item) => item !== level)
                              : normalizeAllowedLevels([...prev, level])
                          );
                          setErrors((prev) => {
                            if (!prev.allowedLevels) return prev;
                            const { allowedLevels: _removed, ...rest } = prev;
                            return rest;
                          });
                        }}
                        className={cn(
                          'flex h-10 items-center justify-center rounded-lg border font-mono-num text-xs font-semibold transition-colors cursor-pointer',
                          isSelected
                            ? 'border-purple-600 bg-purple-600 text-white dark:border-purple-500 dark:bg-purple-600'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                        )}
                      >
                        VIP {level}
                      </button>
                    );
                  })}
                </div>
                {errors.allowedLevels && (
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                    {errors.allowedLevels}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className={cn(
              'flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/60 sm:px-6',
              isCreate ? 'justify-end' : 'justify-between'
            )}
          >
            {confirmingDelete && !isCreate ? (
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
                  Hapus produk <span className="font-semibold">{product.name}</span>?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                  >
                    Ya, Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {!isCreate && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingDelete(true)}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Hapus</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleToggleStatus}
                      className={
                        status === 'aktif'
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900/60 dark:text-amber-400 dark:hover:bg-amber-950/40'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                      }
                    >
                      <Power className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{status === 'aktif' ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}</span>
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Save
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
