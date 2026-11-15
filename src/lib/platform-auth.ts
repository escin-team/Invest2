import { DEMO_ADMIN_PASSWORD, type AdminAccountState } from './admin-auth';
import {
  ActivePlatformSessionSchema,
  AdminCreateInputSchema,
  AdminForgotResetInputSchema,
  AdminPasswordChangeSchema,
  AdminRoleAccountSchema,
  ServerControlSettingsSchema,
  type ActivePlatformSession,
  type AdminAccountRole,
  type AdminCreateInput,
  type AdminForgotResetInput,
  type AdminPasswordChangeInput,
  type AdminRoleAccount,
  type AdminUserRecord,
  type ServerControlSettings,
} from './dashboard-schema';
import {
  DEMO_MEMBER_DEFAULT_PASSWORD,
  findMemberByIdentifier,
  readStoredMemberPasswords,
} from './member-app';

// Kredensial demo Fase A; pada Fase B wajib diganti hash + sesi server terverifikasi.
export const DEMO_REGULAR_ADMIN_PASSWORD = 'Admin#Demo2026';

export const ADMIN_ACCOUNTS_STORAGE_KEY = 'naturerepublic_admin_accounts_v1';
const ADMIN_ACCOUNTS_UPDATED_EVENT = 'naturerepublic:admin-accounts-updated';

export const SERVER_CONTROL_STORAGE_KEY = 'naturerepublic_server_control_v1';
const SERVER_CONTROL_UPDATED_EVENT = 'naturerepublic:server-control-updated';

export const ACTIVE_SESSION_STORAGE_KEY = 'naturerepublic_active_session_v1';
const ACTIVE_SESSION_UPDATED_EVENT = 'naturerepublic:active-session-updated';

export const INITIAL_ADMIN_ACCOUNTS: ReadonlyArray<AdminRoleAccount> = [
  {
    id: 'ADM-001',
    name: 'Alfaciro Admin',
    email: 'alfaciro05@gmail.com',
    role: 'Super Admin',
    password: DEMO_ADMIN_PASSWORD,
    avatarUrl: null,
    isActive: true,
    createdAt: '2026-09-01 08:00',
    passwordUpdatedAt: null,
  },
  {
    id: 'ADM-002',
    name: 'Sari Wulandari',
    email: 'admin.keuangan@naturerepublic.example',
    role: 'Admin',
    password: DEMO_REGULAR_ADMIN_PASSWORD,
    avatarUrl: null,
    isActive: true,
    createdAt: '2026-09-12 09:15',
    passwordUpdatedAt: null,
  },
  {
    id: 'ADM-003',
    name: 'Dimas Pratama',
    email: 'admin.ops@naturerepublic.example',
    role: 'Admin',
    password: DEMO_REGULAR_ADMIN_PASSWORD,
    avatarUrl: null,
    isActive: true,
    createdAt: '2026-10-03 14:20',
    passwordUpdatedAt: null,
  },
];

export const DEFAULT_SERVER_CONTROL_SETTINGS: ServerControlSettings =
  ServerControlSettingsSchema.parse({
    blockedAdminIds: [],
    blockedMemberIds: [],
    allowAdminCreateAdmin: false,
    maintenanceTitle: 'Server Sedang Mengalami Gangguan',
    maintenanceMessage:
      'Mohon maaf, layanan server untuk akun Anda sedang mengalami gangguan atau pemeliharaan sementara. Silakan coba masuk kembali beberapa saat lagi.',
    maintenanceEta: 'Estimasi pemulihan: segera setelah pemeriksaan selesai',
    updatedAt: null,
  });

export const DEFAULT_ACTIVE_PLATFORM_SESSION: ActivePlatformSession = {
  kind: 'logged_out',
};

export function createInitialAdminAccounts(): AdminRoleAccount[] {
  return INITIAL_ADMIN_ACCOUNTS.map((item) => ({ ...item }));
}

