'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { getAdminInitials, type AdminAccountState } from '@/src/lib/admin-auth';
import { ADMIN_MIN_PASSWORD_LENGTH, type AdminPasswordChangeInput } from '@/src/lib/dashboard-schema';
import { validateProductImageFile } from '@/src/lib/utils';

interface AccountSettingsModalProps {
  open: boolean;
  account: AdminAccountState;
  onClose: () => void;
  onChangePassword: (input: AdminPasswordChangeInput) => string | null;
  onUpdateAvatar: (avatarUrl: string | null) => void;
}

export function AccountSettingsModal({
  open,
  account,
  onClose,
  onChangePassword,
  onUpdateAvatar,
}: AccountSettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validation = validateProductImageFile({
      type: file.type,
      size: file.size,
    });
    if (!validation.valid) {
      setAvatarError(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateAvatar(reader.result);
        setAvatarError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const err = onChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (err) {
      setError(err);
      setSuccess(null);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess('Password akun admin berhasil diperbarui untuk sesi ini.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="account-settings-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Pengaturan Akun &amp; Ganti Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {account.session.name} · {account.session.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
            aria-label="Tutup pengaturan akun"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-3 min-w-0">
              {account.avatarUrl ? (
                <img
                  src={account.avatarUrl}
                  alt={`Foto profil ${account.session.name}`}
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-semibold text-white dark:bg-purple-600"
                  aria-hidden="true"
                >
                  {getAdminInitials(account.session.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {account.session.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {account.session.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
                aria-label="Unggah foto profil admin"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Foto Profil</span>
              </Button>
              {account.avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdateAvatar(null);
                    setAvatarError(null);
                  }}
                  aria-label="Hapus foto profil"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>

          {avatarError && (
            <p
              role="alert"
              className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{avatarError}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>Ubah Password Admin</span>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-current-password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Password Saat Ini
              </label>
              <div className="relative">
                <Input
                  id="admin-current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (error) setError(null);
                    if (success) setSuccess(null);
                  }}
                  placeholder="Masukkan password saat ini"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={
                    showCurrent ? 'Sembunyikan password saat ini' : 'Lihat password saat ini'
                  }
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-new-password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Password Baru (minimal {ADMIN_MIN_PASSWORD_LENGTH} karakter)
              </label>
              <div className="relative">
                <Input
                  id="admin-new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                    if (success) setSuccess(null);
                  }}
                  placeholder="Masukkan password baru"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={
                    showNew ? 'Sembunyikan password baru' : 'Lihat password baru'
                  }
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-confirm-password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Input
                  id="admin-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                    if (success) setSuccess(null);
                  }}
                  placeholder="Ulangi password baru"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={
                    showConfirm
                      ? 'Sembunyikan konfirmasi password baru'
                      : 'Lihat konfirmasi password baru'
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Tutup
              </Button>
              <Button type="submit" variant="primary">
                Simpan Password Baru
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
