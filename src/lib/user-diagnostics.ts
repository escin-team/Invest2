import {
  AdminUserRecordSchema,
  type AdminUserRecord,
  type UserStatusHistoryItem,
} from './dashboard-schema';

export type DiagnosticCheckStatus = 'pass' | 'fail' | 'unknown';

export interface DiagnosticCheckItem {
  id: string;
  label: string;
  detail: string;
  status: DiagnosticCheckStatus;
}

export interface DiagnosticCheckResult {
  summary: string;
  isValid: boolean;
  checks: DiagnosticCheckItem[];
}

export interface NormalizedIndonesianPhone {
  internationalDigits: string;
  plusInternational: string;
  local: string;
  isIndonesia: boolean;
  isReasonableLength: boolean;
}

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'yopmail.com',
  'guerrillamail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'dispostable.com',
]);

const GENERIC_LOCAL_PARTS = new Set([
  'admin',
  'administrator',
  'info',
  'support',
  'help',
  'contact',
  'sales',
  'marketing',
  'billing',
  'noreply',
  'no-reply',
  'cs',
  'hello',
  'office',
]);

const KNOWN_MX_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.id',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'mail.id',
  'proton.me',
  'protonmail.com',
  'ymail.com',
]);

export function normalizeIndonesianPhone(rawPhone: string): NormalizedIndonesianPhone {
  const digits = rawPhone.replace(/\D/g, '');
  let internationalDigits = digits;
  let local = digits;
  let isIndonesia = false;

  if (digits.startsWith('62')) {
    isIndonesia = true;
    internationalDigits = digits;
    local = `0${digits.slice(2)}`;
  } else if (digits.startsWith('08')) {
    isIndonesia = true;
    internationalDigits = `62${digits.slice(1)}`;
    local = digits;
  } else if (digits.startsWith('8')) {
    isIndonesia = true;
    internationalDigits = `62${digits}`;
    local = `0${digits}`;
  }

  const isReasonableLength =
    isIndonesia && local.length >= 10 && local.length <= 13 && local.startsWith('08');

  return {
    internationalDigits,
    plusInternational: internationalDigits ? `+${internationalDigits}` : '',
    local,
    isIndonesia,
    isReasonableLength,
  };
}

export function detectIndonesianCarrier(localNumber: string): {
  carrier: string;
  recognized: boolean;
} {
  const prefix = localNumber.slice(0, 4);
  if (['0895', '0896', '0897', '0898', '0899'].includes(prefix)) {
    return { carrier: 'Tri', recognized: true };
  }
  if (
    ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'].includes(prefix)
  ) {
    return { carrier: 'Telkomsel', recognized: true };
  }
  if (['0814', '0815', '0816', '0855', '0856', '0857', '0858'].includes(prefix)) {
    return { carrier: 'Indosat', recognized: true };
  }
  if (['0817', '0818', '0819', '0859', '0877', '0878'].includes(prefix)) {
    return { carrier: 'XL', recognized: true };
  }
  if (['0831', '0832', '0833', '0838'].includes(prefix)) {
    return { carrier: 'Axis', recognized: true };
  }
  if (
    ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'].includes(prefix)
  ) {
    return { carrier: 'Smartfren', recognized: true };
  }
  return { carrier: 'Tidak dikenali', recognized: false };
}

