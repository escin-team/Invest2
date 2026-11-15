'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  AlertCircle,
  Eye,
  Globe,
  GlobeLock,
  ImagePlus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { BankLogoBadge } from '@/src/components/BankLogoBadge';
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
import type { WithdrawalPublication } from '@/src/lib/dashboard-schema';
import {
  filterWithdrawalPublications,
  getWithdrawalPublicationSummary,
  type WithdrawalPublicationFilter,
} from '@/src/lib/withdrawal-publications';
import { cn, formatNumber, formatRupiah, validateProductImageFile } from '@/src/lib/utils';

interface WithdrawalPublicationViewProps {
  records: WithdrawalPublication[];
  onUploadProof: (withdrawalId: string, proofUrl: string, proofFileName: string) => void;
  onClearProof: (withdrawalId: string) => void;
  onTogglePublication: (withdrawalId: string) => string | null;
  onSelectUser?: (userId: string) => void;
}

export function WithdrawalPublicationView({
  records,
  onUploadProof,
  onClearProof,
  onTogglePublication,
  onSelectUser,
}: WithdrawalPublicationViewProps) {
  const [filter, setFilter] = useState<WithdrawalPublicationFilter>('semua');
  const [query, setQuery] = useState('');
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [modalUploadError, setModalUploadError] = useState<string | null>(null);

  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const pendingInlineUploadIdRef = useRef<string | null>(null);

  const summary = getWithdrawalPublicationSummary(records);
  const filtered = filterWithdrawalPublications(records, { filter, query });
  const activeRecord = activeRecordId
    ? (records.find((item) => item.id === activeRecordId) ?? null)
    : null;

  useEffect(() => {
    if (!activeRecord) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveRecordId(null);
        setModalUploadError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRecord]);

  const handleFileRead = (
    withdrawalId: string,
    file: File,
    onError: (msg: string | null) => void
  ) => {
    const validation = validateProductImageFile(file);
    if (!validation.valid) {
      onError(validation.error ?? 'File gambar bukti transfer tidak valid.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadProof(withdrawalId, reader.result, file.name);
        onError(null);
        setFeedbackError(null);
      }
    };
    reader.onerror = () => {
      onError('Gagal membaca file gambar dari galeri. Coba pilih file lain.');
    };
    reader.readAsDataURL(file);
  };

  const handleModalFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeRecord) return;
    handleFileRead(activeRecord.id, file, setModalUploadError);
  };

  const handleInlineFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const targetId = pendingInlineUploadIdRef.current;
    pendingInlineUploadIdRef.current = null;
    if (!file || !targetId) return;
    handleFileRead(targetId, file, setFeedbackError);
  };

  const handleTriggerInlineUpload = (withdrawalId: string) => {
    pendingInlineUploadIdRef.current = withdrawalId;
    inlineFileInputRef.current?.click();
  };

  const handlePublicationClick = (item: WithdrawalPublication) => {
    const err = onTogglePublication(item.id);
    if (err) {
      setFeedbackError(err);
      setModalUploadError(err);
      setActiveRecordId(item.id);
    } else {
      setFeedbackError(null);
      setModalUploadError(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Publikasi Withdrawal
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Kelola bukti transfer withdrawal yang telah diproses dan atur status publikasinya untuk user.
        </p>
      </div>

      {/* Hidden inline file picker for fast 1-click Proof upload */}
      <input
        ref={inlineFileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Upload bukti transfer dari galeri"
        onChange={handleInlineFileChange}
      />

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Withdrawal
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(summary.totalCount)}
            </p>
            <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
              {formatRupiah(summary.totalAmount)} total pencairan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Sudah Dipublikasikan
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatNumber(summary.publishedCount)}
            </p>
            <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
              {formatRupiah(summary.publishedAmount)} tampil di halaman publik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Draft Publikasi
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatNumber(summary.draftCount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatNumber(summary.missingProofCount)} tanpa proof (opsional)
            </p>
          </CardContent>
        </Card>
      </div>

      {feedbackError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <span>{feedbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError(null)}
            aria-label="Tutup peringatan"
            className="rounded-md p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex flex-wrap items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
              role="group"
              aria-label="Filter status publikasi withdrawal"
            >
              {(
                [
                  { id: 'semua', label: 'Semua' },
                  { id: 'published', label: 'Dipublikasikan' },
                  { id: 'draft', label: 'Draft' },
                  { id: 'no_proof', label: 'Belum Ada Bukti' },
                ] as const
              ).map((tab) => (
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

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari ID, user, atau rekening..."
                aria-label="Cari data publikasi withdrawal"
                className="pl-9"
              />
            </div>
          </div>
          <CardDescription className="pt-2">
            Kolom tabel menampilkan Withdrawal, User, Amount, Withdrawal Date, Proof (opsional), dan status Publication.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Data withdrawal tidak ditemukan
              </p>
              <Button
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
                  <TableHead className="px-3">Withdrawal</TableHead>
                  <TableHead className="px-2">User</TableHead>
                  <TableHead className="px-2 text-right">Amount</TableHead>
                  <TableHead className="px-2">Withdrawal Date</TableHead>
                  <TableHead className="px-2">Proof</TableHead>
                  <TableHead className="px-3 text-right">Publication</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const isPublished = item.publicationStatus === 'published';
                  const hasProof = Boolean(item.proofUrl);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2.5">
                          <BankLogoBadge bankOrChannelName={item.bankChannel} size="sm" />
                          <div className="min-w-0">
                            <div className="font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {item.id}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {item.bankChannel}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-2">
                        {item.userId && onSelectUser ? (
                          <button
                            type="button"
                            onClick={() => onSelectUser(item.userId!)}
                            className="text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40 rounded"
                          >
                            <div className="font-medium text-slate-900 hover:text-purple-700 dark:text-slate-100 dark:hover:text-purple-400">
                              {item.userName}
                            </div>
                            <div className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                              #{item.userNumber} · {item.userEmail}
                            </div>
                          </button>
                        ) : (
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {item.userName}
                            </div>
                            <div className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                              #{item.userNumber} · {item.userEmail}
                            </div>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="px-2 text-right font-mono-num text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatRupiah(item.amount)}
                      </TableCell>

                      <TableCell className="px-2 font-mono-num text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.withdrawalDate}
                      </TableCell>

                      <TableCell className="px-2">
                        {hasProof ? (
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setModalUploadError(null);
                                setActiveRecordId(item.id);
                              }}
                              aria-label={`Lihat bukti transfer ${item.id}`}
                              className="group relative h-10 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 cursor-pointer dark:border-slate-800 dark:bg-slate-800"
                            >
                              <img
                                src={item.proofUrl}
                                alt={`Bukti ${item.id}`}
                                className="h-full w-full object-cover"
                              />
                            </button>
                            <div className="min-w-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs"
                                onClick={() => {
                                  setModalUploadError(null);
                                  setActiveRecordId(item.id);
                                }}
                              >
                                <Eye className="h-3 w-3" aria-hidden="true" />
                                <span>Lihat Bukti</span>
                              </Button>
                              <p className="mt-0.5 max-w-[140px] truncate font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                                {item.proofFileName}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs"
                              onClick={() => handleTriggerInlineUpload(item.id)}
                            >
                              <Upload className="h-3 w-3" aria-hidden="true" />
                              <span>Upload Proof</span>
                            </Button>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              Opsional · Tanpa bukti
                            </span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="px-3 text-right whitespace-nowrap">
                        <div className="inline-flex flex-col items-end gap-1">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                                isPublished
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                              )}
                            >
                              {isPublished ? (
                                <Globe className="h-3 w-3" aria-hidden="true" />
                              ) : (
                                <GlobeLock className="h-3 w-3" aria-hidden="true" />
                              )}
                              <span>{isPublished ? 'Published' : 'Draft'}</span>
                            </span>

                            <Button
                              type="button"
                              size="sm"
                              variant={isPublished ? 'outline' : 'primary'}
                              className="h-7 px-2.5 text-xs"
                              onClick={() => handlePublicationClick(item)}
                            >
                              {isPublished ? 'Tarik' : 'Publikasikan'}
                            </Button>
                          </div>
                          {isPublished && item.publishedAt && (
                            <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                              Terbit {item.publishedAt}
                            </span>
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

      {/* Proof Preview & Upload Modal */}
      {activeRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="proof-modal-title"
          onClick={() => {
            setActiveRecordId(null);
            setModalUploadError(null);
          }}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <BankLogoBadge bankOrChannelName={activeRecord.bankChannel} size="sm" />
                <div>
                  <h2
                    id="proof-modal-title"
                    className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                  >
                    Proof Withdrawal · {activeRecord.id}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeRecord.userName} · {activeRecord.bankChannel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveRecordId(null);
                  setModalUploadError(null);
                }}
                aria-label="Tutup modal bukti transfer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Amount</p>
                  <p className="mt-0.5 font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatRupiah(activeRecord.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 dark:text-slate-400">Withdrawal Date</p>
                  <p className="mt-0.5 font-mono-num text-xs font-medium text-slate-900 dark:text-slate-100">
                    {activeRecord.withdrawalDate}
                  </p>
                </div>
              </div>

              {modalUploadError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  {modalUploadError}
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                {activeRecord.proofUrl ? (
                  <img
                    src={activeRecord.proofUrl}
                    alt={`Bukti transfer ${activeRecord.id}`}
                    className="max-h-72 w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <ImagePlus className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      Belum ada foto bukti transfer (opsional)
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Publikasi tetap dapat dilakukan tanpa bukti, atau unggah dari galeri (JPG, PNG, WebP, maks 5 MB).
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={modalFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Pilih gambar bukti transfer dari galeri"
                onChange={handleModalFileChange}
              />

              <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => modalFileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{activeRecord.proofUrl ? 'Ganti Bukti' : 'Upload dari Galeri'}</span>
                  </Button>

                  {activeRecord.proofUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClearProof(activeRecord.id);
                        setModalUploadError(null);
                      }}
                      className="text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Hapus Bukti</span>
                    </Button>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={activeRecord.publicationStatus === 'published' ? 'outline' : 'primary'}
                  onClick={() => handlePublicationClick(activeRecord)}
                >
                  {activeRecord.publicationStatus === 'published' ? (
                    <>
                      <GlobeLock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Tarik Publikasi</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Publikasikan</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
