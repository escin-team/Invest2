'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Eye,
  Gauge,
  Pause,
  Pencil,
  Play,
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
  AnnouncementRecord,
  AnnouncementStatus,
  MarqueeDurationSeconds,
} from '@/src/lib/dashboard-schema';
import {
  MARQUEE_SPEED_OPTIONS,
  buildMemberMarqueeText,
  filterAnnouncements,
  getActiveMemberMarqueeAnnouncements,
  getMarqueeDurationClassName,
  getMarqueeSpeedOption,
  type AnnouncementInput,
  type AnnouncementStatusFilter,
} from '@/src/lib/announcements';
import { cn, formatNumber } from '@/src/lib/utils';

interface PengumumanViewProps {
  announcements: AnnouncementRecord[];
  marqueeDurationSeconds: MarqueeDurationSeconds;
  onChangeMarqueeDuration: (durationSeconds: MarqueeDurationSeconds) => void;
  onAddAnnouncement: (input: AnnouncementInput) => string | null;
  onUpdateAnnouncement: (
    announcementId: string,
    input: AnnouncementInput
  ) => string | null;
  onToggleAnnouncementStatus: (announcementId: string) => void;
  onDeleteAnnouncement: (announcementId: string) => void;
}

const EMPTY_FORM: AnnouncementInput = {
  title: '',
  message: '',
  status: 'Active',
  showOnMemberMarquee: true,
};