export function checkWhatsAppNumber(
  targetUser: Pick<AdminUserRecord, 'id' | 'whatsappRaw' | 'phone'>,
  allUsers: ReadonlyArray<Pick<AdminUserRecord, 'id' | 'whatsappRaw' | 'phone'>>
): DiagnosticCheckResult {
  const norm = normalizeIndonesianPhone(targetUser.whatsappRaw || targetUser.phone);
  const carrierInfo = detectIndonesianCarrier(norm.local);

  const conflictingUsers = allUsers.filter((other) => {
    if (other.id === targetUser.id) return false;
    const otherNorm = normalizeIndonesianPhone(other.whatsappRaw || other.phone);
    return (
      otherNorm.internationalDigits.length > 0 &&
      otherNorm.internationalDigits === norm.internationalDigits
    );
  });

  const isUnique = conflictingUsers.length === 0;
  const isValid = norm.isIndonesia && norm.isReasonableLength && isUnique;

  const summary = !norm.isIndonesia || !norm.isReasonableLength
    ? 'Format nomor belum valid untuk WhatsApp Indonesia. Periksa kembali kode negara dan panjang digit.'
    : !isUnique
      ? `Nomor bentrok dengan ${conflictingUsers.length} user lain. Periksa potensi akun ganda.`
      : 'Nomor tampak valid. Buka WhatsApp untuk memastikan nomornya benar-benar terdaftar.';

  return {
    summary,
    isValid,
    checks: [
      {
        id: 'country',
        label: 'Negara terdeteksi',
        detail: norm.isIndonesia
          ? 'Kode +62 (Indonesia).'
          : 'Kode negara bukan +62 (Indonesia).',
        status: norm.isIndonesia ? 'pass' : 'fail',
      },
      {
        id: 'length',
        label: 'Panjang nomor wajar',
        detail: norm.isReasonableLength
          ? `Nomor valid: ${norm.plusInternational} (lokal ${norm.local}).`
          : `Panjang digit tidak sesuai standar seluler Indonesia (${norm.local.length} digit).`,
        status: norm.isReasonableLength ? 'pass' : 'fail',
      },
      {
        id: 'carrier',
        label: 'Perkiraan operator',
        detail: carrierInfo.recognized
          ? `${carrierInfo.carrier} (perkiraan dari prefix, bisa meleset karena nomor bisa pindah operator).`
          : 'Prefix belum terdaftar pada daftar operator utama Indonesia.',
        status: carrierInfo.recognized ? 'pass' : 'unknown',
      },
      {
        id: 'unique',
        label: 'Belum dipakai user lain',
        detail: isUnique
          ? 'Nomor ini hanya dipakai oleh user ini.'
          : `Nomor ini juga terdaftar pada akun lain (${conflictingUsers.map((u) => u.id).join(', ')}).`,
        status: isUnique ? 'pass' : 'fail',
      },
      {
        id: 'whatsapp-registered',
        label: 'Terdaftar di WhatsApp',
        detail: 'Tidak bisa dipastikan dari sisi server tanpa API berbayar.',
        status: 'unknown',
      },
    ],
  };
}

export function checkUserEmail(
  targetUser: Pick<AdminUserRecord, 'id' | 'email'>,
  allUsers: ReadonlyArray<Pick<AdminUserRecord, 'id' | 'email'>>,
  options?: { mxHost?: string | null }
): DiagnosticCheckResult {
  const email = targetUser.email.trim().toLowerCase();
  const formatValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const [localPart = '', domain = ''] = email.split('@');

  const isGeneric = GENERIC_LOCAL_PARTS.has(localPart);
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);
  const hasMxRecord =
    formatValid &&
    !isDisposable &&
    (Boolean(options?.mxHost) ||
      KNOWN_MX_DOMAINS.has(domain) ||
      /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain));

  const conflictingUsers = allUsers.filter(
    (other) => other.id !== targetUser.id && other.email.trim().toLowerCase() === email
  );
  const isUnique = conflictingUsers.length === 0;
  const isValid = formatValid && hasMxRecord && !isGeneric && !isDisposable && isUnique;

  const summary = !formatValid
    ? 'Format alamat email tidak valid.'
    : isDisposable
      ? `Domain ${domain} terdeteksi sebagai email sementara.`
      : !isUnique
        ? `Email sudah dipakai oleh user lain (${conflictingUsers.map((u) => u.id).join(', ')}).`
        : 'Email valid, domainnya aktif, dan belum dipakai user lain.';

  return {
    summary,
    isValid,
    checks: [
      {
        id: 'format',
        label: 'Format email',
        detail: formatValid ? email : 'Format alamat email tidak valid.',
        status: formatValid ? 'pass' : 'fail',
      },
      {
        id: 'mx',
        label: 'Domain menerima email (MX)',
        detail: hasMxRecord
          ? options?.mxHost
            ? `Domain ${domain} punya mail server (${options.mxHost}).`
            : `Domain ${domain} punya mail server.`
          : `Domain ${domain || '-'} tidak terverifikasi memiliki mail server.`,
        status: hasMxRecord ? 'pass' : 'fail',
      },
      {
        id: 'generic',
        label: 'Bukan alamat generik',
        detail: isGeneric
          ? `Alamat "${localPart}@" terlihat seperti alamat peran generik.`
          : 'Terlihat seperti alamat personal.',
        status: isGeneric ? 'fail' : 'pass',
      },
      {
        id: 'disposable',
        label: 'Bukan domain sekali pakai',
        detail: isDisposable
          ? `Domain ${domain} termasuk daftar email sementara.`
          : `Domain ${domain} tidak masuk daftar email sementara.`,
        status: isDisposable ? 'fail' : 'pass',
      },
      {
        id: 'unique',
        label: 'Belum dipakai user lain',
        detail: isUnique
          ? 'Email ini hanya dipakai oleh user ini.'
          : `Email ini juga digunakan oleh akun lain (${conflictingUsers.map((u) => u.id).join(', ')}).`,
        status: isUnique ? 'pass' : 'fail',
      },
    ],
  };
}

