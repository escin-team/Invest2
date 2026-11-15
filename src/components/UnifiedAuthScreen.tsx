'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Moon,
  Phone,
  Send,
  ServerCrash,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import type {
  AdminRoleAccount,
  AdminUserRecord,
  MemberRegisterInput,
  ServerControlSettings,
} from '@/src/lib/dashboard-schema';
import {
  findMemberByIdentifier,
  validateMemberRegistrationInput,
} from '@/src/lib/member-app';
import { resolveUnifiedLogin } from '@/src/lib/platform-auth';
import { maskEmailAddress } from '@/src/lib/smtp-settings';
import { cn } from '@/src/lib/utils';

type AuthTab = 'masuk' | 'daftar' | 'lupa';

interface MaintenanceModalState {
  targetRole: 'Admin' | 'Member';
  accountName: string;
  title: string;
  message: string;
  eta: string;
}

interface UnifiedAuthScreenProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  adminAccounts: ReadonlyArray<AdminRoleAccount>;
  members: ReadonlyArray<AdminUserRecord>;
  serverControl: ServerControlSettings;
  onAuthenticatedAdmin: (admin: AdminRoleAccount) => void;
  onAuthenticatedMember: (member: AdminUserRecord) => void;
  onRegisterMember: (input: MemberRegisterInput) => { error: string | null };
  onResetMemberPassword: (
    email: string,
    newPassword: string,
    confirmPassword: string
  ) => { error: string | null };
  onResetAdminPassword: (
    email: string,
    newPassword: string,
    confirmPassword: string
  ) => string | null;
}