export function PengumumanView({
  announcements,
  marqueeDurationSeconds,
  onChangeMarqueeDuration,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onToggleAnnouncementStatus,
  onDeleteAnnouncement,
}: PengumumanViewProps) {
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState<AnnouncementStatusFilter>('all');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<AnnouncementStatusFilter>('all');
  const [marqueePaused, setMarqueePaused] = useState(false);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<AnnouncementRecord | null>(null);
  const [viewingItem, setViewingItem] = useState<AnnouncementRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<AnnouncementRecord | null>(null);

  const [formState, setFormState] = useState<AnnouncementInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const filteredAnnouncements = filterAnnouncements(announcements, {
    query: appliedQuery,
    statusFilter: appliedStatus,
  });
  const activeMarqueeList = getActiveMemberMarqueeAnnouncements(announcements);
  const marqueeText = buildMemberMarqueeText(announcements);
  const currentSpeedOption = getMarqueeSpeedOption(marqueeDurationSeconds);
  const currentSpeedIndex = Math.max(
    0,
    MARQUEE_SPEED_OPTIONS.findIndex(
      (opt) => opt.durationSeconds === marqueeDurationSeconds
    )
  );
  const marqueeDurationClass = getMarqueeDurationClassName(marqueeDurationSeconds);
  const inactiveCount = announcements.filter(
    (item) => item.status === 'Inactive'
  ).length;

  useEffect(() => {
    if (!modalMode && !viewingItem && !deletingItem) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deletingItem) {
          setDeletingItem(null);
        } else if (viewingItem) {
          setViewingItem(null);
        } else {
          setModalMode(null);
          setEditingItem(null);
          setFormError(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalMode, viewingItem, deletingItem]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
  };

  const openEditModal = (item: AnnouncementRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormState({
      title: item.title,
      message: item.message,
      status: item.status,
      showOnMemberMarquee: item.showOnMemberMarquee,
    });
    setFormError(null);
  };

  const closeFormModal = () => {
    setModalMode(null);
    setEditingItem(null);
    setFormError(null);
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
      const error = onAddAnnouncement(formState);
      if (error) {
        setFormError(error);
        return;
      }
      setFeedbackMessage(
        `Pengumuman "${formState.title.trim()}" disiapkan untuk marquee dashboard member.`
      );
      closeFormModal();
      return;
    }

    if (modalMode === 'edit' && editingItem) {
      const error = onUpdateAnnouncement(editingItem.id, formState);
      if (error) {
        setFormError(error);
        return;
      }
      setFeedbackMessage(
        `Pengumuman "${formState.title.trim()}" berhasil diperbarui.`
      );
      closeFormModal();
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    onDeleteAnnouncement(deletingItem.id);
    setFeedbackMessage(`Pengumuman "${deletingItem.title}" telah dihapus.`);
    setDeletingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Siapkan pengumuman untuk notifikasi berjalan (marquee) di dashboard member (bukan dikirim via WhatsApp).
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
          <span>+ Buat Pengumuman</span>
        </Button>
      </div>

      {/* Member Dashboard Marquee Live Preview */}
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <BellRing className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                Pratinjau Notifikasi Marquee Dashboard Member
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target tampilan: running text notifikasi pada halaman member ({formatNumber(activeMarqueeList.length)} aktif).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
              <Gauge className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>
                {currentSpeedOption.label} ({currentSpeedOption.speedLabel} ·{' '}
                {currentSpeedOption.durationSeconds} dtk)
              </span>
            </span>
            {marqueeText && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMarqueePaused((prev) => !prev)}
              >
                {marqueePaused ? (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Putar Marquee</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Jeda Marquee</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {marqueeText ? (
            <div
              role="region"
              aria-label="Pratinjau marquee notifikasi dashboard member"
              className="flex items-center gap-3 overflow-hidden rounded-xl border border-purple-200/80 bg-purple-50/70 px-3 py-2.5 dark:border-purple-900/60 dark:bg-purple-950/30"
            >
              <span className="shrink-0 rounded-md bg-purple-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Info Member
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div
                  className={cn(
                    'animate-finvault-marquee items-center whitespace-nowrap text-xs font-medium text-slate-800 dark:text-slate-200',
                    marqueeDurationClass,
                    marqueePaused && 'marquee-paused'
                  )}
                >
                  <span className="pr-12">{marqueeText}</span>
                  <span aria-hidden="true" className="pr-12">
                    {marqueeText}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Belum ada pengumuman berstatus Active untuk ditampilkan di marquee dashboard member.
            </div>
          )}

          {/* Marquee Speed Controls */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/50 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kecepatan Marquee:
              </span>
              <div
                role="group"
                aria-label="Preset kecepatan marquee"
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
              >
                {MARQUEE_SPEED_OPTIONS.filter((opt) => opt.presetKey).map((opt) => {
                  const isSelected =
                    opt.durationSeconds === marqueeDurationSeconds;
                  return (
                    <button
                      key={opt.durationSeconds}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onChangeMarqueeDuration(opt.durationSeconds)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-1 items-center gap-3 lg:max-w-sm">
              <label
                htmlFor="marquee-speed-slider"
                className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400"
              >
                Lambat
              </label>
              <input
                id="marquee-speed-slider"
                type="range"
                min={0}
                max={MARQUEE_SPEED_OPTIONS.length - 1}
                step={1}
                value={currentSpeedIndex}
                aria-label="Atur kecepatan marquee notifikasi"
                aria-valuetext={`${currentSpeedOption.label} (${currentSpeedOption.durationSeconds} detik)`}
                onChange={(e) => {
                  const idx = Number.parseInt(e.target.value, 10);
                  const option = MARQUEE_SPEED_OPTIONS[idx];
                  if (option) {
                    onChangeMarqueeDuration(option.durationSeconds);
                  }
                }}
                className="h-1.5 w-full cursor-pointer accent-purple-600"
              />
              <span className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Cepat
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Pengumuman
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(announcements.length)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tersimpan di daftar pengumuman konten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aktif di Marquee Member
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatNumber(activeMarqueeList.length)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ditampilkan pada ticker dashboard member
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
              Tidak tampil di marquee dashboard member
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
            aria-label="Tutup notifikasi pengumuman"
            className="rounded-md p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Announcements Table */}
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
                placeholder="Cari judul atau pesan pengumuman..."
                aria-label="Cari judul atau pesan pengumuman"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusInput}
                onChange={(e) => {
                  const next = e.target.value as AnnouncementStatusFilter;
                  setStatusInput(next);
                  setAppliedStatus(next);
                }}
                aria-label="Filter status pengumuman"
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
            Menampilkan {formatNumber(filteredAnnouncements.length)} dari{' '}
            {formatNumber(announcements.length)} pengumuman marquee member.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filteredAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <BellRing
                className="h-8 w-8 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada pengumuman yang cocok
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Buat pengumuman baru untuk marquee dashboard member atau reset filter pencarian di atas.
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
                  <span>+ Buat Pengumuman</span>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-4">#</TableHead>
                  <TableHead className="min-w-[180px] px-3">Judul</TableHead>
                  <TableHead className="min-w-[360px] px-3">Pesan</TableHead>
                  <TableHead className="px-3 whitespace-nowrap">Tanggal</TableHead>
                  <TableHead className="px-3 whitespace-nowrap">Status Marquee</TableHead>
                  <TableHead className="px-4 text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.map((item, idx) => {
                  const isActive = item.status === 'Active';
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-3.5 align-top font-mono-num text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {idx + 1}
                      </TableCell>

                      <TableCell className="px-3 py-3.5 align-top">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {item.showOnMemberMarquee
                            ? 'Notifikasi marquee dashboard member'
                            : 'Arsip internal (non-marquee)'}
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-3.5 align-top">
                        <p className="max-w-2xl whitespace-pre-line break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {item.message}
                        </p>
                      </TableCell>

                      <TableCell className="px-3 py-3.5 align-top font-mono-num text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.publishedAt}
                      </TableCell>

                      <TableCell className="px-3 py-3.5 align-top whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                              isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            )}
                          >
                            {item.status}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            aria-label={`Ubah status pengumuman ${item.title}`}
                            onClick={() => {
                              onToggleAnnouncementStatus(item.id);
                              setFeedbackMessage(
                                `Status pengumuman "${item.title}" diubah menjadi ${isActive ? 'Inactive' : 'Active'}.`
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

                      <TableCell className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setViewingItem(item)}
                            aria-label={`Lihat detail pengumuman ${item.title}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => openEditModal(item)}
                            aria-label={`Edit pengumuman ${item.title}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setDeletingItem(item)}
                            aria-label={`Hapus pengumuman ${item.title}`}
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

      {/* Create / Edit Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pengumuman-modal-title"
          onClick={closeFormModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2
                  id="pengumuman-modal-title"
                  className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  {modalMode === 'create'
                    ? 'Buat Pengumuman Marquee Member'
                    : 'Edit Pengumuman Marquee Member'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Teks pengumuman akan disiapkan untuk marquee notifikasi di dashboard member (bukan WhatsApp).
                </p>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                aria-label="Tutup modal pengumuman"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-5" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="pengumuman-title-input"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Judul
                </label>
                <Input
                  id="pengumuman-title-input"
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Contoh: Pemeliharaan sistem"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="pengumuman-message-input"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Pesan
                  </label>
                  <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                    {formatNumber(formState.message.length)} karakter
                  </span>
                </div>
                <textarea
                  id="pengumuman-message-input"
                  rows={6}
                  value={formState.message}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Tulis isi pengumuman yang akan berjalan pada marquee notifikasi dashboard member..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pengumuman-status-select"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Status
                  </label>
                  <select
                    id="pengumuman-status-select"
                    value={formState.status}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        status: e.target.value as AnnouncementStatus,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300 sm:mt-6 cursor-pointer">
                  <span>Tampilkan di marquee member</span>
                  <input
                    type="checkbox"
                    checked={formState.showOnMemberMarquee}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        showOnMemberMarquee: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                  />
                </label>
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
                  onClick={closeFormModal}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {modalMode === 'create'
                    ? 'Simpan Pengumuman'
                    : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Preview Modal */}
      {viewingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-pengumuman-title"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  Marquee Dashboard Member
                </span>
                <h2
                  id="detail-pengumuman-title"
                  className="mt-1.5 font-display text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  {viewingItem.title}
                </h2>
                <p className="mt-0.5 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                  {viewingItem.publishedAt} · {viewingItem.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                aria-label="Tutup detail pengumuman"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-line break-words dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
              {viewingItem.message}
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingItem(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-pengumuman-title"
          onClick={() => setDeletingItem(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-pengumuman-title"
              className="font-display text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Hapus Pengumuman
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus pengumuman{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {deletingItem.title}
              </span>
              ? Teks ini akan dihapus dari marquee notifikasi dashboard member.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingItem(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Hapus Pengumuman
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