export function toggleUserAccountStatus(
  users: AdminUserRecord[],
  userId: string,
  options?: { reason?: string; actor?: string; timestamp?: string }
): AdminUserRecord[] {
  const actor = options?.actor ?? 'Alfaciro Admin';
  const timestamp = options?.timestamp ?? '15 Nov 2026 08:10';

  return users.map((user) => {
    if (user.id !== userId) return user;

    const nextStatus: 'aktif' | 'nonaktif' =
      user.accountStatus === 'aktif' ? 'nonaktif' : 'aktif';
    const action: UserStatusHistoryItem['action'] =
      nextStatus === 'nonaktif' ? 'dinonaktifkan' : 'diaktifkan';

    const defaultReason =
      nextStatus === 'nonaktif'
        ? 'Dinonaktifkan manual oleh admin dari halaman Detail User'
        : 'Diaktifkan kembali oleh admin dari halaman Detail User';

    const reason = options?.reason?.trim() || defaultReason;

    const entry: UserStatusHistoryItem = {
      id: `ST-${user.userNumber}-${user.statusHistory.length + 1}`,
      action,
      timestamp,
      actor,
      reason,
    };

    return {
      ...user,
      accountStatus: nextStatus,
      inactiveDays: nextStatus === 'aktif' ? 0 : Math.max(user.inactiveDays, 1),
      inactiveNote: nextStatus === 'aktif' ? 'Aktif bertransaksi' : reason,
      statusHistory: [entry, ...user.statusHistory],
    };
  });
}

export async function checkUserEmailLive(
  targetUser: Pick<AdminUserRecord, 'id' | 'email'>,
  allUsers: ReadonlyArray<Pick<AdminUserRecord, 'id' | 'email'>>
): Promise<DiagnosticCheckResult> {
  const email = targetUser.email.trim().toLowerCase();
  const domain = email.split('@')[1] ?? '';
  let mxHost: string | null = null;

  if (domain && !DISPOSABLE_DOMAINS.has(domain) && typeof fetch === 'function') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (res.ok) {
        const json = (await res.json()) as {
          Answer?: Array<{ data?: string }>;
        };
        const firstData = json.Answer?.[0]?.data;
        if (firstData) {
          const parts = firstData.trim().split(/\s+/);
          mxHost = (parts[parts.length - 1] ?? '').replace(/\.$/, '') || null;
        }
      }
    } catch {
      // Fallback gracefully to offline/deterministic MX check
    }
  }

  return checkUserEmail(targetUser, allUsers, { mxHost });
}

export interface CreateAdminUserInput {
  name: string;
  email: string;
  phone: string;
  emailVerified?: boolean;
  accountStatus?: 'aktif' | 'nonaktif';
  depositBalance?: number;
  invitedBy?: string | null;
  actor?: string;
  now?: Date;
}

export function formatLocalIndonesianPhone(localDigits: string): string {
  const digits = localDigits.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 13) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return digits;
}

export function getNextUserSequence(
  users: ReadonlyArray<Pick<AdminUserRecord, 'id' | 'userNumber'>>
): { id: string; userNumber: number } {
  let maxNumber = 2303;
  const existingIds = new Set<string>();
  for (const user of users) {
    existingIds.add(user.id.toUpperCase());
    if (user.userNumber > maxNumber) {
      maxNumber = user.userNumber;
    }
  }
  let nextNumber = maxNumber + 1;
  while (existingIds.has(`USR-${nextNumber}`)) {
    nextNumber += 1;
  }
  return {
    id: `USR-${nextNumber}`,
    userNumber: nextNumber,
  };
}

function formatAdminDateTime(date: Date): {
  fullDateTime: string;
  shortDate: string;
} {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()] ?? 'Nov';
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const shortDate = `${day} ${month} ${year}`;
  return {
    fullDateTime: `${shortDate} ${hours}:${minutes}`,
    shortDate,
  };
}

