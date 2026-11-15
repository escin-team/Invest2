'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  Send,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import {
  DEFAULT_SMTP_PUBLIC_SETTINGS,
  SMTP_PROVIDER_PRESETS,
} from '@/src/lib/smtp-settings';
import type {
  SmtpEmailLog,
  SmtpEncryption,
  SmtpProviderPreset,
  SmtpSettingsPublic,
  SmtpSettingsSaveInput,
} from '@/src/lib/dashboard-schema';
import { cn } from '@/src/lib/utils';

interface SmtpFormState {
  enabled: boolean;
  preset: SmtpProviderPreset;
  host: string;
  port: string;
  encryption: SmtpEncryption;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

function toFormState(status: SmtpSettingsPublic): SmtpFormState {
  return {
    enabled: status.enabled,
    preset: status.preset,
    host: status.host,
    port: String(status.port),
    encryption: status.encryption,
    username: status.username,
    password: '',
    fromName: status.fromName,
    fromEmail: status.fromEmail,
    replyTo: status.replyTo,
  };
}

function getPurposeLabel(purpose: SmtpEmailLog['purpose']): string {
  if (purpose === 'register_otp') return 'OTP Daftar';
  if (purpose === 'forgot_password') return 'Lupa Password';
  return 'Tes SMTP';
}

export function SmtpSettingsView() {
  const [status, setStatus] = useState<SmtpSettingsPublic>(DEFAULT_SMTP_PUBLIC_SETTINGS);
  const [logs, setLogs] = useState<SmtpEmailLog[]>([]);
  const [form, setForm] = useState<SmtpFormState>(() =>
    toFormState(DEFAULT_SMTP_PUBLIC_SETTINGS)
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchSmtpConfig = useCallback(async () => {
    const response = await fetch('/api/smtp/config', { cache: 'no-store' });
    const data = (await response.json()) as {
      status?: SmtpSettingsPublic;
      logs?: SmtpEmailLog[];
      error?: string;
    };
    if (!response.ok || !data.status) {
      throw new Error(data.error ?? 'Gagal memuat konfigurasi SMTP dari server.');
    }
    return {
      status: data.status,
      logs: Array.isArray(data.logs) ? data.logs : [],
    };
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const payload = await fetchSmtpConfig();
      setStatus(payload.status);
      setLogs(payload.logs);
      setForm(toFormState(payload.status));
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Tidak dapat terhubung ke endpoint /api/smtp/config.'
      );
    } finally {
      setLoading(false);
    }
  }, [fetchSmtpConfig]);

