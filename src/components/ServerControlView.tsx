'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  Server,
  ServerCrash,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import type {
  AdminCreateInput,
  AdminRoleAccount,
  AdminUserRecord,
  ServerControlSettings,
} from '@/src/lib/dashboard-schema';
import { getRegularAdminAccounts } from '@/src/lib/platform-auth';
import { cn, formatNumber } from '@/src/lib/utils';

interface ServerControlViewProps {
  currentAdminId: string;
  adminAccounts: ReadonlyArray<AdminRoleAccount>;
  members: ReadonlyArray<AdminUserRecord>;
  serverControl: ServerControlSettings;
  onToggleBlockedAdmin: (targetAdminId: string) => string | null;
  onToggleBlockedMember: (targetMemberId: string) => string | null;
  onToggleAllowAdminCreateAdmin: () => string | null;
  onSaveMaintenanceCopy: (payload: {
    title: string;
    message: string;
    eta: string;
  }) => string | null;
  onCreateRegularAdmin: (input: AdminCreateInput) => string | null;
  onToggleAdminStatus: (targetAdminId: string) => string | null;
  onDeleteRegularAdmin: (targetAdminId: string) => string | null;
}

export function ServerControlView({
  currentAdminId,
  adminAccounts,
  members,
  serverControl,
  onToggleBlockedAdmin,
  onToggleBlockedMember,
  onToggleAllowAdminCreateAdmin,
  onSaveMaintenanceCopy,
  onCreateRegularAdmin,
  onToggleAdminStatus,
  onDeleteRegularAdmin,
}: ServerControlViewProps) {
  const regularAdmins = useMemo(
    () => getRegularAdminAccounts(adminAccounts),
    [adminAccounts]
  );

  // Form tambah admin biasa
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [adminFormFeedback, setAdminFormFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Member filter & search
  const [memberQuery, setMemberQuery] = useState('');
  const [memberBlockFilter, setMemberBlockFilter] = useState<'semua' | 'terblokir' | 'normal'>('semua');

  // Maintenance popup editor
  const [maintenanceTitle, setMaintenanceTitle] = useState(serverControl.maintenanceTitle);
  const [maintenanceMessage, setMaintenanceMessage] = useState(serverControl.maintenanceMessage);
  const [maintenanceEta, setMaintenanceEta] = useState(serverControl.maintenanceEta);
  const [copyFeedback, setCopyFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    return members.filter((member) => {
      const isBlocked = serverControl.blockedMemberIds.includes(member.id);
      if (memberBlockFilter === 'terblokir' && !isBlocked) return false;
      if (memberBlockFilter === 'normal' && isBlocked) return false;
      if (!q) return true;
      return (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.phone.toLowerCase().includes(q) ||
        String(member.userNumber).includes(q)
      );
    });
  }, [members, memberQuery, memberBlockFilter, serverControl.blockedMemberIds]);

  const handleCreateAdminSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = onCreateRegularAdmin({
      name: newName,
      email: newEmail,
      password: newPassword,
      confirmPassword: newConfirmPassword,
    });
    if (error) {
      setAdminFormFeedback({ type: 'error', message: error });
      return;
    }
    setAdminFormFeedback({
      type: 'success',
      message: `Akun Admin biasa (${newName.trim()}) berhasil ditambahkan.`,
    });
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewConfirmPassword('');
  };

  const handleSaveMaintenanceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = onSaveMaintenanceCopy({
      title: maintenanceTitle,
      message: maintenanceMessage,
      eta: maintenanceEta,
    });
    if (error) {
      setCopyFeedback({ type: 'error', message: error });
      return;
    }
    setCopyFeedback({
      type: 'success',
      message: 'Pesan modal popup gangguan server berhasil disimpan.',
    });
  };

  const blockedAdminsCount = regularAdmins.filter((a) =>
    serverControl.blockedAdminIds.includes(a.id)
  ).length;
  const blockedMembersCount = members.filter((m) =>
    serverControl.blockedMemberIds.includes(m.id)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Menu Server &amp; Kontrol Akses (Super Admin)
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pilih akun Admin atau Member tertentu yang terdampak gangguan server saat login, kelola akun Admin biasa, dan atur izin penambahan akun Admin.
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Admin Terdampak Gangguan
            </p>
            <p
              className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="server-blocked-admin-count"
            >
              {formatNumber(blockedAdminsCount)}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / {formatNumber(regularAdmins.length)} admin biasa
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Member Terdampak Gangguan
            </p>
            <p
              className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
              data-testid="server-blocked-member-count"
            >
              {formatNumber(blockedMembersCount)}{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / {formatNumber(members.length)} member
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Izin Admin Tambah Akun Admin
            </p>
            <p className="mt-1 text-xl font-bold text-purple-800 dark:text-amber-300">
              {serverControl.allowAdminCreateAdmin ? 'Diizinkan (ON)' : 'Dibatasi (OFF)'}
            </p>
          </CardContent>
        </Card>
      </div>

      {actionFeedback && (
        <div
          role={actionFeedback.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm',
            actionFeedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
          )}
        >
          {actionFeedback.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Row 1: Admin Permission Toggle + Popup Gangguan Editor */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-purple-700 dark:text-amber-300" aria-hidden="true" />
              <span>Izin Role Admin Biasa</span>
            </CardTitle>
            <CardDescription>
              Secara bawaan, Admin tidak melihat akun Super Admin, tidak memiliki Menu Server, dan tidak dapat menambah akun Admin baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Izinkan Admin Tambah Akun Admin
                </p>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Aktifkan untuk menampilkan menu &quot;Kelola Admin&quot; pada dashboard Admin biasa (tetap tanpa melihat akun Super Admin maupun Menu Server).
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={serverControl.allowAdminCreateAdmin}
                aria-label="Izinkan akun Admin menambah akun Admin biasa"
                data-testid="toggle-allow-admin-create-admin"
                onClick={() => {
                  const err = onToggleAllowAdminCreateAdmin();
                  if (err) {
                    setActionFeedback({ type: 'error', message: err });
                  } else {
                    setActionFeedback({
                      type: 'success',
                      message: !serverControl.allowAdminCreateAdmin
                        ? 'Admin biasa kini diizinkan mengakses menu tambah akun Admin.'
                        : 'Izin tambah akun Admin untuk Admin biasa dinonaktifkan.',
                    });
                  }
                }}
                className={cn(
                  'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40',
                  serverControl.allowAdminCreateAdmin
                    ? 'border-purple-600 bg-purple-600'
                    : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform',
                    serverControl.allowAdminCreateAdmin ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="rounded-xl border border-purple-200/80 bg-purple-50/60 p-4 text-xs text-purple-950 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-100">
              <p className="font-semibold">Kapasitas Role Terkunci:</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-purple-900/90 dark:text-purple-200/90">
                <li>
                  <span className="font-semibold">Super Admin:</span> Maksimal 1 akun utama (tidak dapat ditambah/diblokir).
                </li>
                <li>
                  <span className="font-semibold">Admin:</span> Hanya melihat sesama Admin biasa, tanpa Menu Server.
                </li>
                <li>
                  <span className="font-semibold">Member:</span> Diarahkan otomatis ke aplikasi Member saat login.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ServerCrash className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>Konfigurasi Modal Popup Gangguan / Down</span>
            </CardTitle>
            <CardDescription>
              Atur isi pesan popup yang muncul saat akun Admin atau Member terpilih mencoba login selama mode gangguan aktif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveMaintenanceSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="server-maintenance-title"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Judul Popup
                </label>
                <Input
                  id="server-maintenance-title"
                  type="text"
                  value={maintenanceTitle}
                  onChange={(e) => {
                    setMaintenanceTitle(e.target.value);
                    setCopyFeedback(null);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="server-maintenance-message"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Pesan Penjelasan ke Pengguna
                </label>
                <textarea
                  id="server-maintenance-message"
                  rows={3}
                  value={maintenanceMessage}
                  onChange={(e) => {
                    setMaintenanceMessage(e.target.value);
                    setCopyFeedback(null);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="server-maintenance-eta"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Keterangan Estimasi (Opsional)
                </label>
                <Input
                  id="server-maintenance-eta"
                  type="text"
                  value={maintenanceEta}
                  onChange={(e) => {
                    setMaintenanceEta(e.target.value);
                    setCopyFeedback(null);
                  }}
                />
              </div>

              {copyFeedback && (
                <p
                  role={copyFeedback.type === 'error' ? 'alert' : 'status'}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                    copyFeedback.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  )}
                >
                  {copyFeedback.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{copyFeedback.message}</span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <Button type="submit" variant="primary">
                  <span>Simpan Pesan Gangguan</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewModalOpen(true)}
                >
                  <span>Pratinjau Modal Gangguan</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Per-Account Server Down Control (Admin) + Add Regular Admin */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-purple-700 dark:text-amber-300" aria-hidden="true" />
              <span>Tambah Akun Admin Biasa</span>
            </CardTitle>
            <CardDescription>
              Tambahkan pengelola dengan role Admin biasa (tidak memiliki Menu Server &amp; tidak melihat akun Super Admin).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdminSubmit} className="space-y-3.5" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="server-new-admin-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Nama Lengkap Admin
                </label>
                <Input
                  id="server-new-admin-name"
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setAdminFormFeedback(null);
                  }}
                  placeholder="Contoh: Raka Aditya"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="server-new-admin-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email Login Admin
                </label>
                <Input
                  id="server-new-admin-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setAdminFormFeedback(null);
                  }}
                  placeholder="admin.baru@naturerepublic.example"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="server-new-admin-pass"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password (Min. 8 karakter)
                  </label>
                  <div className="relative">
                    <Input
                      id="server-new-admin-pass"
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setAdminFormFeedback(null);
                      }}
                      placeholder="Minimal 8 karakter"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass((p) => !p)}
                      aria-label={showNewPass ? 'Sembunyikan password' : 'Lihat password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="server-new-admin-confirm"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Konfirmasi Password
                  </label>
                  <Input
                    id="server-new-admin-confirm"
                    type={showNewPass ? 'text' : 'password'}
                    value={newConfirmPassword}
                    onChange={(e) => {
                      setNewConfirmPassword(e.target.value);
                      setAdminFormFeedback(null);
                    }}
                    placeholder="Ulangi password"
                  />
                </div>
              </div>

              {adminFormFeedback && (
                <p
                  role={adminFormFeedback.type === 'error' ? 'alert' : 'status'}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                    adminFormFeedback.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  )}
                >
                  {adminFormFeedback.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{adminFormFeedback.message}</span>
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>Tambah Akun Admin</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5 text-purple-700 dark:text-amber-300" aria-hidden="true" />
              <span>Pilih Akun Admin Terdampak Gangguan Server</span>
            </CardTitle>
            <CardDescription>
              Pilih akun Admin biasa mana saja yang akan mendapat modal popup &quot;Server Sedang Gangguan / Down&quot; saat login. Akun yang tidak dipilih tetap login normal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {regularAdmins.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-800">
                <Users className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Belum ada akun Admin biasa
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Tambahkan akun Admin baru melalui formulir di samping.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {regularAdmins.map((admin) => {
                  const isServerBlocked = serverControl.blockedAdminIds.includes(admin.id);
                  return (
                    <div
                      key={admin.id}
                      className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {admin.name}
                          </span>
                          <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                            {admin.id}
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              isServerBlocked
                                ? 'text-amber-700 dark:text-amber-400'
                                : admin.isActive
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {isServerBlocked
                              ? 'Gangguan Server (Terblokir)'
                              : admin.isActive
                                ? 'Normal'
                                : 'Akun Nonaktif'}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {admin.email} · Dibuat {admin.createdAt}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isServerBlocked}
                          aria-label={`Aktifkan gangguan server untuk ${admin.name}`}
                          data-testid={`block-admin-${admin.id}`}
                          onClick={() => {
                            const err = onToggleBlockedAdmin(admin.id);
                            if (err) {
                              setActionFeedback({ type: 'error', message: err });
                            } else {
                              setActionFeedback({
                                type: 'success',
                                message: !isServerBlocked
                                  ? `Login ${admin.name} kini menampilkan modal gangguan server.`
                                  : `Akses login ${admin.name} dikembalikan normal.`,
                              });
                            }
                          }}
                          className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer',
                            isServerBlocked
                              ? 'border-amber-500 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                          )}
                        >
                          <ServerCrash className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{isServerBlocked ? 'Mode Gangguan ON' : 'Tandai Gangguan'}</span>
                        </button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleAdminStatus(admin.id)}
                        >
                          {admin.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>

                        {admin.id !== currentAdminId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const err = onDeleteRegularAdmin(admin.id);
                              if (err) {
                                setActionFeedback({ type: 'error', message: err });
                              } else {
                                setActionFeedback({
                                  type: 'success',
                                  message: `Akun Admin ${admin.name} telah dihapus.`,
                                });
                              }
                            }}
                            aria-label={`Hapus akun admin ${admin.name}`}
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Per-Account Server Down Control (Member) */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-purple-700 dark:text-amber-300" aria-hidden="true" />
              <span>Pilih Akun Member Terdampak Gangguan Server</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Blokir login hanya untuk member tertentu yang dipilih dengan modal popup &quot;Server Sedang Gangguan / Down&quot;. Member lain tetap dapat masuk dan bertransaksi normal.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Cari nama, email, no. HP..."
                aria-label="Cari akun member untuk pengaturan gangguan server"
                className="pl-9"
              />
            </div>
            <div
              role="group"
              aria-label="Filter status gangguan member"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
            >
              {(
                [
                  { id: 'semua', label: 'Semua' },
                  { id: 'terblokir', label: 'Gangguan' },
                  { id: 'normal', label: 'Normal' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={memberBlockFilter === opt.id}
                  onClick={() => setMemberBlockFilter(opt.id)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                    memberBlockFilter === opt.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-800">
              <Users className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada member yang sesuai filter
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ubah kata kunci pencarian atau pilih filter &quot;Semua&quot;.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredMembers.map((member) => {
                const isBlocked = serverControl.blockedMemberIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-num text-xs font-semibold text-purple-700 dark:text-amber-300">
                          #{member.userNumber}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {member.name}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            isBlocked
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          )}
                        >
                          {isBlocked ? 'Gangguan Server (Terblokir)' : 'Login Normal'}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {member.email} · {member.phone}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isBlocked}
                      aria-label={`Aktifkan gangguan server untuk member ${member.name}`}
                      data-testid={`block-member-${member.id}`}
                      onClick={() => {
                        const err = onToggleBlockedMember(member.id);
                        if (err) {
                          setActionFeedback({ type: 'error', message: err });
                        } else {
                          setActionFeedback({
                            type: 'success',
                            message: !isBlocked
                              ? `Member ${member.name} kini terdampak modal gangguan server saat login.`
                              : `Akses login member ${member.name} dikembalikan normal.`,
                          });
                        }
                      }}
                      className={cn(
                        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-center',
                        isBlocked
                          ? 'border-amber-500 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                      )}
                    >
                      <ServerCrash className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isBlocked ? 'Mode Gangguan ON' : 'Tandai Gangguan'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal Gangguan */}
      {previewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-server-down-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/80 bg-white shadow-2xl dark:border-amber-700/60 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3 bg-gradient-to-r from-purple-950 via-purple-800 to-amber-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <ServerCrash className="h-6 w-6 text-amber-300" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Pratinjau Popup
                  </p>
                  <h2 id="preview-server-down-title" className="font-display text-lg font-bold text-white">
                    {maintenanceTitle || serverControl.maintenanceTitle}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                aria-label="Tutup pratinjau"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/15 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <p className="leading-relaxed">
                  {maintenanceMessage || serverControl.maintenanceMessage}
                </p>
              </div>
              {(maintenanceEta || serverControl.maintenanceEta) && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {maintenanceEta || serverControl.maintenanceEta}
                </p>
              )}
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => setPreviewModalOpen(false)}
              >
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
