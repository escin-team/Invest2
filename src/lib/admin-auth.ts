import { DEFAULT_ADMIN_SESSION } from './dashboard-data';
import {
  AdminForgotResetInputSchema,
  AdminLoginInputSchema,
  AdminPasswordChangeSchema,
  type AdminForgotResetInput,
  type AdminLoginInput,
  type AdminPasswordChangeInput,
  type AdminSession,
} from './dashboard-schema';

// Kredensial demo Fase A in-memory; pada Fase B wajib diganti sesi server terverifikasi.
export const DEMO_ADMIN_PASSWORD = 'FinVault#Demo2026';

export interface AdminAccountState {
  session: AdminSession;
  password: string;
  avatarUrl: string | null;
  passwordUpdatedAt: string | null;
}

export function createInitialAdminAccount(): AdminAccountState {
  return {
    session: { ...DEFAULT_ADMIN_SESSION },
    password: DEMO_ADMIN_PASSWORD,
    avatarUrl: null,
    passwordUpdatedAt: null,
  };
}

export function getAdminInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'AD';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function verifyAdminLogin(
  account: AdminAccountState,
  input: AdminLoginInput
): { success: true; session: AdminSession } | { success: false; error: string } {
  const parsed = AdminLoginInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Email atau password tidak valid.',
    };
  }

  const normalizedInputEmail = parsed.data.email.toLowerCase();
  const normalizedAccountEmail = account.session.email.toLowerCase();

  if (
    normalizedInputEmail !== normalizedAccountEmail ||
    parsed.data.password !== account.password
  ) {
    return {
      success: false,
      error: 'Email atau password admin tidak cocok.',
    };
  }

  return {
    success: true,
    session: { ...account.session },
  };
}

export function changeAdminPassword(
  account: AdminAccountState,
  input: AdminPasswordChangeInput,
  updatedAtIso = new Date().toISOString()
): { success: true; account: AdminAccountState } | { success: false; error: string } {
  const parsed = AdminPasswordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Input perubahan password tidak valid.',
    };
  }

  if (parsed.data.currentPassword !== account.password) {
    return {
      success: false,
      error: 'Password saat ini tidak sesuai.',
    };
  }

  return {
    success: true,
    account: {
      ...account,
      password: parsed.data.newPassword,
      passwordUpdatedAt: updatedAtIso,
    },
  };
}

export function resetAdminPasswordByEmail(
  account: AdminAccountState,
  input: AdminForgotResetInput,
  updatedAtIso = new Date().toISOString()
): { success: true; account: AdminAccountState } | { success: false; error: string } {
  const parsed = AdminForgotResetInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Input reset password admin tidak valid.',
    };
  }

  if (parsed.data.email.trim().toLowerCase() !== account.session.email.trim().toLowerCase()) {
    return {
      success: false,
      error: 'Email tidak terdaftar sebagai akun Admin Nature Republic.',
    };
  }

  return {
    success: true,
    account: {
      ...account,
      password: parsed.data.newPassword,
      passwordUpdatedAt: updatedAtIso,
    },
  };
}

export function updateAdminAvatar(
  account: AdminAccountState,
  avatarUrl: string | null
): AdminAccountState {
  return {
    ...account,
    avatarUrl,
  };
}