export function createInitialServerControlSettings(): ServerControlSettings {
  return {
    ...DEFAULT_SERVER_CONTROL_SETTINGS,
    blockedAdminIds: [...DEFAULT_SERVER_CONTROL_SETTINGS.blockedAdminIds],
    blockedMemberIds: [...DEFAULT_SERVER_CONTROL_SETTINGS.blockedMemberIds],
  };
}

export function isSuperAdminRole(role: string): boolean {
  return role === 'Super Admin';
}

export function canAccessServerMenu(role: string): boolean {
  return role === 'Super Admin';
}

export function canViewerCreateAdmin(
  role: string,
  serverControl: ServerControlSettings
): boolean {
  if (role === 'Super Admin') return true;
  if (role === 'Admin') return serverControl.allowAdminCreateAdmin;
  return false;
}

export function getVisibleAdminAccountsForViewer(
  accounts: ReadonlyArray<AdminRoleAccount>,
  viewerRole: AdminAccountRole | string
): AdminRoleAccount[] {
  if (viewerRole === 'Super Admin') {
    return accounts.map((item) => ({ ...item }));
  }
  // Admin biasa tidak boleh melihat akun Super Admin
  return accounts
    .filter((item) => item.role !== 'Super Admin')
    .map((item) => ({ ...item }));
}

export function getRegularAdminAccounts(
  accounts: ReadonlyArray<AdminRoleAccount>
): AdminRoleAccount[] {
  return accounts
    .filter((item) => item.role !== 'Super Admin')
    .map((item) => ({ ...item }));
}

export function toAdminAccountState(account: AdminRoleAccount): AdminAccountState {
  return {
    session: {
      userId: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      sessionId: `nr_sess_${account.id.toLowerCase()}`,
    },
    password: account.password,
    avatarUrl: account.avatarUrl,
    passwordUpdatedAt: account.passwordUpdatedAt,
  };
}

function nextAdminId(accounts: ReadonlyArray<AdminRoleAccount>): string {
  let maxNumber = 0;
  for (const item of accounts) {
    const match = /^ADM-(\d+)$/i.exec(item.id);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  }
  return `ADM-${String(maxNumber + 1).padStart(3, '0')}`;
}

function formatAdminTimestamp(now: Date): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function createRegularAdminAccount(params: {
  accounts: ReadonlyArray<AdminRoleAccount>;
  actorRole: AdminAccountRole | string;
  serverControl: ServerControlSettings;
  input: AdminCreateInput;
  existingMembers?: ReadonlyArray<AdminUserRecord>;
  requestedRole?: AdminAccountRole;
  now?: Date;
}): {
  accounts: AdminRoleAccount[];
  created: AdminRoleAccount | null;
  error: string | null;
} {
  const {
    accounts,
    actorRole,
    serverControl,
    input,
    existingMembers = [],
    requestedRole = 'Admin',
    now = new Date(),
  } = params;

  if (requestedRole === 'Super Admin') {
    return {
      accounts: [...accounts],
      created: null,
      error: 'Akun Super Admin dibatasi hanya 1 akun utama dan tidak dapat ditambah.',
    };
  }

  if (!canViewerCreateAdmin(actorRole, serverControl)) {
    return {
      accounts: [...accounts],
      created: null,
      error:
        'Akses tambah akun Admin belum diizinkan oleh Super Admin pada Menu Server.',
    };
  }

  const parsed = AdminCreateInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      accounts: [...accounts],
      created: null,
      error: parsed.error.issues[0]?.message ?? 'Data akun admin tidak valid.',
    };
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  if (accounts.some((a) => a.email.trim().toLowerCase() === normalizedEmail)) {
    return {
      accounts: [...accounts],
      created: null,
      error: 'Email ini sudah terdaftar sebagai akun Admin.',
    };
  }
  if (existingMembers.some((m) => m.email.trim().toLowerCase() === normalizedEmail)) {
    return {
      accounts: [...accounts],
      created: null,
      error: 'Email ini sudah digunakan oleh akun Member.',
    };
  }

  const created = AdminRoleAccountSchema.parse({
    id: nextAdminId(accounts),
    name: parsed.data.name.trim(),
    email: normalizedEmail,
    role: 'Admin',
    password: parsed.data.password,
    avatarUrl: null,
    isActive: true,
    createdAt: formatAdminTimestamp(now),
    passwordUpdatedAt: null,
  });

  return {
    accounts: [...accounts, created],
    created,
    error: null,
  };
}

