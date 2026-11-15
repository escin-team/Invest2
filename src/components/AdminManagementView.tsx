'use client';

import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import type { AdminCreateInput, AdminRoleAccount } from '@/src/lib/dashboard-schema';
import { cn, formatNumber } from '@/src/lib/utils';

interface AdminManagementViewProps {
  currentAdminId: string;
  visibleAdmins: ReadonlyArray<AdminRoleAccount>;
  onCreateRegularAdmin: (input: AdminCreateInput) => string | null;
  onToggleAdminStatus: (targetAdminId: string) => string | null;
}

export function AdminManagementView({
  currentAdminId,
  visibleAdmins,
  onCreateRegularAdmin,
  onToggleAdminStatus,
}: AdminManagementViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = onCreateRegularAdmin({
      name,
      email,
      password,
      confirmPassword,
    });
    if (error) {
      setFeedback({ type: 'error', message: error });
      return;
    }
    setFeedback({
      type: 'success',
      message: `Akun Admin (${name.trim()}) berhasil ditambahkan.`,
    });
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Kelola Akun Admin
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Tambahkan atau kelola akun pengelola dengan role Admin operasional.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-purple-700 dark:text-amber-300" aria-hidden="true" />
              <span>Tambah Akun Admin</span>
            </CardTitle>
            <CardDescription>
              Akun baru otomatis memiliki role Admin operasional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="kelola-admin-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Nama Lengkap Admin
                </label>
                <Input
                  id="kelola-admin-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="Contoh: Nadia Pramesti"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="kelola-admin-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email Admin
                </label>
                <Input
                  id="kelola-admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="admin.tim@naturerepublic.example"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="kelola-admin-pass"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password (Min. 8 karakter)
                </label>
                <div className="relative">
                  <Input
                    id="kelola-admin-pass"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFeedback(null);
                    }}
                    placeholder="Minimal 8 karakter"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    aria-label={showPass ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="kelola-admin-confirm"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Konfirmasi Password
                </label>
                <Input
                  id="kelola-admin-confirm"
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="Ulangi password"
                />
              </div>

              {feedback && (
                <p
                  role={feedback.type === 'error' ? 'alert' : 'status'}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                    feedback.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  )}
                >
                  {feedback.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{feedback.message}</span>
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>Simpan Akun Admin</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-purple-700 dark:text-amber-300" aria-hidden="true" />
              <span>Daftar Akun Admin ({formatNumber(visibleAdmins.length)})</span>
            </CardTitle>
            <CardDescription>
              Akun pengelola operasional yang aktif membantu pengelolaan dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visibleAdmins.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-800">
                <Users className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Belum ada akun Admin terdaftar
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {visibleAdmins.map((admin) => (
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
                            admin.isActive
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {admin.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {admin.email} · {admin.role} · Dibuat {admin.createdAt}
                      </p>
                    </div>

                    {admin.id !== currentAdminId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleAdminStatus(admin.id)}
                      >
                        {admin.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
