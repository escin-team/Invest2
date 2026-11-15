'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Mail,
  Phone,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import {
  COMPANY_DOCUMENT_SLOTS,
  createEmptyCompanySettings,
  formatCompanyImageSize,
  type SaveCompanySettingsInput,
} from '@/src/lib/company-settings';
import type {
  CompanyDocumentSlotKey,
  CompanyImageAsset,
  CompanySettings,
} from '@/src/lib/dashboard-schema';
import { validateProductImageFile } from '@/src/lib/utils';

interface CompanySettingsViewProps {
  settings: CompanySettings;
  onSaveSettings: (input: SaveCompanySettingsInput) => string | null;
  onResetSettings: () => void;
}

export function CompanySettingsView({
  settings,
  onSaveSettings,
  onResetSettings,
}: CompanySettingsViewProps) {
  const [draftImages, setDraftImages] = useState<
    Record<CompanyDocumentSlotKey, CompanyImageAsset | null>
  >({
    faqImage: settings.faqImage,
    rulesImage: settings.rulesImage,
    contractImage: settings.contractImage,
    charityImage: settings.charityImage,
  });
  const [csPhone, setCsPhone] = useState(settings.csPhone);
  const [csEmail, setCsEmail] = useState(settings.csEmail);
  const [slotErrors, setSlotErrors] = useState<
    Partial<Record<CompanyDocumentSlotKey, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<CompanyDocumentSlotKey, HTMLInputElement | null>>({
    faqImage: null,
    rulesImage: null,
    contractImage: null,
    charityImage: null,
  });

  const uploadedCount = COMPANY_DOCUMENT_SLOTS.filter(
    (slot) => draftImages[slot.key] !== null
  ).length;

  const handleSelectImage = (
    slotKey: CompanyDocumentSlotKey,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validation = validateProductImageFile({
      type: file.type,
      size: file.size,
    });
    if (!validation.valid) {
      setSlotErrors((prev) => ({ ...prev, [slotKey]: validation.error }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setSlotErrors((prev) => ({
          ...prev,
          [slotKey]: 'Gagal membaca berkas gambar yang dipilih.',
        }));
        return;
      }
      const nextAsset: CompanyImageAsset = {
        dataUrl: reader.result,
        fileName: file.name,
        fileSize: file.size,
        updatedAt: new Date().toISOString(),
      };
      setDraftImages((prev) => ({ ...prev, [slotKey]: nextAsset }));
      setSlotErrors((prev) => {
        const next = { ...prev };
        delete next[slotKey];
        return next;
      });
      setFormError(null);
      setSaveSuccess(null);
    };
    reader.onerror = () => {
      setSlotErrors((prev) => ({
        ...prev,
        [slotKey]: 'Terjadi kesalahan saat membaca file gambar.',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (slotKey: CompanyDocumentSlotKey) => {
    setDraftImages((prev) => ({ ...prev, [slotKey]: null }));
    setSlotErrors((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
    setFormError(null);
    setSaveSuccess(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const err = onSaveSettings({
      ...draftImages,
      csPhone,
      csEmail,
    });

    if (err) {
      setFormError(err);
      setSaveSuccess(null);
      return;
    }

    setFormError(null);
    setSaveSuccess('Pengaturan perusahaan berhasil disimpan.');
  };

  const handleClearAll = () => {
    const empty = createEmptyCompanySettings();
    setDraftImages({
      faqImage: empty.faqImage,
      rulesImage: empty.rulesImage,
      contractImage: empty.contractImage,
      charityImage: empty.charityImage,
    });
    setCsPhone('');
    setCsEmail('');
    setSlotErrors({});
    setFormError(null);
    setSaveSuccess('Seluruh form pengaturan perusahaan telah dikosongkan.');
    onResetSettings();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pengaturan Perusahaan
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Kelola gambar informasi platform yang bersifat opsional serta kontak resmi Customer Service.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
          {uploadedCount} / {COMPANY_DOCUMENT_SLOTS.length} gambar terunggah
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-200 dark:border-slate-800">
          <CardTitle>Form Pengaturan Perusahaan</CardTitle>
          <CardDescription>
            Keempat gambar di bawah bersifat opsional. Format gambar yang didukung: JPG, PNG, WebP, atau GIF (maks. 5 MB).
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Gambar Dokumen & Informasi (Opsional)
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Biarkan kosong apabila belum perlu ditampilkan ke pengguna.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                {COMPANY_DOCUMENT_SLOTS.map((slot) => {
                  const asset = draftImages[slot.key];
                  const slotError = slotErrors[slot.key];
                  const inputId = `company-upload-${slot.key}`;

                  return (
                    <div
                      key={slot.key}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div>
                        <label
                          htmlFor={inputId}
                          className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
                        >
                          {slot.label}
                        </label>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {slot.helperText}
                        </p>
                      </div>

                      <input
                        id={inputId}
                        ref={(el) => {
                          fileInputRefs.current[slot.key] = el;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSelectImage(slot.key, e)}
                        className="sr-only"
                      />

                      <div className="mt-3">
                        {asset ? (
                          <div className="space-y-3">
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                              <img
                                src={asset.dataUrl}
                                alt={slot.label}
                                referrerPolicy="no-referrer"
                                className="h-44 w-full object-cover"
                              />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                                  {asset.fileName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                                  {formatCompanyImageSize(asset.fileSize)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRefs.current[slot.key]?.click()}
                                  aria-label={`Ganti ${slot.label}`}
                                >
                                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Ganti</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveImage(slot.key)}
                                  aria-label={`Hapus ${slot.label}`}
                                  className="text-red-600 hover:text-red-700 dark:text-red-400"
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
                            onClick={() => fileInputRefs.current[slot.key]?.click()}
                            className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 text-center transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/70 cursor-pointer"
                          >
                            <ImagePlus
                              className="h-6 w-6 text-slate-400 dark:text-slate-500"
                              aria-hidden="true"
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              Pilih gambar dari perangkat
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Opsional · Maks. 5 MB
                            </span>
                          </button>
                        )}
                      </div>

                      {slotError && (
                        <p
                          role="alert"
                          className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{slotError}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Kontak Customer Service
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Nomor telepon / WhatsApp dan alamat email resmi layanan pelanggan.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="cs-phone"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Nomor CS
                  </label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="cs-phone"
                      type="tel"
                      value={csPhone}
                      onChange={(e) => {
                        setCsPhone(e.target.value);
                        if (formError) setFormError(null);
                        if (saveSuccess) setSaveSuccess(null);
                      }}
                      placeholder="Contoh: 0812-3456-7890 atau +6281234567890"
                      className="pl-9 font-mono-num"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="cs-email"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Email CS
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="cs-email"
                      type="email"
                      value={csEmail}
                      onChange={(e) => {
                        setCsEmail(e.target.value);
                        if (formError) setFormError(null);
                        if (saveSuccess) setSaveSuccess(null);
                      }}
                      placeholder="Contoh: support@perusahaan.co.id"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            {saveSuccess && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={handleClearAll}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Kosongkan Form</span>
              </Button>
              <Button type="submit" variant="primary">
                <span>Simpan Pengaturan</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