export function toggleAdminAccountStatus(params: {
  accounts: ReadonlyArray<AdminRoleAccount>;
  actorRole: AdminAccountRole | string;
  serverControl: ServerControlSettings;
  targetAdminId: string;
}): { accounts: AdminRoleAccount[]; error: string | null } {
  const { accounts, actorRole, serverControl, targetAdminId } = params;
  if (!canViewerCreateAdmin(actorRole, serverControl)) {
    return {
      accounts: [...accounts],
      error: 'Anda tidak memiliki izin untuk mengubah status akun Admin.',
    };
  }

  const target = accounts.find((a) => a.id === targetAdminId);
  if (!target) {
    return { accounts: [...accounts], error: 'Akun Admin tidak ditemukan.' };
  }
  if (target.role === 'Super Admin') {
    return {
      accounts: [...accounts],
      error: 'Akun Super Admin tidak dapat dinonaktifkan.',
    };
  }

  return {
    accounts: accounts.map((a) =>
      a.id === targetAdminId ? { ...a, isActive: !a.isActive } : a
    ),
    error: null,
  };
}

export function deleteAdminAccount(params: {
  accounts: ReadonlyArray<AdminRoleAccount>;
  serverControl: ServerControlSettings;
  actorRole: AdminAccountRole | string;
  actorAdminId: string;
  targetAdminId: string;
}): {
  accounts: AdminRoleAccount[];
  serverControl: ServerControlSettings;
  error: string | null;
} {
  const { accounts, serverControl, actorRole, actorAdminId, targetAdminId } = params;
  if (actorRole !== 'Super Admin') {
    return {
      accounts: [...accounts],
      serverControl,
      error: 'Hanya Super Admin yang dapat menghapus akun Admin.',
    };
  }
  const target = accounts.find((a) => a.id === targetAdminId);
  if (!target) {
    return { accounts: [...accounts], serverControl, error: 'Akun Admin tidak ditemukan.' };
  }
  if (target.role === 'Super Admin' || target.id === actorAdminId) {
    return {
      accounts: [...accounts],
      serverControl,
      error: 'Akun Super Admin tidak dapat dihapus.',
    };
  }

  return {
    accounts: accounts.filter((a) => a.id !== targetAdminId),
    serverControl: {
      ...serverControl,
      blockedAdminIds: serverControl.blockedAdminIds.filter((id) => id !== targetAdminId),
    },
    error: null,
  };
}

export function changeAdminAccountPasswordById(
  accounts: ReadonlyArray<AdminRoleAccount>,
  adminId: string,
  input: AdminPasswordChangeInput,
  updatedAtIso = new Date().toISOString()
): { accounts: AdminRoleAccount[]; error: string | null } {
  const target = accounts.find((a) => a.id === adminId);
  if (!target) {
    return { accounts: [...accounts], error: 'Akun admin tidak ditemukan.' };
  }
  const parsed = AdminPasswordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      accounts: [...accounts],
      error: parsed.error.issues[0]?.message ?? 'Input perubahan password tidak valid.',
    };
  }
  if (parsed.data.currentPassword !== target.password) {
    return { accounts: [...accounts], error: 'Password saat ini tidak sesuai.' };
  }
  return {
    accounts: accounts.map((a) =>
      a.id === adminId
        ? {
            ...a,
            password: parsed.data.newPassword,
            passwordUpdatedAt: updatedAtIso,
          }
        : a
    ),
    error: null,
  };
}

