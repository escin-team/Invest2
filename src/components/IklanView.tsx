'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ImagePlus,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
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
import type { AdBannerRecord, AdBannerStatus } from '@/src/lib/dashboard-schema';
import {
  filterAdBanners,
  getActiveMemberLoginAds,
  type AdBannerInput,
  type AdStatusFilter,
} from '@/src/lib/iklan';
import { cn, formatNumber, validateProductImageFile } from '@/src/lib/utils';

interface IklanViewProps {
  ads: AdBannerRecord[];
  onAddAd: (input: AdBannerInput) => string | null;
  onUpdateAd: (adId: string, input: AdBannerInput) => string | null;
  onToggleAdStatus: (adId: string) => void;
  onDeleteAd: (adId: string) => void;
  onPreviewPopup: (targetAds: AdBannerRecord[]) => void;
}

const EMPTY_FORM: AdBannerInput = {
  title: '',
  imageUrl: '',
  imageFileName: '',
  showTime: '',
  status: 'Active',
  showOnMemberLogin: true,
};

export function IklanView({
  ads,
  onAddAd,
  onUpdateAd,
  onToggleAdStatus,
  onDeleteAd,
  onPreviewPopup,
}: IklanViewProps) {
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState<AdStatusFilter>('all');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<AdStatusFilter>('all');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingAd, setEditingAd] = useState<AdBannerRecord | null>(null);
  const [formState, setFormState] = useState<AdBannerInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [deletingAd, setDeletingAd] = useState<AdBannerRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredAds = filterAdBanners(ads, {
    query: appliedQuery,
    statusFilter: appliedStatus,
  });
  const activeLoginAds = getActiveMemberLoginAds(ads);
  const inactiveCount = ads.filter((item) => item.status === 'Inactive').length;

  useEffect(() => {
    if (!modalMode && !deletingAd) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deletingAd) {
          setDeletingAd(null);
        } else {
          setModalMode(null);
          setEditingAd(null);
          setFormError(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalMode, deletingAd]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingAd(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
  };

  const openEditModal = (ad: AdBannerRecord) => {
    setModalMode('edit');
    setEditingAd(ad);
    setFormState({
      title: ad.title,
      imageUrl: ad.imageUrl,
      imageFileName: ad.imageFileName,
      showTime: ad.showTime === '-' ? '' : ad.showTime,
      status: ad.status,
      showOnMemberLogin: ad.showOnMemberLogin,
    });
    setFormError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingAd(null);
    setFormError(null);
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validation = validateProductImageFile({
      type: file.type,
      size: file.size,
    });
    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setFormError('Gagal membaca berkas gambar iklan yang dipilih.');
        return;
      }
      setFormState((prev) => ({
        ...prev,
        imageUrl: reader.result as string,
        imageFileName: file.name,
      }));
      setFormError(null);
    };
    reader.onerror = () => {
      setFormError('Terjadi kesalahan saat membaca file gambar dari galeri.');
    };
    reader.readAsDataURL(file);
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

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modalMode === 'create') {
      const err = onAddAd(formState);
      if (err) {
        setFormError(err);
        return;
      }
      setFeedbackMessage(`Iklan "${formState.title.trim()}" berhasil ditambahkan.`);
      closeModal();
      return;
    }

    if (modalMode === 'edit' && editingAd) {
      const err = onUpdateAd(editingAd.id, formState);
      if (err) {
        setFormError(err);
        return;
      }
      setFeedbackMessage(`Iklan "${formState.title.trim()}" berhasil diperbarui.`);
      closeModal();
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingAd) return;
    onDeleteAd(deletingAd.id);
    setFeedbackMessage(`Iklan "${deletingAd.title}" telah dihapus.`);
    setDeletingAd(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Iklan
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Kelola banner iklan portrait yang muncul otomatis sebagai popup setiap kali member atau pengguna login (dapat ditutup tombol ×).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={activeLoginAds.length === 0}
            onClick={() => onPreviewPopup(activeLoginAds)}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>
              Pratinjau Popup Login ({formatNumber(activeLoginAds.length)})
            </span>
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>+ Add Iklan</span>
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Iklan
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(ads.length)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Banner portrait tersimpan di katalog konten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active (Popup Login Member)
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatNumber(activeLoginAds.length)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Muncul saat member login &amp; bisa ditutup klik ×
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Inactive
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(inactiveCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Disimpan sebagai arsip / tidak ditampilkan
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
            aria-label="Tutup notifikasi iklan"
            className="rounded-md p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Ads Table Card */}
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
                placeholder="Search title..."
                aria-label="Search title..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusInput}
                onChange={(e) => {
                  const next = e.target.value as AdStatusFilter;
                  setStatusInput(next);
                  setAppliedStatus(next);
                }}
                aria-label="Filter status iklan"
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <Button type="submit" variant="outline" size="sm" className="h-10 px-4">
                Filter
              </Button>
            </div>
          </form>
          <CardDescription className="pt-2">
            Menampilkan {formatNumber(filteredAds.length)} dari {formatNumber(ads.length)} iklan portrait.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filteredAds.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Megaphone className="h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada iklan yang cocok
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Tambahkan banner iklan portrait baru atau ubah kata kunci dan status filter di atas.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {(appliedQuery || appliedStatus !== 'all') && (
                  <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                    Reset Filter
                  </Button>
                )}
                <Button type="button" variant="primary" size="sm" onClick={openCreateModal}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>+ Add Iklan</span>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Image (Portrait)</TableHead>
                  <TableHead className="px-3">Title</TableHead>
                  <TableHead className="px-3">Show Time</TableHead>
                  <TableHead className="px-3">Status</TableHead>
                  <TableHead className="px-3">Created At</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((ad) => {
                  const isActive = ad.status === 'Active';
                  return (
                    <TableRow key={ad.id}>
                      <TableCell className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onPreviewPopup([ad])}
                          aria-label={`Pratinjau gambar portrait ${ad.title}`}
                          className="group relative block aspect-[3/4] w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-xs transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                        >
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      </TableCell>

                      <TableCell className="px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {ad.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {ad.showOnMemberLogin
                            ? 'Popup saat member login (close ×)'
                            : 'Tidak muncul otomatis saat login'}
                        </div>
                      </TableCell>

                      <TableCell className="px-3 font-mono-num text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {ad.showTime}
                      </TableCell>

                      <TableCell className="px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                              isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            )}
                          >
                            {ad.status}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            aria-label={`Ubah status iklan ${ad.title}`}
                            onClick={() => {
                              onToggleAdStatus(ad.id);
                              setFeedbackMessage(
                                `Status iklan "${ad.title}" diubah menjadi ${isActive ? 'Inactive' : 'Active'}.`
                              );
                            }}
                            className={cn(
                              'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40',
                              isActive
                                ? 'border-emerald-600 bg-emerald-600'
                                : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800'
                            )}
                          >
                            <span
                              className={cn(
                                'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform',
                                isActive ? 'translate-x-4' : 'translate-x-0.5'
                              )}
                            />
                          </button>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 font-mono-num text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {ad.createdAt}
                      </TableCell>

                      <TableCell className="px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onPreviewPopup([ad])}
                            aria-label={`Lihat popup iklan ${ad.title}`}
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Popup</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => openEditModal(ad)}
                            aria-label={`Edit iklan ${ad.title}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setDeletingAd(ad)}
                            aria-label={`Hapus iklan ${ad.title}`}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
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

      {/* Add / Edit Iklan Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="iklan-modal-title"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2
                  id="iklan-modal-title"
                  className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  {modalMode === 'create' ? 'Tambah Iklan Portrait' : 'Edit Iklan Portrait'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unggah gambar portrait yang muncul sebagai popup saat member atau pengguna login.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup modal form iklan"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-5" noValidate>
              {/* Image (Portrait) Upload */}
              <div className="space-y-2">
                <label
                  htmlFor="iklan-image-upload"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Image (Portrait)
                </label>

                <input
                  id="iklan-image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="sr-only"
                />

                {formState.imageUrl ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-center">
                    <div className="aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                      <img
                        src={formState.imageUrl}
                        alt={formState.title || 'Pratinjau gambar iklan portrait'}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {formState.imageFileName || 'gambar-iklan-portrait.jpg'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ditampilkan sebagai popup portrait ketika member/pengguna login dan dapat ditutup melalui tombol ×.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ganti Gambar</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              imageUrl: '',
                              imageFileName: '',
                            }))
                          }
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Hapus</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-7 text-center transition-colors hover:border-purple-500 hover:bg-slate-100/70 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-purple-500 cursor-pointer"
                  >
                    <ImagePlus className="h-7 w-7 text-slate-400" aria-hidden="true" />
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Upload Gambar Iklan (Portrait)</span>
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Disarankan rasio portrait 3:4 · JPG, PNG, WebP, atau GIF (maks. 5 MB)
                    </span>
                  </button>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label
                  htmlFor="iklan-title-input"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Title
                </label>
                <Input
                  id="iklan-title-input"
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Contoh: Bonus Reward Honda Beat"
                />
              </div>

              {/* Show Time + Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="iklan-showtime-input"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Show Time (Opsional)
                  </label>
                  <Input
                    id="iklan-showtime-input"
                    value={formState.showTime}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, showTime: e.target.value }))
                    }
                    placeholder="Kosongkan untuk '-'"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="iklan-status-select"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Status
                  </label>
                  <select
                    id="iklan-status-select"
                    value={formState.status}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        status: e.target.value as AdBannerStatus,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-800 cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">
                  Tampilkan popup otomatis saat member / pengguna login
                </span>
                <input
                  type="checkbox"
                  checked={formState.showOnMemberLogin}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      showOnMemberLogin: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                />
              </label>

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
                <Button type="button" variant="outline" size="sm" onClick={closeModal}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {modalMode === 'create' ? 'Simpan Iklan' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-iklan-title"
          onClick={() => setDeletingAd(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-iklan-title"
              className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Hapus Iklan
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus iklan{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {deletingAd.title}
              </span>
              ? Banner ini tidak lagi muncul saat member login.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingAd(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Hapus Iklan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