  useEffect(() => {
    let active = true;
    fetchSmtpConfig()
      .then((payload) => {
        if (!active) return;
        setStatus(payload.status);
        setLogs(payload.logs);
        setForm(toFormState(payload.status));
        setLoadError(null);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Tidak dapat terhubung ke endpoint /api/smtp/config.'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchSmtpConfig]);

  const activePresetInfo =
    SMTP_PROVIDER_PRESETS.find((item) => item.id === form.preset) ??
    SMTP_PROVIDER_PRESETS[SMTP_PROVIDER_PRESETS.length - 1];

  const handleSelectPreset = (presetId: SmtpProviderPreset) => {
    const preset = SMTP_PROVIDER_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      preset: preset.id,
      host: preset.id === 'custom' ? prev.host : preset.host,
      port: String(preset.port),
      encryption: preset.encryption,
    }));
    setSaveFeedback(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveFeedback(null);

    const parsedPort = Number.parseInt(form.port.trim(), 10);
    const payload: SmtpSettingsSaveInput = {
      enabled: form.enabled,
      preset: form.preset,
      host: form.host.trim(),
      port: Number.isFinite(parsedPort) ? parsedPort : 587,
      encryption: form.encryption,
      username: form.username.trim(),
      ...(form.password.trim().length > 0 ? { password: form.password } : {}),
      fromName: form.fromName.trim(),
      fromEmail: form.fromEmail.trim(),
      replyTo: form.replyTo.trim(),
    };

    try {
      const response = await fetch('/api/smtp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        status?: SmtpSettingsPublic;
        logs?: SmtpEmailLog[];
        message?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.status) {
        setSaveFeedback({
          type: 'error',
          message: data.error ?? 'Gagal menyimpan pengaturan SMTP.',
        });
        return;
      }
      setStatus(data.status);
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setForm(toFormState(data.status));
      setSaveFeedback({
        type: 'success',
        message: data.message ?? 'Pengaturan SMTP berhasil disimpan.',
      });
    } catch {
      setSaveFeedback({
        type: 'error',
        message: 'Terjadi kesalahan jaringan saat menyimpan konfigurasi SMTP.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToEnv = async () => {
    setResetting(true);
    setSaveFeedback(null);
    try {
      const response = await fetch('/api/smtp/config', { method: 'DELETE' });
      const data = (await response.json()) as {
        ok?: boolean;
        status?: SmtpSettingsPublic;
        logs?: SmtpEmailLog[];
        message?: string;
      };
      if (response.ok && data.status) {
        setStatus(data.status);
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setForm(toFormState(data.status));
        setSaveFeedback({
          type: 'success',
          message: data.message ?? 'Pengaturan dikembalikan ke default environment.',
        });
      }
    } catch {
      setSaveFeedback({
        type: 'error',
        message: 'Gagal mereset konfigurasi SMTP.',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleSendTestEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTesting(true);
    setTestFeedback(null);
    try {
      const response = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testEmail.trim() }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        status?: SmtpSettingsPublic;
        logs?: SmtpEmailLog[];
      };
      if (data.status) setStatus(data.status);
      if (Array.isArray(data.logs)) setLogs(data.logs);
      if (!response.ok || !data.ok) {
        setTestFeedback({
          type: 'error',
          message: data.message ?? data.error ?? 'Pengiriman email tes gagal.',
        });
        return;
      }
      setTestFeedback({
        type: 'success',
        message: data.message ?? 'Email tes berhasil dikirim.',
      });
    } catch {
      setTestFeedback({
        type: 'error',
        message: 'Gagal terhubung ke server untuk mengirim email tes.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pengaturan SMTP Email
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Konfigurasikan server email keluar untuk mengirim OTP pendaftaran member baru dan verifikasi lupa password Admin maupun Member.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadConfig()}
          disabled={loading}
          className="shrink-0 whitespace-nowrap"
        >
          <RefreshCw
            className={cn('h-4 w-4', loading && 'animate-spin')}
            aria-hidden="true"
          />
          <span>Muat Ulang Status</span>
        </Button>
      </section>

      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadConfig()}
            className="shrink-0"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Status Overview Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Status Pengiriman
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
                  status.configured
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                )}
              >
                {status.configured ? 'SMTP Aktif & Siap' : 'Mode Simulasi OTP'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {status.configured
                ? 'Email dikirim langsung via server SMTP.'
                : 'Aktifkan SMTP agar email masuk ke inbox pengguna.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Host &amp; Port Aktif
            </p>
            <p className="mt-2 truncate font-mono-num text-sm font-bold text-slate-900 dark:text-slate-100">
              {status.host ? `${status.host}:${status.port}` : 'Belum diisi'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Enkripsi: {status.encryption.toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Identitas Pengirim
            </p>
            <p className="mt-2 truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {status.fromName}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {status.fromEmail || 'Email pengirim belum diatur'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kredensial &amp; Pembaruan
            </p>
            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              {status.hasPassword ? 'Password Tersimpan di Server' : 'Tanpa Password'}
            </p>
            <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
              {status.updatedAt ? `Update: ${status.updatedAt}` : 'Belum pernah disimpan'}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Form Konfigurasi SMTP */}
        <Card className="lg:col-span-7">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-amber-300">
              <Server className="h-4 w-4" aria-hidden="true" />
              <span>Konfigurasi Server SMTP</span>
            </div>
            <CardTitle className="mt-1 text-lg">Kredensial &amp; Identitas Pengirim</CardTitle>
            <CardDescription>
              Password SMTP hanya disimpan di memori server selama sesi berjalan dan tidak pernah dikirim kembali ke browser.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {loading ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" aria-hidden="true" />
                <span>Memuat pengaturan SMTP server...</span>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-5" noValidate>
                {/* Toggle SMTP Active */}
                <div className="flex items-center justify-between gap-4 rounded-xl border border-purple-200 bg-purple-50/70 px-4 py-3 dark:border-purple-900/60 dark:bg-purple-950/30">
                  <div>
                    <label
                      htmlFor="smtp-enabled-toggle"
                      className="text-sm font-semibold text-purple-950 dark:text-amber-200 cursor-pointer"
                    >
                      Aktifkan Pengiriman Email SMTP
                    </label>
                    <p className="text-xs text-purple-800/80 dark:text-purple-200/80">
                      Saat aktif, OTP Pendaftaran &amp; Lupa Password dikirim ke email asli pengguna.
                    </p>
                  </div>
                  <button
                    id="smtp-enabled-toggle"
                    type="button"
                    role="switch"
                    aria-checked={form.enabled}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
                    }
                    className={cn(
                      'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer',
                      form.enabled
                        ? 'bg-purple-700 dark:bg-amber-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                        form.enabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Preset Provider */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preset Penyedia SMTP Cepat
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SMTP_PROVIDER_PRESETS.map((preset) => {
                      const active = form.preset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer',
                            active
                              ? 'border-purple-600 bg-purple-50 text-purple-950 dark:border-amber-400 dark:bg-purple-950/60 dark:text-amber-200'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                          )}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activePresetInfo.note}
                  </p>
                </div>

                {/* Host, Port, Encryption */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="space-y-1.5 sm:col-span-6">
                    <label
                      htmlFor="smtp-host"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Host SMTP
                    </label>
                    <Input
                      id="smtp-host"
                      type="text"
                      value={form.host}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, host: e.target.value }))
                      }
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    <label
                      htmlFor="smtp-port"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Port
                    </label>
                    <Input
                      id="smtp-port"
                      type="number"
                      min={1}
                      max={65535}
                      value={form.port}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, port: e.target.value }))
                      }
                      placeholder="587"
                      className="font-mono-num"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    <label
                      htmlFor="smtp-encryption"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Enkripsi
                    </label>
                    <select
                      id="smtp-encryption"
                      value={form.encryption}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          encryption: e.target.value as SmtpEncryption,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-purple-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="starttls">STARTTLS</option>
                      <option value="ssl">SSL / TLS</option>
                      <option value="none">Tanpa TLS</option>
                    </select>
                  </div>
                </div>

                {/* Username & Password */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="smtp-username"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Username / Email Auth SMTP
                    </label>
                    <Input
                      id="smtp-username"
                      type="text"
                      autoComplete="off"
                      value={form.username}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="noreply@naturerepublic.id"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="smtp-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Password / App Password
                    </label>
                    <div className="relative">
                      <Input
                        id="smtp-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder={
                          status.hasPassword
                            ? 'Kosongkan untuk pertahankan password lama'
                            : 'Masukkan password / API key SMTP'
                        }
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Sembunyikan password SMTP' : 'Lihat password SMTP'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* From Name, From Email, Reply To */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="smtp-from-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Nama Pengirim
                    </label>
                    <Input
                      id="smtp-from-name"
                      type="text"
                      value={form.fromName}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, fromName: e.target.value }))
                      }
                      placeholder="Nature Republic Investasi"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="smtp-from-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Email Pengirim (From)
                    </label>
                    <Input
                      id="smtp-from-email"
                      type="email"
                      value={form.fromEmail}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, fromEmail: e.target.value }))
                      }
                      placeholder="no-reply@naturerepublic.id"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="smtp-reply-to"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Reply-To (Opsional)
                    </label>
                    <Input
                      id="smtp-reply-to"
                      type="email"
                      value={form.replyTo}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, replyTo: e.target.value }))
                      }
                      placeholder="support@naturerepublic.id"
                    />
                  </div>
                </div>

                {saveFeedback && (
                  <div
                    role={saveFeedback.type === 'error' ? 'alert' : 'status'}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-medium',
                      saveFeedback.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                    )}
                  >
                    {saveFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{saveFeedback.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleResetToEnv()}
                    disabled={resetting || saving}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span>{resetting ? 'Mereset...' : 'Reset ke Env Server'}</span>
                  </Button>
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan SMTP'}</span>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Right: Uji Koneksi & Riwayat Pengiriman */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader className="border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-amber-300">
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Pengujian Langsung</span>
              </div>
              <CardTitle className="mt-1 text-lg">Kirim Email Tes SMTP</CardTitle>
              <CardDescription>
                Simpan konfigurasi di sebelah kiri terlebih dahulu, lalu kirim email uji coba ke inbox Anda untuk memastikan pengiriman OTP berjalan lancar.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-5">
              <form onSubmit={handleSendTestEmail} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <label
                    htmlFor="smtp-test-recipient"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Email Penerima Tes
                  </label>
                  <Input
                    id="smtp-test-recipient"
                    type="email"
                    value={testEmail}
                    onChange={(e) => {
                      setTestEmail(e.target.value);
                      if (testFeedback) setTestFeedback(null);
                    }}
                    placeholder="nama@domain.com"
                  />
                </div>

                {testFeedback && (
                  <div
                    role={testFeedback.type === 'error' ? 'alert' : 'status'}
                    className={cn(
                      'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium',
                      testFeedback.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                    )}
                  >
                    {testFeedback.type === 'success' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{testFeedback.message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={testing || !testEmail.trim()}
                  className="w-full"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{testing ? 'Mengirim Email Tes...' : 'Kirim Email Tes'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Riwayat Pengiriman Email</CardTitle>
                  <CardDescription>
                    Alamat email penerima disamarkan untuk menjaga privasi.
                  </CardDescription>
                </div>
                <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {logs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Belum ada aktivitas pengiriman email
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Riwayat OTP Pendaftaran, Lupa Password, dan Tes SMTP akan tercatat di sini.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {logs.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {getPurposeLabel(item.purpose)}
                        </span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-[11px] font-semibold',
                            item.status === 'terkirim'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : item.status === 'simulasi'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          )}
                        >
                          {item.status === 'terkirim'
                            ? 'Terkirim SMTP'
                            : item.status === 'simulasi'
                              ? 'Simulasi'
                              : 'Gagal'}
                        </span>
                      </div>
                      <p className="mt-1 font-mono-num text-xs text-slate-600 dark:text-slate-300">
                        Ke: {item.maskedRecipient}
                      </p>
                      {item.errorMessage && (
                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                          {item.errorMessage}
                        </p>
                      )}
                      <p className="mt-1 font-mono-num text-[11px] text-slate-400 dark:text-slate-500">
                        {item.sentAt} · ID {item.id}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