export function updateAdminAccountAvatarById(
  accounts: ReadonlyArray<AdminRoleAccount>,
  adminId: string,
  avatarUrl: string | null
): AdminRoleAccount[] {
  return accounts.map((a) => (a.id === adminId ? { ...a, avatarUrl } : a));
}

export function resetAnyAdminPasswordByEmail(
  accounts: ReadonlyArray<AdminRoleAccount>,
  input: AdminForgotResetInput,
  updatedAtIso = new Date().toISOString()
): { accounts: AdminRoleAccount[]; updatedAdmin: AdminRoleAccount | null; error: string | null } {
  const parsed = AdminForgotResetInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      accounts: [...accounts],
      updatedAdmin: null,
      error: parsed.error.issues[0]?.message ?? 'Input reset password admin tidak valid.',
    };
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const target = accounts.find((a) => a.email.trim().toLowerCase() === normalizedEmail);
  if (!target) {
    return {
      accounts: [...accounts],
      updatedAdmin: null,
      error: 'Email tidak terdaftar pada sistem.',
    };
  }

  const nextAccount: AdminRoleAccount = {
    ...target,
    password: parsed.data.newPassword,
    passwordUpdatedAt: updatedAtIso,
  };

  return {
    accounts: accounts.map((a) => (a.id === target.id ? nextAccount : a)),
    updatedAdmin: nextAccount,
    error: null,
  };
}

export function toggleBlockedAdminAccount(params: {
  settings: ServerControlSettings;
  accounts: ReadonlyArray<AdminRoleAccount>;
  actorRole: AdminAccountRole | string;
  targetAdminId: string;
  updatedAtIso?: string;
}): { settings: ServerControlSettings; error: string | null } {
  const {
    settings,
    accounts,
    actorRole,
    targetAdminId,
    updatedAtIso = new Date().toISOString(),
  } = params;

  if (actorRole !== 'Super Admin') {
    return {
      settings,
      error: 'Hanya Super Admin yang dapat mengubah status gangguan akun Admin.',
    };
  }
  const target = accounts.find((a) => a.id === targetAdminId);
  if (!target) {
    return { settings, error: 'Akun Admin tidak ditemukan.' };
  }
  if (target.role === 'Super Admin') {
    return {
      settings,
      error: 'Akun Super Admin tidak dapat diblokir dari Menu Server.',
    };
  }

  const exists = settings.blockedAdminIds.includes(targetAdminId);
  const blockedAdminIds = exists
    ? settings.blockedAdminIds.filter((id) => id !== targetAdminId)
    : [...settings.blockedAdminIds, targetAdminId];

  return {
    settings: {
      ...settings,
      blockedAdminIds,
      updatedAt: updatedAtIso,
    },
    error: null,
  };
}

export function toggleBlockedMemberAccount(params: {
  settings: ServerControlSettings;
  members: ReadonlyArray<AdminUserRecord>;
  actorRole: AdminAccountRole | string;
  targetMemberId: string;
  updatedAtIso?: string;
}): { settings: ServerControlSettings; error: string | null } {
  const {
    settings,
    members,
    actorRole,
    targetMemberId,
    updatedAtIso = new Date().toISOString(),
  } = params;

  if (actorRole !== 'Super Admin') {
    return {
      settings,
      error: 'Hanya Super Admin yang dapat mengubah status gangguan akun Member.',
    };
  }
  const target = members.find((m) => m.id === targetMemberId);
  if (!target) {
    return { settings, error: 'Akun Member tidak ditemukan.' };
  }

  const exists = settings.blockedMemberIds.includes(targetMemberId);
  const blockedMemberIds = exists
    ? settings.blockedMemberIds.filter((id) => id !== targetMemberId)
    : [...settings.blockedMemberIds, targetMemberId];

  return {
    settings: {
      ...settings,
      blockedMemberIds,
      updatedAt: updatedAtIso,
    },
    error: null,
  };
}