export function UnifiedAuthScreen({
  darkMode,
  onToggleDarkMode,
  adminAccounts,
  members,
  serverControl,
  onAuthenticatedAdmin,
  onAuthenticatedMember,
  onRegisterMember,
  onResetMemberPassword,
  onResetAdminPassword,
}: UnifiedAuthScreenProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('masuk');

  // Login tab state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [maintenanceModal, setMaintenanceModal] =
    useState<MaintenanceModalState | null>(null);

  // Register tab state (Member)
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regReferral, setRegReferral] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regDeliveryNote, setRegDeliveryNote] = useState<string | null>(null);
  const [regSimulationCode, setRegSimulationCode] = useState<string | null>(null);
  const [regBusy, setRegBusy] = useState(false);

  // Forgot password tab state (Admin / Super Admin / Member)
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotTargetKind, setForgotTargetKind] = useState<'admin' | 'member'>('member');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotDeliveryNote, setForgotDeliveryNote] = useState<string | null>(null);
  const [forgotSimulationCode, setForgotSimulationCode] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);

  useEffect(() => {
    if (!maintenanceModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMaintenanceModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maintenanceModal]);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setLoginError(null);
    setRegError(null);
    setForgotError(null);
  };

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginNotice(null);
    setLoginError(null);

    const result = resolveUnifiedLogin({
      identifier,
      password,
      adminAccounts,
      members,
      serverControl,
    });

    if (result.status === 'server_blocked') {
      setMaintenanceModal({
        targetRole: result.targetRole,
        accountName: result.accountName,
        title: result.title,
        message: result.message,
        eta: result.eta,
      });
      return;
    }

    if (result.status === 'error') {
      setLoginError(result.error);
      return;
    }

    if (result.status === 'admin_authenticated') {
      onAuthenticatedAdmin(result.admin);
      return;
    }

    onAuthenticatedMember(result.member);
  };

  const requestRegistrationOtp = async () => {
    const candidate: MemberRegisterInput = {
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword,
      confirmPassword: regConfirmPassword,
      referralCode: regReferral.trim(),
    };
    const check = validateMemberRegistrationInput(members, candidate);
    if (!check.ok) {
      setRegError(check.error);
      return;
    }

    const emailUsedByAdmin = adminAccounts.some(
      (a) => a.email.trim().toLowerCase() === check.data.email.trim().toLowerCase()
    );
    if (emailUsedByAdmin) {
      setRegError('Email ini sudah digunakan pada sistem.');
      return;
    }

    setRegBusy(true);
    setRegError(null);
    setRegSimulationCode(null);

    try {
      const response = await fetch('/api/auth/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'register_otp',
          email: check.data.email,
          recipientName: check.data.name,
          roleLabel: 'Member',
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        mode?: 'smtp' | 'simulation';
        message?: string;
        error?: string;
        previewCode?: string;
      };
      if (!response.ok || !data.ok) {
        setRegError(
          data.message ?? data.error ?? 'Gagal mengirim kode OTP verifikasi ke email.'
        );
        return;
      }
      setRegDeliveryNote(
        data.message ??
          `Kode verifikasi 6 digit telah dikirim ke ${maskEmailAddress(check.data.email)}.`
      );
      setRegSimulationCode(
        data.mode === 'simulation' && data.previewCode ? data.previewCode : null
      );
      setRegOtpCode('');
      setRegStep('otp');
    } catch {
      setRegError('Tidak dapat menghubungi layanan pengiriman email OTP.');
    } finally {
      setRegBusy(false);
    }
  };

  const handleRegisterFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void requestRegistrationOtp();
  };

  const handleVerifyRegistrationOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegError(null);

    if (!/^\d{6}$/.test(regOtpCode.trim())) {
      setRegError('Masukkan 6 digit kode OTP dari email Anda.');
      return;
    }

    setRegBusy(true);
    try {
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'register_otp',
          email: regEmail.trim(),
          code: regOtpCode.trim(),
        }),
      });
      const verifyData = (await verifyResponse.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!verifyResponse.ok || !verifyData.ok) {
        setRegError(verifyData.error ?? 'Kode OTP verifikasi tidak sesuai.');
        return;
      }

      const result = onRegisterMember({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        referralCode: regReferral.trim(),
      });
      if (result.error) {
        setRegError(result.error);
      }
    } catch {
      setRegError('Gagal memverifikasi kode OTP pendaftaran.');
    } finally {
      setRegBusy(false);
    }
  };

  const requestForgotOtp = async () => {
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setForgotError('Masukkan alamat email terdaftar yang valid.');
      return;
    }

    const matchedAdmin = adminAccounts.find(
      (a) => a.email.trim().toLowerCase() === trimmedEmail.toLowerCase()
    );
    const matchedMember = findMemberByIdentifier(members, trimmedEmail);
    const validMemberMatch =
      matchedMember &&
      matchedMember.email.trim().toLowerCase() === trimmedEmail.toLowerCase()
        ? matchedMember
        : null;

    if (!matchedAdmin && !validMemberMatch) {
      setForgotError('Email ini belum terdaftar di Nature Republic.');
      return;
    }

    const kind: 'admin' | 'member' = matchedAdmin ? 'admin' : 'member';
    const recipientName = matchedAdmin
      ? matchedAdmin.name
      : validMemberMatch!.name;
    const recipientEmail = matchedAdmin
      ? matchedAdmin.email
      : validMemberMatch!.email;

    setForgotTargetKind(kind);
    setForgotBusy(true);
    setForgotError(null);
    setForgotSimulationCode(null);

    try {
      const response = await fetch('/api/auth/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'forgot_password',
          email: recipientEmail,
          recipientName,
          roleLabel: kind === 'admin' ? 'Pengelola' : 'Member',
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        mode?: 'smtp' | 'simulation';
        message?: string;
        error?: string;
        previewCode?: string;
      };
      if (!response.ok || !data.ok) {
        setForgotError(
          data.message ?? data.error ?? 'Gagal mengirim email pemulihan kata sandi.'
        );
        return;
      }
      setForgotDeliveryNote(
        data.message ??
          `Kode OTP reset sandi telah dikirim ke ${maskEmailAddress(recipientEmail)}.`
      );
      setForgotSimulationCode(
        data.mode === 'simulation' && data.previewCode ? data.previewCode : null
      );
      setForgotOtpCode('');
      setForgotStep('reset');
    } catch {
      setForgotError('Tidak dapat terhubung ke layanan email server.');
    } finally {
      setForgotBusy(false);
    }
  };

  const handleForgotEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void requestForgotOtp();
  };

  const handleConfirmForgotReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotError(null);

    if (!/^\d{6}$/.test(forgotOtpCode.trim())) {
      setForgotError('Masukkan 6 digit kode OTP yang dikirim ke email Anda.');
      return;
    }

    const minLength = forgotTargetKind === 'admin' ? 8 : 6;
    if (forgotNewPassword.length < minLength) {
      setForgotError(`Kata sandi baru minimal ${minLength} karakter.`);
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setForgotBusy(true);
    try {
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'forgot_password',
          email: forgotEmail.trim(),
          code: forgotOtpCode.trim(),
        }),
      });
      const verifyData = (await verifyResponse.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!verifyResponse.ok || !verifyData.ok) {
        setForgotError(verifyData.error ?? 'Kode OTP tidak valid.');
        return;
      }

      if (forgotTargetKind === 'admin') {
        const err = onResetAdminPassword(
          forgotEmail.trim(),
          forgotNewPassword,
          forgotConfirmPassword
        );
        if (err) {
          setForgotError(err);
          return;
        }
      } else {
        const resetRes = onResetMemberPassword(
          forgotEmail.trim(),
          forgotNewPassword,
          forgotConfirmPassword
        );
        if (resetRes.error) {
          setForgotError(resetRes.error);
          return;
        }
      }

      setIdentifier(forgotEmail.trim());
      setPassword('');
      setLoginNotice(
        'Kata sandi baru berhasil disimpan. Silakan masuk menggunakan kata sandi baru Anda.'
      );
      setForgotStep('email');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotOtpCode('');
      switchTab('masuk');
    } catch {
      setForgotError('Terjadi kesalahan saat memperbarui kata sandi.');
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-white to-amber-50/70 text-slate-900 dark:from-slate-950 dark:via-purple-950/30 dark:to-slate-950 dark:text-slate-100">
      {/* Compact Branded Top Bar (tanpa tombol Admin) */}
      <header className="flex h-16 items-center justify-between border-b border-purple-100 bg-white/90 px-4 backdrop-blur-sm dark:border-purple-950/70 dark:bg-slate-900/90 sm:px-8">
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/assets/brand/nature-republic-logo.png"
            alt="Logo Nature Republic"
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div className="leading-tight">
            <span className="block font-display text-base font-bold text-purple-950 dark:text-amber-300">
              Nature Republic
            </span>
            <span className="block text-[11px] font-medium text-purple-700 dark:text-purple-300">
              Investasi &amp; Keanggotaan
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-purple-100 text-purple-800 hover:bg-purple-100 dark:border-slate-800 dark:text-amber-300 dark:hover:bg-purple-950/60 cursor-pointer"
        >
          {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-6 md:grid md:grid-cols-12 md:items-center md:gap-8 md:py-10">
        {/* Brand Showcase Column */}
        <section className="rounded-3xl bg-gradient-to-br from-purple-950 via-purple-800 to-fuchsia-900 p-6 text-white shadow-lg shadow-purple-950/20 md:col-span-5 md:p-7">
          <div className="flex items-center gap-3.5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-300/50 bg-white/10 p-2 backdrop-blur-sm">
              <img
                src="/assets/brand/nature-republic-logo.png"
                alt="Logo Nature Republic Investasi"
                className="h-12 w-12 object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Portal Resmi
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                Nature Republic
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-purple-100/95">
            Satu pintu masuk aman untuk mengakses akun Nature Republic Anda. Sistem akan mengarahkan Anda secara otomatis sesuai peran akun yang terdaftar.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:grid-cols-1">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Imbal Hasil Harian</p>
                <p className="text-[11px] text-purple-100/80">
                  Pantau portofolio &amp; klaim profit rutin
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
              <Award className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Progres VIP 1 – 8</p>
                <p className="text-[11px] text-purple-100/80">
                  Limit penarikan &amp; gaji mingguan eksklusif
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Keamanan Email OTP</p>
                <p className="text-[11px] text-purple-100/80">
                  Pendaftaran &amp; pemulihan sandi terverifikasi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Unified Auth Card */}
        <section className="rounded-3xl border border-purple-200/80 bg-white p-5 shadow-xl shadow-purple-950/5 dark:border-purple-900/60 dark:bg-slate-900 sm:p-6 md:col-span-7">
          <div
            role="tablist"
            aria-label="Pilihan autentikasi"
            className="mb-5 grid grid-cols-3 gap-1.5 rounded-2xl bg-purple-100/70 p-1.5 dark:bg-slate-800/90"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'masuk'}
              onClick={() => switchTab('masuk')}
              className={cn(
                'min-h-[44px] rounded-xl px-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer sm:text-sm',
                activeTab === 'masuk'
                  ? 'bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white shadow-sm'
                  : 'text-purple-900 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
              )}
            >
              Masuk
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'daftar'}
              onClick={() => switchTab('daftar')}
              className={cn(
                'min-h-[44px] rounded-xl px-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer sm:text-sm',
                activeTab === 'daftar'
                  ? 'bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white shadow-sm'
                  : 'text-purple-900 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
              )}
            >
              Daftar Akun
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'lupa'}
              onClick={() => switchTab('lupa')}
              className={cn(
                'min-h-[44px] rounded-xl px-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer sm:text-sm',
                activeTab === 'lupa'
                  ? 'bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white shadow-sm'
                  : 'text-purple-900 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
              )}
            >
              Lupa Sandi
            </button>
          </div>

          {activeTab === 'masuk' && (
            <div>
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Masuk ke Akun Anda
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Masukkan email atau nomor HP dan kata sandi akun Nature Republic Anda.
                </p>
              </div>

              {loginNotice && (
                <div
                  role="status"
                  className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{loginNotice}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="unified-login-identifier"
                    className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Email atau Nomor HP Terdaftar
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-600/70 dark:text-purple-400"
                      aria-hidden="true"
                    />
                    <input
                      id="unified-login-identifier"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="nama@email.com atau 0812xxxxxxxx"
                      className="min-h-[48px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label
                      htmlFor="unified-login-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(identifier.includes('@') ? identifier.trim() : '');
                        switchTab('lupa');
                      }}
                      className="text-xs font-semibold text-purple-700 hover:underline dark:text-amber-300 cursor-pointer"
                    >
                      Lupa sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-600/70 dark:text-purple-400"
                      aria-hidden="true"
                    />
                    <input
                      id="unified-login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Masukkan kata sandi"
                      className="min-h-[48px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 pl-10 pr-12 text-sm text-slate-900 outline-none transition-colors focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                      className="absolute right-1.5 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 hover:bg-purple-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <p
                    role="alert"
                    className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{loginError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 px-5 text-sm font-bold text-white shadow-md shadow-purple-700/20 transition-transform hover:from-purple-800 hover:to-fuchsia-800 active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
                  <span>Masuk</span>
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-600 dark:text-slate-400">
                Belum memiliki akun member?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('daftar')}
                  className="font-bold text-purple-700 hover:underline dark:text-amber-300 cursor-pointer"
                >
                  Daftar sekarang
                </button>
              </p>
            </div>
          )}

          {activeTab === 'daftar' && (
            <div>
              {regStep === 'form' ? (
                <form onSubmit={handleRegisterFormSubmit} className="space-y-3.5" noValidate>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                      Buat Akun Member Baru
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Kode OTP 6 digit akan dikirimkan ke email Anda untuk aktivasi akun.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="unified-reg-name"
                      className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-600/70"
                        aria-hidden="true"
                      />
                      <input
                        id="unified-reg-name"
                        type="text"
                        value={regName}
                        onChange={(e) => {
                          setRegName(e.target.value);
                          setRegError(null);
                        }}
                        placeholder="Nama sesuai KTP / Rekening"
                        className="min-h-[46px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="unified-reg-email"
                        className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Email Aktif
                      </label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-600/70"
                          aria-hidden="true"
                        />
                        <input
                          id="unified-reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value);
                            setRegError(null);
                          }}
                          placeholder="nama@email.com"
                          className="min-h-[46px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="unified-reg-phone"
                        className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Nomor WhatsApp
                      </label>
                      <div className="relative">
                        <Phone
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-600/70"
                          aria-hidden="true"
                        />
                        <input
                          id="unified-reg-phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => {
                            setRegPhone(e.target.value);
                            setRegError(null);
                          }}
                          placeholder="081234567890"
                          className="min-h-[46px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 pl-10 pr-3 font-mono-num text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="unified-reg-password"
                        className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Kata Sandi (Min. 6 karakter)
                      </label>
                      <div className="relative">
                        <LockKeyhole
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-600/70"
                          aria-hidden="true"
                        />
                        <input
                          id="unified-reg-password"
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            setRegError(null);
                          }}
                          placeholder="Buat kata sandi"
                          className="min-h-[46px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 pl-10 pr-10 text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((prev) => !prev)}
                          aria-label={showRegPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="unified-reg-confirm-password"
                        className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Konfirmasi Kata Sandi
                      </label>
                      <input
                        id="unified-reg-confirm-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => {
                          setRegConfirmPassword(e.target.value);
                          setRegError(null);
                        }}
                        placeholder="Ulangi kata sandi"
                        className="min-h-[46px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 px-3.5 text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="unified-reg-referral"
                      className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Kode Referal (Opsional)
                    </label>
                    <div className="relative">
                      <Gift
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500"
                        aria-hidden="true"
                      />
                      <input
                        id="unified-reg-referral"
                        type="text"
                        value={regReferral}
                        onChange={(e) => setRegReferral(e.target.value.toUpperCase())}
                        placeholder="Contoh: RIZKY2298"
                        className="min-h-[46px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 pl-10 pr-4 font-mono-num text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {regError && (
                    <p
                      role="alert"
                      className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{regError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={regBusy}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 px-5 text-sm font-bold text-white shadow-md shadow-purple-700/20 hover:from-purple-800 hover:to-fuchsia-800 disabled:opacity-70 cursor-pointer"
                  >
                    {regBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <UserPlus className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    )}
                    <span>{regBusy ? 'Mengirim Kode OTP...' : 'Daftar & Kirim OTP Email'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyRegistrationOtp} className="space-y-4" noValidate>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                      Verifikasi Email Pendaftaran
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Masukkan kode OTP 6 digit yang dikirimkan ke{' '}
                      <span className="font-semibold text-purple-800 dark:text-amber-300">
                        {maskEmailAddress(regEmail)}
                      </span>
                      .
                    </p>
                  </div>

                  {regDeliveryNote && (
                    <div
                      role="status"
                      className="rounded-2xl border border-purple-200 bg-purple-50 px-3.5 py-2.5 text-xs text-purple-900 dark:border-purple-900/60 dark:bg-purple-950/50 dark:text-purple-200"
                    >
                      <p>{regDeliveryNote}</p>
                      {regSimulationCode && (
                        <p className="mt-1.5 font-mono-num font-bold text-amber-800 dark:text-amber-300">
                          Kode OTP Simulasi (SMTP belum aktif): {regSimulationCode}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="unified-reg-otp"
                      className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Kode OTP 6 Digit
                    </label>
                    <input
                      id="unified-reg-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={regOtpCode}
                      onChange={(e) => {
                        setRegOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setRegError(null);
                      }}
                      placeholder="000000"
                      className="min-h-[52px] w-full rounded-2xl border border-purple-300 bg-purple-50/40 px-4 text-center font-mono-num text-xl font-bold tracking-[0.4em] text-purple-950 outline-none focus:border-purple-700 focus:bg-white dark:border-purple-800 dark:bg-slate-950 dark:text-amber-300"
                    />
                  </div>

                  {regError && (
                    <p
                      role="alert"
                      className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{regError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={regBusy}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-purple-700 px-5 text-sm font-bold text-white shadow-md disabled:opacity-70 cursor-pointer"
                  >
                    {regBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{regBusy ? 'Memverifikasi...' : 'Verifikasi & Aktifkan Akun'}</span>
                  </button>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRegStep('form')}
                      className="font-semibold text-slate-600 hover:text-purple-700 dark:text-slate-400 dark:hover:text-amber-300 cursor-pointer"
                    >
                      Ubah data pendaftaran
                    </button>
                    <button
                      type="button"
                      disabled={regBusy}
                      onClick={() => void requestRegistrationOtp()}
                      className="font-semibold text-purple-700 hover:underline dark:text-amber-300 cursor-pointer"
                    >
                      Kirim ulang kode
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'lupa' && (
            <div>
              {forgotStep === 'email' ? (
                <form onSubmit={handleForgotEmailSubmit} className="space-y-4" noValidate>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                      Pulihkan Kata Sandi
                    </h2>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Masukkan alamat email akun Anda. Kode OTP 6 digit akan dikirim melalui SMTP untuk mengatur kata sandi baru.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="unified-forgot-email"
                      className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Email Terdaftar
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-600/70"
                        aria-hidden="true"
                      />
                      <input
                        id="unified-forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setForgotError(null);
                        }}
                        placeholder="nama@email.com"
                        className="min-h-[48px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <p
                      role="alert"
                      className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{forgotError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={forgotBusy}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 px-5 text-sm font-bold text-white shadow-md shadow-purple-700/20 disabled:opacity-70 cursor-pointer"
                  >
                    {forgotBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    )}
                    <span>{forgotBusy ? 'Mengirim OTP...' : 'Kirim Kode OTP ke Email'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmForgotReset} className="space-y-3.5" noValidate>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                      Buat Kata Sandi Baru
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Verifikasi kode OTP dari{' '}
                      <span className="font-semibold text-purple-800 dark:text-amber-300">
                        {maskEmailAddress(forgotEmail)}
                      </span>{' '}
                      lalu masukkan kata sandi baru Anda.
                    </p>
                  </div>

                  {forgotDeliveryNote && (
                    <div
                      role="status"
                      className="rounded-2xl border border-purple-200 bg-purple-50 px-3.5 py-2.5 text-xs text-purple-900 dark:border-purple-900/60 dark:bg-purple-950/50 dark:text-purple-200"
                    >
                      <p>{forgotDeliveryNote}</p>
                      {forgotSimulationCode && (
                        <p className="mt-1.5 font-mono-num font-bold text-amber-800 dark:text-amber-300">
                          Kode OTP Simulasi (SMTP belum aktif): {forgotSimulationCode}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="unified-forgot-otp"
                      className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Kode OTP 6 Digit
                    </label>
                    <input
                      id="unified-forgot-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={forgotOtpCode}
                      onChange={(e) => {
                        setForgotOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setForgotError(null);
                      }}
                      placeholder="000000"
                      className="min-h-[48px] w-full rounded-2xl border border-purple-300 bg-purple-50/40 px-4 text-center font-mono-num text-lg font-bold tracking-[0.4em] text-purple-950 outline-none focus:border-purple-700 focus:bg-white dark:border-purple-800 dark:bg-slate-950 dark:text-amber-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="unified-forgot-new-pass"
                        className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Kata Sandi Baru (Min. {forgotTargetKind === 'admin' ? 8 : 6} karakter)
                      </label>
                      <div className="relative">
                        <input
                          id="unified-forgot-new-pass"
                          type={showForgotPassword ? 'text' : 'password'}
                          value={forgotNewPassword}
                          onChange={(e) => {
                            setForgotNewPassword(e.target.value);
                            setForgotError(null);
                          }}
                          placeholder="Kata sandi baru"
                          className="min-h-[46px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 px-3.5 pr-10 text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword((prev) => !prev)}
                          aria-label={showForgotPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                        >
                          {showForgotPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="unified-forgot-confirm-pass"
                        className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Konfirmasi Kata Sandi
                      </label>
                      <input
                        id="unified-forgot-confirm-pass"
                        type={showForgotPassword ? 'text' : 'password'}
                        value={forgotConfirmPassword}
                        onChange={(e) => {
                          setForgotConfirmPassword(e.target.value);
                          setForgotError(null);
                        }}
                        placeholder="Ulangi kata sandi baru"
                        className="min-h-[46px] w-full rounded-2xl border border-purple-200 bg-purple-50/30 px-3.5 text-sm text-slate-900 outline-none focus:border-purple-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <p
                      role="alert"
                      className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{forgotError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={forgotBusy}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 px-5 text-sm font-bold text-white shadow-md disabled:opacity-70 cursor-pointer"
                  >
                    {forgotBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <KeyRound className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    )}
                    <span>{forgotBusy ? 'Memproses...' : 'Simpan Kata Sandi Baru'}</span>
                  </button>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setForgotStep('email')}
                      className="font-semibold text-slate-600 hover:text-purple-700 dark:text-slate-400 dark:hover:text-amber-300 cursor-pointer"
                    >
                      Ganti email
                    </button>
                    <button
                      type="button"
                      disabled={forgotBusy}
                      onClick={() => void requestForgotOtp()}
                      className="font-semibold text-purple-700 hover:underline dark:text-amber-300 cursor-pointer"
                    >
                      Kirim ulang OTP
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Modal Popup Server Gangguan / Down untuk Akun Terpilih */}
      {maintenanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => setMaintenanceModal(null)}
          role="presentation"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="server-down-modal-title"
            aria-describedby="server-down-modal-desc"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/80 bg-white shadow-2xl dark:border-amber-700/60 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-purple-950 via-purple-800 to-amber-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                  <ServerCrash className="h-6 w-6 text-amber-300" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Pemberitahuan Layanan
                  </p>
                  <h2
                    id="server-down-modal-title"
                    className="font-display text-lg font-bold leading-snug text-white"
                  >
                    {maintenanceModal.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceModal(null)}
                aria-label="Tutup pemberitahuan gangguan server"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/80 hover:bg-white/15 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Akses dashboard untuk akun {maintenanceModal.accountName} ditangguhkan sementara.
                  </p>
                  <p id="server-down-modal-desc" className="leading-relaxed">
                    {maintenanceModal.message}
                  </p>
                </div>
              </div>

              {maintenanceModal.eta && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {maintenanceModal.eta}
                </p>
              )}

              <button
                type="button"
                onClick={() => setMaintenanceModal(null)}
                className="flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-purple-800 px-5 text-sm font-bold text-white hover:bg-purple-900 dark:bg-purple-600 dark:hover:bg-purple-500 cursor-pointer"
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