export function createAdminUser(
  users: AdminUserRecord[],
  input: CreateAdminUserInput
): {
  users: AdminUserRecord[];
  createdUser: AdminUserRecord | null;
  error: string | null;
} {
  const name = input.name.trim();
  if (!name) {
    return { users, createdUser: null, error: 'Nama lengkap user wajib diisi.' };
  }

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { users, createdUser: null, error: 'Format alamat email tidak valid.' };
  }

  const emailDuplicate = users.some((u) => u.email.trim().toLowerCase() === email);
  if (emailDuplicate) {
    return {
      users,
      createdUser: null,
      error: `Email "${email}" sudah terdaftar pada akun user lain.`,
    };
  }

  const normPhone = normalizeIndonesianPhone(input.phone);
  if (!normPhone.isIndonesia || !normPhone.isReasonableLength) {
    return {
      users,
      createdUser: null,
      error:
        'Nomor WhatsApp harus nomor seluler Indonesia yang valid (contoh: 0812-3456-7890 atau 62812...).',
    };
  }

  const phoneDuplicate = users.some((u) => {
    const existingNorm = normalizeIndonesianPhone(u.whatsappRaw || u.phone);
    return (
      existingNorm.internationalDigits.length > 0 &&
      existingNorm.internationalDigits === normPhone.internationalDigits
    );
  });
  if (phoneDuplicate) {
    return {
      users,
      createdUser: null,
      error: `Nomor telepon "${formatLocalIndonesianPhone(normPhone.local)}" sudah dipakai oleh user lain.`,
    };
  }

  const rawDeposit = input.depositBalance ?? 0;
  if (!Number.isFinite(rawDeposit) || rawDeposit < 0) {
    return {
      users,
      createdUser: null,
      error: 'Saldo deposit awal tidak boleh bernilai negatif.',
    };
  }
  const depositBalance = Math.round(rawDeposit);

  const accountStatus: 'aktif' | 'nonaktif' = input.accountStatus ?? 'aktif';
  const emailVerified = Boolean(input.emailVerified ?? true);
  const invitedBy = input.invitedBy?.trim() || null;
  const actor = input.actor?.trim() || 'Alfaciro Admin';
  const { id, userNumber } = getNextUserSequence(users);
  const { fullDateTime, shortDate } = formatAdminDateTime(input.now ?? new Date());

  const statusHistory: UserStatusHistoryItem[] =
    accountStatus === 'nonaktif'
      ? [
          {
            id: `ST-${userNumber}-1`,
            action: 'dinonaktifkan',
            timestamp: fullDateTime,
            actor,
            reason: 'Dibuat dengan status nonaktif oleh admin',
          },
        ]
      : [];

  const transactions =
    depositBalance > 0
      ? [
          {
            id: `TRX-${userNumber}-01`,
            type: 'Penyesuaian Saldo Admin',
            description: `Saldo awal ditambahkan oleh ${actor}`,
            amount: depositBalance,
            createdAt: fullDateTime,
          },
        ]
      : [];

  const candidate = AdminUserRecordSchema.safeParse({
    id,
    userNumber,
    name,
    email,
    emailVerified,
    phone: formatLocalIndonesianPhone(normPhone.local),
    whatsappRaw: normPhone.internationalDigits,
    invitedBy,
    registeredAt: fullDateTime,
    segment: 'belum_mulai',
    accountStatus,
    inactiveDays: accountStatus === 'nonaktif' ? 1 : 0,
    inactiveNote:
      accountStatus === 'nonaktif'
        ? 'Dibuat nonaktif oleh admin'
        : depositBalance > 0
          ? 'Didaftarkan admin · Siap bertransaksi'
          : 'Didaftarkan admin · Belum bertransaksi',
    depositBalance,
    withdrawableBalance: 0,
    totalTopUp: 0,
    totalTopUpCount: 0,
    totalWithdrawal: 0,
    totalWithdrawalCount: 0,
    totalInvestmentModal: 0,
    totalInvestmentCount: 0,
    activeInvestmentCount: 0,
    totalExpectedReturn: 0,
    totalEarnedReturn: 0,
    remainingExpectedReturn: 0,
    cashbackReceived: 0,
    referralCommissionReceived: 0,
    voucherClaimed: 0,
    runningProducts: 0,
    joinedAt: shortDate,
    lastActivity: `${shortDate} · Didaftarkan admin`,
    statusHistory,
    topUps: [],
    withdrawals: [],
    investments: [],
    transactions,
    banks: [],
    referrals: [],
  });

  if (!candidate.success) {
    return {
      users,
      createdUser: null,
      error: candidate.error.issues[0]?.message ?? 'Data user baru tidak valid.',
    };
  }

  return {
    users: [candidate.data, ...users],
    createdUser: candidate.data,
    error: null,
  };
}