export function toggleAllowAdminCreateAdmin(params: {
  settings: ServerControlSettings;
  actorRole: AdminAccountRole | string;
  updatedAtIso?: string;
}): { settings: ServerControlSettings; error: string | null } {
  const { settings, actorRole, updatedAtIso = new Date().toISOString() } = params;
  if (actorRole !== 'Super Admin') {
    return {
      settings,
      error: 'Hanya Super Admin yang dapat mengatur izin tambah Admin.',
    };
  }
  return {
    settings: {
      ...settings,
      allowAdminCreateAdmin: !settings.allowAdminCreateAdmin,
      updatedAt: updatedAtIso,
    },
    error: null,
  };
}

export function updateMaintenanceModalCopy(params: {
  settings: ServerControlSettings;
  actorRole: AdminAccountRole | string;
  title: string;
  message: string;
  eta: string;
  updatedAtIso?: string;
}): { settings: ServerControlSettings; error: string | null } {
  const {
    settings,
    actorRole,
    title,
    message,
    eta,
    updatedAtIso = new Date().toISOString(),
  } = params;
  if (actorRole !== 'Super Admin') {
    return {
      settings,
      error: 'Hanya Super Admin yang dapat mengubah pesan modal gangguan server.',
    };
  }
  const parsed = ServerControlSettingsSchema.safeParse({
    ...settings,
    maintenanceTitle: title,
    maintenanceMessage: message,
    maintenanceEta: eta,
    updatedAt: updatedAtIso,
  });
  if (!parsed.success) {
    return {
      settings,
      error: parsed.error.issues[0]?.message ?? 'Pesan modal gangguan tidak valid.',
    };
  }
  return { settings: parsed.data, error: null };
}

export type UnifiedLoginResult =
  | { status: 'admin_authenticated'; admin: AdminRoleAccount }
  | { status: 'member_authenticated'; member: AdminUserRecord }
  | {
      status: 'server_blocked';
      targetRole: 'Admin' | 'Member';
      accountName: string;
      title: string;
      message: string;
      eta: string;
    }
  | { status: 'error'; error: string };

export function resolveUnifiedLogin(params: {
  identifier: string;
  password: string;
  adminAccounts: ReadonlyArray<AdminRoleAccount>;
  members: ReadonlyArray<AdminUserRecord>;
  serverControl: ServerControlSettings;
  customMemberPasswords?: Record<string, string>;
}): UnifiedLoginResult {
  const {
    identifier,
    password,
    adminAccounts,
    members,
    serverControl,
    customMemberPasswords,
  } = params;

  const trimmedId = identifier.trim();
  if (!trimmedId) {
    return {
      status: 'error',
      error: 'Masukkan email atau nomor HP terdaftar Anda.',
    };
  }
  if (!password || password.length < 4) {
    return {
      status: 'error',
      error: 'Kata sandi wajib diisi minimal 4 karakter.',
    };
  }

  // 1. Cek akun pengelola (Super Admin / Admin) berdasarkan email
  const normalizedEmail = trimmedId.toLowerCase();
  const matchedAdmin = adminAccounts.find(
    (a) => a.email.trim().toLowerCase() === normalizedEmail
  );

  if (matchedAdmin) {
    if (!matchedAdmin.isActive) {
      return {
        status: 'error',
        error: 'Akun Admin ini sedang dinonaktifkan oleh Super Admin.',
      };
    }
    if (password !== matchedAdmin.password) {
      return {
        status: 'error',
        error: 'Email atau kata sandi tidak sesuai.',
      };
    }
    if (
      matchedAdmin.role !== 'Super Admin' &&
      serverControl.blockedAdminIds.includes(matchedAdmin.id)
    ) {
      return {
        status: 'server_blocked',
        targetRole: 'Admin',
        accountName: matchedAdmin.name,
        title: serverControl.maintenanceTitle,
        message: serverControl.maintenanceMessage,
        eta: serverControl.maintenanceEta,
      };
    }
    return { status: 'admin_authenticated', admin: matchedAdmin };
  }

  // 2. Cek akun Member berdasarkan email atau nomor HP
  const matchedMember = findMemberByIdentifier(members, trimmedId);
  if (!matchedMember) {
    return {
      status: 'error',
      error:
        'Akun tidak ditemukan. Periksa kembali email/nomor HP atau daftar akun baru.',
    };
  }

  if (matchedMember.accountStatus !== 'aktif') {
    return {
      status: 'error',
      error: 'Akun member ini sedang dinonaktifkan oleh pengelola.',
    };
  }

  const passwordMap = customMemberPasswords ?? readStoredMemberPasswords();
  const expectedPassword =
    passwordMap[matchedMember.email.toLowerCase()] ?? DEMO_MEMBER_DEFAULT_PASSWORD;
  if (password !== expectedPassword) {
    return {
      status: 'error',
      error: 'Email/nomor HP atau kata sandi tidak sesuai.',
    };
  }

  if (serverControl.blockedMemberIds.includes(matchedMember.id)) {
    return {
      status: 'server_blocked',
      targetRole: 'Member',
      accountName: matchedMember.name,
      title: serverControl.maintenanceTitle,
      message: serverControl.maintenanceMessage,
      eta: serverControl.maintenanceEta,
    };
  }

  return { status: 'member_authenticated', member: matchedMember };
}

// =============================================================================
// Shared localStorage Stores (SSR-Safe useSyncExternalStore snapshots)
// =============================================================================

let cachedRawAdminAccountsJson: string | null = null;
let cachedAdminAccountsSnapshot: AdminRoleAccount[] = INITIAL_ADMIN_ACCOUNTS.map(
  (item) => ({ ...item })
);
const SERVER_ADMIN_ACCOUNTS_SNAPSHOT: AdminRoleAccount[] = INITIAL_ADMIN_ACCOUNTS.map(
  (item) => ({ ...item })
);

export function parseStoredAdminAccounts(
  rawJson: string | null
): AdminRoleAccount[] | null {
  if (!rawJson) return null;
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const validated: AdminRoleAccount[] = [];
    for (const item of parsed) {
      const res = AdminRoleAccountSchema.safeParse(item);
      if (!res.success) return null;
      validated.push(res.data);
    }
    const superAdmins = validated.filter((a) => a.role === 'Super Admin');
    if (superAdmins.length !== 1) return null;
    return validated;
  } catch {
    return null;
  }
}

export function getStoredAdminAccountsSnapshot(): AdminRoleAccount[] {
  if (typeof window === 'undefined') {
    return SERVER_ADMIN_ACCOUNTS_SNAPSHOT;
  }
  try {
    const raw = window.localStorage.getItem(ADMIN_ACCOUNTS_STORAGE_KEY);
    if (raw === cachedRawAdminAccountsJson) {
      return cachedAdminAccountsSnapshot;
    }
    const parsed = parseStoredAdminAccounts(raw);
    cachedRawAdminAccountsJson = raw;
    cachedAdminAccountsSnapshot = parsed ?? SERVER_ADMIN_ACCOUNTS_SNAPSHOT;
    return cachedAdminAccountsSnapshot;
  } catch {
    return SERVER_ADMIN_ACCOUNTS_SNAPSHOT;
  }
}

export function getServerAdminAccountsSnapshot(): AdminRoleAccount[] {
  return SERVER_ADMIN_ACCOUNTS_SNAPSHOT;
}

export function subscribeStoredAdminAccounts(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ADMIN_ACCOUNTS_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustom = () => onStoreChange();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(ADMIN_ACCOUNTS_UPDATED_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(ADMIN_ACCOUNTS_UPDATED_EVENT, handleCustom);
  };
}

export function saveStoredAdminAccounts(accounts: ReadonlyArray<AdminRoleAccount>): void {
  if (typeof window === 'undefined') return;
  try {
    const validated = accounts.map((a) => AdminRoleAccountSchema.parse(a));
    const json = JSON.stringify(validated);
    cachedRawAdminAccountsJson = json;
    cachedAdminAccountsSnapshot = validated;
    window.localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, json);
    window.dispatchEvent(new Event(ADMIN_ACCOUNTS_UPDATED_EVENT));
  } catch {
    // Ignore quota errors
  }
}

let cachedRawServerControlJson: string | null = null;
let cachedServerControlSnapshot: ServerControlSettings = DEFAULT_SERVER_CONTROL_SETTINGS;

export function parseStoredServerControl(
  rawJson: string | null
): ServerControlSettings | null {
  if (!rawJson) return null;
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    const res = ServerControlSettingsSchema.safeParse(parsed);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export function getStoredServerControlSnapshot(): ServerControlSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SERVER_CONTROL_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(SERVER_CONTROL_STORAGE_KEY);
    if (raw === cachedRawServerControlJson) {
      return cachedServerControlSnapshot;
    }
    const parsed = parseStoredServerControl(raw);
    cachedRawServerControlJson = raw;
    cachedServerControlSnapshot = parsed ?? DEFAULT_SERVER_CONTROL_SETTINGS;
    return cachedServerControlSnapshot;
  } catch {
    return DEFAULT_SERVER_CONTROL_SETTINGS;
  }
}

export function getServerServerControlSnapshot(): ServerControlSettings {
  return DEFAULT_SERVER_CONTROL_SETTINGS;
}

export function subscribeStoredServerControl(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SERVER_CONTROL_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustom = () => onStoreChange();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(SERVER_CONTROL_UPDATED_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SERVER_CONTROL_UPDATED_EVENT, handleCustom);
  };
}

export function saveStoredServerControl(settings: ServerControlSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const validated = ServerControlSettingsSchema.parse(settings);
    const json = JSON.stringify(validated);
    cachedRawServerControlJson = json;
    cachedServerControlSnapshot = validated;
    window.localStorage.setItem(SERVER_CONTROL_STORAGE_KEY, json);
    window.dispatchEvent(new Event(SERVER_CONTROL_UPDATED_EVENT));
  } catch {
    // Ignore quota errors
  }
}

let cachedRawActiveSessionJson: string | null = null;
let cachedActiveSessionSnapshot: ActivePlatformSession = DEFAULT_ACTIVE_PLATFORM_SESSION;

export function parseStoredActiveSession(
  rawJson: string | null
): ActivePlatformSession | null {
  if (!rawJson) return null;
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    const res = ActivePlatformSessionSchema.safeParse(parsed);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

export function getStoredActiveSessionSnapshot(): ActivePlatformSession {
  if (typeof window === 'undefined') {
    return DEFAULT_ACTIVE_PLATFORM_SESSION;
  }
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (raw === cachedRawActiveSessionJson) {
      return cachedActiveSessionSnapshot;
    }
    const parsed = parseStoredActiveSession(raw);
    cachedRawActiveSessionJson = raw;
    cachedActiveSessionSnapshot = parsed ?? DEFAULT_ACTIVE_PLATFORM_SESSION;
    return cachedActiveSessionSnapshot;
  } catch {
    return DEFAULT_ACTIVE_PLATFORM_SESSION;
  }
}

export function getServerActiveSessionSnapshot(): ActivePlatformSession {
  return DEFAULT_ACTIVE_PLATFORM_SESSION;
}

export function subscribeStoredActiveSession(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ACTIVE_SESSION_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustom = () => onStoreChange();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(ACTIVE_SESSION_UPDATED_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(ACTIVE_SESSION_UPDATED_EVENT, handleCustom);
  };
}

export function saveStoredActiveSession(session: ActivePlatformSession): void {
  if (typeof window === 'undefined') return;
  try {
    const validated = ActivePlatformSessionSchema.parse(session);
    const json = JSON.stringify(validated);
    cachedRawActiveSessionJson = json;
    cachedActiveSessionSnapshot = validated;
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, json);
    window.dispatchEvent(new Event(ACTIVE_SESSION_UPDATED_EVENT));
  } catch {
    // Ignore quota errors
  }
}
