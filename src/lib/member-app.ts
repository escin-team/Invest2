import { z } from 'zod';
import {
  ADMIN_USER_RECORDS,
  INVESTMENT_PRODUCTS,
} from './dashboard-data';
import {
  AdminUserRecordSchema,
  MemberPasswordResetInputSchema,
  MemberRegisterInputSchema,
  UserBankAccountSchema,
  VoucherRecordSchema,
  type AccountChannelType,
  type AdminUserRecord,
  type InvestmentProduct,
  type MemberPasswordResetInput,
  type MemberRegisterInput,
  type UserBankAccount,
  type UserLevelRule,
  type VoucherRecord,
} from './dashboard-schema';
import { resolveIndonesianBankSlug } from './bank-logos';
import { calculateProductCommissionAmount } from './product-commissions';
import { createAdminUser, normalizeIndonesianPhone } from './user-diagnostics';
import {
  DEFAULT_USER_LEVEL_RULES,
  canUserLevelPurchaseProduct,
  countUserActiveReferrals,
  evaluateUserLevel,
  formatAllowedLevelsLabel,
} from './user-levels';
import { INITIAL_VOUCHERS, formatVoucherTimestamp } from './vouchers';

export type MemberTabId = 'beranda' | 'produk' | 'aset' | 'akun';

export const MemberActiveInvestmentSchema = z.object({
  id: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  category: z.string().trim().min(1),
  imageUrl: z.string(),
  units: z.number().int().positive(),
  capital: z.number().positive(),
  dailyClaimIncome: z.number().positive(),
  durationDays: z.number().int().positive(),
  claimsCompleted: z.number().int().nonnegative(),
  earnedReturn: z.number().nonnegative(),
  claimedToday: z.boolean(),
  status: z.enum(['aktif', 'selesai']),
  startedAt: z.string().trim().min(1),
});
export type MemberActiveInvestment = z.infer<typeof MemberActiveInvestmentSchema>;

export const MemberTransactionItemSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.enum(['topup', 'withdrawal', 'claim', 'purchase', 'voucher']),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  amount: z.number(),
  status: z.enum(['berhasil', 'menunggu', 'ditolak']),
  createdAt: z.string().trim().min(1),
});
export type MemberTransactionItem = z.infer<typeof MemberTransactionItemSchema>;

export const MemberAppStateSchema = z.object({
  isLoggedIn: z.boolean(),
  member: AdminUserRecordSchema,
  activeInvestments: z.array(MemberActiveInvestmentSchema),
  transactions: z.array(MemberTransactionItemSchema),
  vouchers: z.array(VoucherRecordSchema),
  claimedVoucherCodes: z.array(z.string()),
});
export type MemberAppState = z.infer<typeof MemberAppStateSchema>;

export const INITIAL_MEMBER_VOUCHER_POOL: ReadonlyArray<VoucherRecord> = [
  ...INITIAL_VOUCHERS,
  {
    id: 'VCH-02',
    code: 'FOLGERS25',
    totalAmount: 500_000,
    remainingAmount: 350_000,
    quota: 20,
    claimedCount: 6,
    expiredAt: '2027-12-31 23:59',
    status: 'Active',
    createdAt: '2026-11-15 08:00',
    claims: [
      {
        id: 'VCL-02',
        claimerName: 'Siti Nurhaliza',
        claimerMaskedPhone: '+62 813-****-5190',
        claimedAmount: 25_000,
        claimedAt: '2026-11-15 09:15',
      },
    ],
  },
];

export const MEMBER_TOPUP_PRESETS: ReadonlyArray<number> = [
  100_000,
  250_000,
  500_000,
  1_000_000,
  2_500_000,
];

export const MEMBER_MIN_TOPUP = 50_000;
export const MEMBER_MIN_WITHDRAWAL = 50_000;

function formatMemberTimestamp(date: Date): string {
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
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hh}:${mm}`;
}

function buildInitialInvestmentsForMember(
  member: AdminUserRecord
): MemberActiveInvestment[] {
  if (member.id === 'USR-8812') {
    const solar = INVESTMENT_PRODUCTS.find((p) => p.id === 'PRD-01') ?? INVESTMENT_PRODUCTS[0];
    const ev = INVESTMENT_PRODUCTS.find((p) => p.id === 'PRD-04') ?? INVESTMENT_PRODUCTS[3];
    return [
      {
        id: 'MINV-01',
        productId: solar.id,
        productName: solar.name,
        category: solar.category,
        imageUrl: solar.imageUrl,
        units: 2,
        capital: solar.minCapital * 2,
        dailyClaimIncome: solar.claimIncome * 2,
        durationDays: solar.tenorDays,
        claimsCompleted: 15,
        earnedReturn: solar.claimIncome * 2 * 15,
        claimedToday: false,
        status: 'aktif',
        startedAt: '30 Okt 2026',
      },
      {
        id: 'MINV-02',
        productId: ev.id,
        productName: ev.name,
        category: ev.category,
        imageUrl: ev.imageUrl,
        units: 1,
        capital: ev.minCapital,
        dailyClaimIncome: ev.claimIncome,
        durationDays: ev.tenorDays,
        claimsCompleted: 10,
        earnedReturn: ev.claimIncome * 10,
        claimedToday: false,
        status: 'aktif',
        startedAt: '04 Nov 2026',
      },
    ];
  }

  return member.investments.map((inv, idx) => {
    const matched = INVESTMENT_PRODUCTS.find((p) => p.name === inv.productName);
    const tenorDays = matched?.tenorDays ?? 30;
    const dailyClaim = matched?.claimIncome ?? Math.max(10_000, Math.round(inv.expectedReturn / tenorDays));
    const completed = Math.min(tenorDays, Math.round(inv.earnedReturn / Math.max(1, dailyClaim)));
    return {
      id: inv.id || `MINV-${idx + 1}`,
      productId: matched?.id ?? `PRD-0${idx + 1}`,
      productName: inv.productName,
      category: matched?.category ?? 'Investasi',
      imageUrl: matched?.imageUrl ?? '',
      units: 1,
      capital: inv.capital,
      dailyClaimIncome: dailyClaim,
      durationDays: tenorDays,
      claimsCompleted: completed,
      earnedReturn: inv.earnedReturn,
      claimedToday: inv.status === 'selesai',
      status: inv.status,
      startedAt: inv.startedAt,
    };
  });
}

function buildInitialTransactionsForMember(
  member: AdminUserRecord
): MemberTransactionItem[] {
  const fromMember: MemberTransactionItem[] = member.transactions.map((tx, idx) => {
    const kind: MemberTransactionItem['kind'] = tx.type.toLowerCase().includes('top')
      ? 'topup'
      : tx.type.toLowerCase().includes('tarik') || tx.type.toLowerCase().includes('withdraw')
        ? 'withdrawal'
        : tx.type.toLowerCase().includes('voucher')
          ? 'voucher'
          : tx.type.toLowerCase().includes('beli')
            ? 'purchase'
            : 'claim';
    return {
      id: tx.id || `MTX-${idx + 1}`,
      kind,
      title: tx.type,
      subtitle: tx.description,
      amount: tx.amount,
      status: 'berhasil',
      createdAt: tx.createdAt,
    };
  });

  const fromWithdrawals: MemberTransactionItem[] = member.withdrawals.map((wd) => ({
    id: wd.id,
    kind: 'withdrawal',
    title: 'Penarikan Saldo',
    subtitle: wd.destination,
    amount: -Math.abs(wd.amount),
    status:
      wd.status === 'disetujui'
        ? 'berhasil'
        : wd.status === 'ditolak'
          ? 'ditolak'
          : 'menunggu',
    createdAt: wd.createdAt,
  }));

  return [...fromMember, ...fromWithdrawals];
}

export function getDemoMemberAccounts(): ReadonlyArray<AdminUserRecord> {
  return ADMIN_USER_RECORDS.filter((u) => u.accountStatus === 'aktif').slice(0, 4);
}

export const MEMBER_PASSWORDS_STORAGE_KEY = 'naturerepublic_member_passwords_v1';
export const DEMO_MEMBER_DEFAULT_PASSWORD = 'member1234';

export function readStoredMemberPasswords(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(MEMBER_PASSWORDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && v.length >= 4) {
        clean[k.toLowerCase()] = v;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveStoredMemberPassword(email: string, password: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = readStoredMemberPasswords();
    current[email.trim().toLowerCase()] = password;
    window.localStorage.setItem(MEMBER_PASSWORDS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

export function createInitialMemberAppStateFromRecord(
  selectedMember: AdminUserRecord,
  isLoggedIn = true,
  vouchers: VoucherRecord[] = INITIAL_MEMBER_VOUCHER_POOL.map((v) => ({
    ...v,
    claims: v.claims.map((c) => ({ ...c })),
  }))
): MemberAppState {
  const clonedMember: AdminUserRecord = {
    ...selectedMember,
    banks: selectedMember.banks.map((b) => ({ ...b })),
    referrals: selectedMember.referrals.map((r) => ({ ...r })),
    investments: selectedMember.investments.map((i) => ({ ...i })),
    topUps: selectedMember.topUps.map((t) => ({ ...t })),
    withdrawals: selectedMember.withdrawals.map((w) => ({ ...w })),
    transactions: selectedMember.transactions.map((t) => ({ ...t })),
    statusHistory: selectedMember.statusHistory.map((s) => ({ ...s })),
  };

  return {
    isLoggedIn,
    member: clonedMember,
    activeInvestments: buildInitialInvestmentsForMember(clonedMember),
    transactions: buildInitialTransactionsForMember(clonedMember),
    vouchers,
    claimedVoucherCodes: [],
  };
}

export function createInitialMemberAppState(
  memberId = 'USR-8812',
  isLoggedIn = true,
  users: ReadonlyArray<AdminUserRecord> = ADMIN_USER_RECORDS
): MemberAppState {
  const selectedMember =
    users.find((u) => u.id === memberId) ??
    users.find((u) => u.id === 'USR-8812') ??
    users[0];

  return createInitialMemberAppStateFromRecord(selectedMember, isLoggedIn);
}

export function findMemberByIdentifier(
  users: ReadonlyArray<AdminUserRecord>,
  identifier: string
): AdminUserRecord | undefined {
  const normalized = identifier.trim().toLowerCase();
  const normalizedDigits = normalized.replace(/\D/g, '');
  const phoneNormalized = normalizeIndonesianPhone(identifier).internationalDigits;

  return users.find((user) => {
    if (user.email.toLowerCase() === normalized) return true;
    const phoneDigits = user.phone.replace(/\D/g, '');
    return (
      (normalizedDigits.length >= 6 &&
        (phoneDigits === normalizedDigits || user.whatsappRaw === normalizedDigits)) ||
      (phoneNormalized.length >= 8 && phoneDigits === phoneNormalized)
    );
  });
}

export function loginMemberByIdentifier(
  state: MemberAppState,
  identifier: string,
  password: string,
  users: ReadonlyArray<AdminUserRecord> = ADMIN_USER_RECORDS,
  customPasswords?: Record<string, string>
): { state: MemberAppState; error: string | null } {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) {
    return {
      state,
      error: 'Masukkan email atau nomor HP member yang terdaftar.',
    };
  }
  if (!password.trim() || password.trim().length < 4) {
    return {
      state,
      error: 'Password wajib diisi minimal 4 karakter.',
    };
  }

  const matched = findMemberByIdentifier(users, identifier);
  if (!matched) {
    return {
      state,
      error: 'Akun member tidak ditemukan. Daftar akun baru atau gunakan akun demo.',
    };
  }

  if (matched.accountStatus !== 'aktif') {
    return {
      state,
      error: 'Akun member ini sedang dinonaktifkan oleh admin.',
    };
  }

  const passwordMap = customPasswords ?? readStoredMemberPasswords();
  const expectedPassword =
    passwordMap[matched.email.toLowerCase()] ?? DEMO_MEMBER_DEFAULT_PASSWORD;

  if (password !== expectedPassword) {
    return {
      state,
      error:
        'Kata sandi tidak sesuai. Gunakan sandi terdaftar atau fitur Lupa Password.',
    };
  }

  const nextState = createInitialMemberAppStateFromRecord(matched, true, state.vouchers);
  return {
    state: nextState,
    error: null,
  };
}

export function validateMemberRegistrationInput(
  users: ReadonlyArray<AdminUserRecord>,
  input: MemberRegisterInput
): { ok: true; data: MemberRegisterInput } | { ok: false; error: string } {
  const parsed = MemberRegisterInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Data pendaftaran tidak valid.',
    };
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const duplicateEmail = users.some(
    (u) => u.email.trim().toLowerCase() === normalizedEmail
  );
  if (duplicateEmail) {
    return {
      ok: false,
      error: 'Email ini sudah terdaftar. Silakan masuk atau gunakan Lupa Password.',
    };
  }

  const phoneCheck = normalizeIndonesianPhone(parsed.data.phone);
  if (!phoneCheck.isIndonesia || !phoneCheck.isReasonableLength) {
    return {
      ok: false,
      error: 'Format nomor WhatsApp Indonesia tidak valid (contoh: 081234567890).',
    };
  }

  const duplicatePhone = users.some(
    (u) => u.phone.replace(/\D/g, '') === phoneCheck.internationalDigits
  );
  if (duplicatePhone) {
    return {
      ok: false,
      error: 'Nomor WhatsApp ini sudah terdaftar di akun lain.',
    };
  }

  return { ok: true, data: parsed.data };
}

export function registerMemberAccount(
  state: MemberAppState,
  users: ReadonlyArray<AdminUserRecord>,
  input: MemberRegisterInput,
  customPasswords?: Record<string, string>
): {
  state: MemberAppState;
  users: AdminUserRecord[];
  createdMember: AdminUserRecord | null;
  error: string | null;
} {
  const validation = validateMemberRegistrationInput(users, input);
  if (!validation.ok) {
    return {
      state,
      users: [...users],
      createdMember: null,
      error: validation.error,
    };
  }

  const { name, email, phone, password, referralCode } = validation.data;
  const createdRes = createAdminUser([...users], {
    name,
    email,
    phone,
  });

  if (createdRes.error || !createdRes.createdUser) {
    return {
      state,
      users: [...users],
      createdMember: null,
      error: createdRes.error ?? 'Gagal membuat akun member baru.',
    };
  }

  const verifiedMember: AdminUserRecord = {
    ...createdRes.createdUser,
    emailVerified: true,
    inactiveNote: referralCode.trim()
      ? `Mendaftar mandiri (Ref: ${referralCode.trim().toUpperCase()}). Siap melakukan Top Up pertama.`
      : 'Mendaftar mandiri melalui halaman member. Siap melakukan Top Up pertama.',
  };

  const nextUsers = [
    verifiedMember,
    ...createdRes.users.filter((u) => u.id !== verifiedMember.id),
  ];

  if (customPasswords) {
    customPasswords[verifiedMember.email.toLowerCase()] = password;
  } else {
    saveStoredMemberPassword(verifiedMember.email, password);
  }

  const nextState = createInitialMemberAppStateFromRecord(
    verifiedMember,
    true,
    state.vouchers
  );

  return {
    state: nextState,
    users: nextUsers,
    createdMember: verifiedMember,
    error: null,
  };
}

export function resetMemberPassword(
  users: ReadonlyArray<AdminUserRecord>,
  input: MemberPasswordResetInput,
  customPasswords?: Record<string, string>
): { ok: true; member: AdminUserRecord } | { ok: false; error: string } {
  const parsed = MemberPasswordResetInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Input reset kata sandi tidak valid.',
    };
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const matched = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail);
  if (!matched) {
    return {
      ok: false,
      error: 'Email tidak terdaftar di daftar member Nature Republic.',
    };
  }

  if (customPasswords) {
    customPasswords[normalizedEmail] = parsed.data.newPassword;
  } else {
    saveStoredMemberPassword(normalizedEmail, parsed.data.newPassword);
  }

  return { ok: true, member: matched };
}

export function claimMemberDailyInvestment(
  state: MemberAppState,
  investmentId: string,
  now = new Date()
): { state: MemberAppState; claimedAmount: number; error: string | null } {
  const target = state.activeInvestments.find((item) => item.id === investmentId);
  if (!target) {
    return { state, claimedAmount: 0, error: 'Portofolio investasi tidak ditemukan.' };
  }
  if (target.status !== 'aktif' || target.claimsCompleted >= target.durationDays) {
    return { state, claimedAmount: 0, error: 'Paket investasi ini sudah selesai seluruh siklus klaimnya.' };
  }
  if (target.claimedToday) {
    return { state, claimedAmount: 0, error: 'Imbal hasil hari ini sudah diklaim.' };
  }

  const nextClaimsCompleted = target.claimsCompleted + 1;
  const isCompleted = nextClaimsCompleted >= target.durationDays;
  const claimedAmount = target.dailyClaimIncome;

  const updatedInvestments: MemberActiveInvestment[] = state.activeInvestments.map((item) =>
    item.id === investmentId
      ? {
          ...item,
          claimsCompleted: nextClaimsCompleted,
          earnedReturn: item.earnedReturn + claimedAmount,
          claimedToday: true,
          status: isCompleted ? 'selesai' : 'aktif',
        }
      : item
  );

  const txId = `MTX-${Date.now().toString().slice(-6)}`;
  const nextTx: MemberTransactionItem = {
    id: txId,
    kind: 'claim',
    title: 'Klaim Hasil Harian',
    subtitle: `${target.productName} (${nextClaimsCompleted}/${target.durationDays} hari)`,
    amount: claimedAmount,
    status: 'berhasil',
    createdAt: formatMemberTimestamp(now),
  };

  return {
    state: {
      ...state,
      member: {
        ...state.member,
        withdrawableBalance: state.member.withdrawableBalance + claimedAmount,
        totalEarnedReturn: state.member.totalEarnedReturn + claimedAmount,
        remainingExpectedReturn: Math.max(
          0,
          state.member.remainingExpectedReturn - claimedAmount
        ),
        activeInvestmentCount: updatedInvestments.filter((i) => i.status === 'aktif').length,
        runningProducts: updatedInvestments.filter((i) => i.status === 'aktif').length,
      },
      activeInvestments: updatedInvestments,
      transactions: [nextTx, ...state.transactions],
    },
    claimedAmount,
    error: null,
  };
}

export function getMemberCurrentLevelEvaluation(
  member: Pick<AdminUserRecord, 'referrals' | 'totalInvestmentModal'>,
  rules: ReadonlyArray<UserLevelRule> = DEFAULT_USER_LEVEL_RULES
) {
  const activeReferrals = countUserActiveReferrals(member);
  return evaluateUserLevel(activeReferrals, member.totalInvestmentModal, rules);
}

export function getMemberCurrentLevel(
  member: Pick<AdminUserRecord, 'referrals' | 'totalInvestmentModal'>,
  rules: ReadonlyArray<UserLevelRule> = DEFAULT_USER_LEVEL_RULES
): number {
  return getMemberCurrentLevelEvaluation(member, rules).currentRule.level;
}

export function purchaseMemberProduct(
  state: MemberAppState,
  product: InvestmentProduct,
  units: number,
  now = new Date(),
  rules: ReadonlyArray<UserLevelRule> = DEFAULT_USER_LEVEL_RULES
): { state: MemberAppState; error: string | null } {
  if (product.status !== 'aktif') {
    return { state, error: 'Produk investasi ini sedang tidak aktif.' };
  }
  const memberLevel = getMemberCurrentLevel(state.member, rules);
  if (!canUserLevelPurchaseProduct(memberLevel, product.allowedLevels)) {
    return {
      state,
      error: `Produk ini hanya dapat dibeli oleh ${formatAllowedLevelsLabel(
        product.allowedLevels
      )}. Status akun Anda saat ini: VIP ${memberLevel}.`,
    };
  }
  const cleanUnits = Math.trunc(units);
  if (!Number.isFinite(cleanUnits) || cleanUnits < 1) {
    return { state, error: 'Jumlah unit pembelian minimal 1.' };
  }
  if (cleanUnits > product.maxPerUser) {
    return {
      state,
      error: `Maksimal pembelian untuk produk ini adalah ${product.maxPerUser} unit per member.`,
    };
  }

  const totalCost = product.minCapital * cleanUnits;
  if (state.member.depositBalance < totalCost) {
    return {
      state,
      error: 'Saldo Deposit belum mencukupi. Silakan Top Up terlebih dahulu.',
    };
  }

  const dailyIncome = product.claimIncome * cleanUnits;
  const totalExpected = dailyIncome * product.tenorDays;
  const newInvestment: MemberActiveInvestment = {
    id: `MINV-${String(state.activeInvestments.length + 1).padStart(2, '0')}`,
    productId: product.id,
    productName: product.name,
    category: product.category,
    imageUrl: product.imageUrl,
    units: cleanUnits,
    capital: totalCost,
    dailyClaimIncome: dailyIncome,
    durationDays: product.tenorDays,
    claimsCompleted: 0,
    earnedReturn: 0,
    claimedToday: false,
    status: 'aktif',
    startedAt: formatMemberTimestamp(now).split(' · ')[0],
  };

  const nextInvestments = [newInvestment, ...state.activeInvestments];
  const commissionInfo = calculateProductCommissionAmount(product, cleanUnits);
  const subtitle =
    commissionInfo > 0
      ? `${cleanUnits} unit · Tenor ${product.tenorDays} hari`
      : `${cleanUnits} unit investasi aktif`;

  const nextTx: MemberTransactionItem = {
    id: `MTX-${Date.now().toString().slice(-6)}`,
    kind: 'purchase',
    title: `Beli ${product.name}`,
    subtitle,
    amount: -totalCost,
    status: 'berhasil',
    createdAt: formatMemberTimestamp(now),
  };

  return {
    state: {
      ...state,
      member: {
        ...state.member,
        depositBalance: state.member.depositBalance - totalCost,
        totalInvestmentModal: state.member.totalInvestmentModal + totalCost,
        totalInvestmentCount: state.member.totalInvestmentCount + 1,
        activeInvestmentCount: nextInvestments.filter((i) => i.status === 'aktif').length,
        runningProducts: nextInvestments.filter((i) => i.status === 'aktif').length,
        totalExpectedReturn: state.member.totalExpectedReturn + totalExpected,
        remainingExpectedReturn: state.member.remainingExpectedReturn + totalExpected,
      },
      activeInvestments: nextInvestments,
      transactions: [nextTx, ...state.transactions],
    },
    error: null,
  };
}

export function submitMemberTopUp(
  state: MemberAppState,
  input: {
    amount: number;
    channelLabel: string;
    isInstantGateway?: boolean;
  },
  now = new Date()
): { state: MemberAppState; error: string | null } {
  const cleanAmount = Math.round(input.amount);
  if (!Number.isFinite(cleanAmount) || cleanAmount < MEMBER_MIN_TOPUP) {
    return {
      state,
      error: `Minimal Top Up adalah Rp ${MEMBER_MIN_TOPUP.toLocaleString('id-ID')}.`,
    };
  }
  const channel = input.channelLabel.trim();
  if (!channel) {
    return { state, error: 'Pilih metode pembayaran Top Up terlebih dahulu.' };
  }

  const instant = Boolean(input.isInstantGateway);
  const nextTx: MemberTransactionItem = {
    id: `TU-${Date.now().toString().slice(-6)}`,
    kind: 'topup',
    title: 'Top Up Saldo Deposit',
    subtitle: instant
      ? `${channel} · Otomatis terverifikasi`
      : `${channel} · Menunggu konfirmasi admin`,
    amount: cleanAmount,
    status: instant ? 'berhasil' : 'menunggu',
    createdAt: formatMemberTimestamp(now),
  };

  return {
    state: {
      ...state,
      member: {
        ...state.member,
        depositBalance: instant
          ? state.member.depositBalance + cleanAmount
          : state.member.depositBalance,
        totalTopUp: instant
          ? state.member.totalTopUp + cleanAmount
          : state.member.totalTopUp,
        totalTopUpCount: state.member.totalTopUpCount + 1,
      },
      transactions: [nextTx, ...state.transactions],
    },
    error: null,
  };
}

export function submitMemberWithdrawal(
  state: MemberAppState,
  input: {
    amount: number;
    bankId: string;
  },
  now = new Date(),
  rules: ReadonlyArray<UserLevelRule> = DEFAULT_USER_LEVEL_RULES
): { state: MemberAppState; error: string | null } {
  const cleanAmount = Math.round(input.amount);
  const vipRule = getMemberCurrentLevelEvaluation(state.member, rules).currentRule;
  const minAllowed = vipRule.minWithdrawal > 0 ? vipRule.minWithdrawal : MEMBER_MIN_WITHDRAWAL;
  const maxAllowed = vipRule.maxWithdrawal;

  if (!Number.isFinite(cleanAmount) || cleanAmount < minAllowed) {
    return {
      state,
      error: `Minimal penarikan untuk VIP ${vipRule.level} adalah Rp ${minAllowed.toLocaleString('id-ID')}.`,
    };
  }
  if (maxAllowed > 0 && cleanAmount > maxAllowed) {
    return {
      state,
      error: `Maksimal penarikan untuk VIP ${vipRule.level} (${vipRule.tierTitle}) adalah Rp ${maxAllowed.toLocaleString('id-ID')}. Naikkan level VIP untuk batas lebih tinggi.`,
    };
  }
  if (cleanAmount > state.member.withdrawableBalance) {
    return {
      state,
      error: 'Saldo Bisa Ditarik tidak mencukupi untuk nominal tersebut.',
    };
  }

  const bank = state.member.banks.find((b) => b.id === input.bankId);
  if (!bank) {
    return {
      state,
      error: 'Pilih rekening bank tujuan penarikan terlebih dahulu.',
    };
  }

  const maskedAccount =
    bank.accountNumber.length > 4
      ? `****${bank.accountNumber.slice(-4)}`
      : bank.accountNumber;

  const nextTx: MemberTransactionItem = {
    id: `WD-${Date.now().toString().slice(-6)}`,
    kind: 'withdrawal',
    title: 'Penarikan Dana',
    subtitle: `${bank.bankName} · ${maskedAccount} · Diproses`,
    amount: -cleanAmount,
    status: 'menunggu',
    createdAt: formatMemberTimestamp(now),
  };

  return {
    state: {
      ...state,
      member: {
        ...state.member,
        withdrawableBalance: state.member.withdrawableBalance - cleanAmount,
        totalWithdrawal: state.member.totalWithdrawal + cleanAmount,
        totalWithdrawalCount: state.member.totalWithdrawalCount + 1,
      },
      transactions: [nextTx, ...state.transactions],
    },
    error: null,
  };
}

export function redeemMemberVoucher(
  state: MemberAppState,
  rawCode: string,
  now = new Date()
): { state: MemberAppState; claimedAmount: number; error: string | null } {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { state, claimedAmount: 0, error: 'Masukkan kode voucher terlebih dahulu.' };
  }

  if (state.claimedVoucherCodes.includes(code)) {
    return {
      state,
      claimedAmount: 0,
      error: `Voucher "${code}" sudah pernah Anda klaim pada akun ini.`,
    };
  }

  const target = state.vouchers.find((v) => v.code.trim().toUpperCase() === code);
  if (!target) {
    return {
      state,
      claimedAmount: 0,
      error: `Kode voucher "${code}" tidak ditemukan.`,
    };
  }
  if (target.status === 'Expired') {
    return {
      state,
      claimedAmount: 0,
      error: `Voucher "${code}" sudah kedaluwarsa (${target.expiredAt}).`,
    };
  }
  if (target.status === 'Depleted' || target.remainingAmount <= 0 || target.claimedCount >= target.quota) {
    return {
      state,
      claimedAmount: 0,
      error: `Kuota voucher "${code}" sudah habis.`,
    };
  }
  if (target.status !== 'Active') {
    return {
      state,
      claimedAmount: 0,
      error: `Voucher "${code}" sedang tidak aktif.`,
    };
  }

  const perClaimShare = Math.max(
    1_000,
    Math.round(target.totalAmount / Math.max(1, target.quota))
  );
  const claimedAmount = Math.min(target.remainingAmount, perClaimShare);
  const nextRemaining = Math.max(0, target.remainingAmount - claimedAmount);
  const nextClaimedCount = target.claimedCount + 1;
  const isNowDepleted = nextRemaining <= 0 || nextClaimedCount >= target.quota;

  const maskedPhone = state.member.phone.replace(/(\d{4})-(\d{4})-(\d+)/, '$1-****-$3');

  const updatedVouchers: VoucherRecord[] = state.vouchers.map((item) =>
    item.id === target.id
      ? {
          ...item,
          remainingAmount: nextRemaining,
          claimedCount: nextClaimedCount,
          status: isNowDepleted ? 'Depleted' : 'Active',
          claims: [
            {
              id: `VCL-${Date.now().toString().slice(-4)}`,
              claimerName: state.member.name,
              claimerMaskedPhone: maskedPhone,
              claimedAmount,
              claimedAt: formatVoucherTimestamp(now),
            },
            ...item.claims,
          ],
        }
      : item
  );

  const nextTx: MemberTransactionItem = {
    id: `VCH-${Date.now().toString().slice(-6)}`,
    kind: 'voucher',
    title: `Klaim Voucher ${code}`,
    subtitle: 'Bonus saldo masuk ke Saldo Bisa Ditarik',
    amount: claimedAmount,
    status: 'berhasil',
    createdAt: formatMemberTimestamp(now),
  };

  return {
    state: {
      ...state,
      member: {
        ...state.member,
        withdrawableBalance: state.member.withdrawableBalance + claimedAmount,
        voucherClaimed: state.member.voucherClaimed + claimedAmount,
      },
      vouchers: updatedVouchers,
      claimedVoucherCodes: [...state.claimedVoucherCodes, code],
      transactions: [nextTx, ...state.transactions],
    },
    claimedAmount,
    error: null,
  };
}

export function addMemberBankAccount(
  state: MemberAppState,
  input: {
    accountType?: AccountChannelType;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
): { state: MemberAppState; error: string | null } {
  const accountType: AccountChannelType = input.accountType ?? 'bank';
  const bankName = input.bankName.trim();
  const cleanAccountNumber = input.accountNumber.replace(/[\s-]+/g, '').trim();
  const accountHolder = input.accountHolder.trim();

  if (bankName.length < 2) {
    return {
      state,
      error:
        accountType === 'ewallet'
          ? 'Pilih atau masukkan nama e-wallet tujuan.'
          : 'Pilih atau masukkan nama bank tujuan.',
    };
  }
  if (!/^\d{6,20}$/.test(cleanAccountNumber)) {
    return {
      state,
      error:
        accountType === 'ewallet'
          ? 'Nomor HP / akun e-wallet harus berupa 6 sampai 20 digit angka.'
          : 'Nomor rekening harus berupa 6 sampai 20 digit angka.',
    };
  }
  if (accountHolder.length < 2) {
    return {
      state,
      error:
        accountType === 'ewallet'
          ? 'Nama pemilik akun e-wallet wajib diisi.'
          : 'Nama pemilik rekening wajib diisi.',
    };
  }

  const duplicate = state.member.banks.some(
    (b) =>
      b.bankName.trim().toLowerCase() === bankName.toLowerCase() &&
      b.accountNumber === cleanAccountNumber
  );
  if (duplicate) {
    return {
      state,
      error:
        accountType === 'ewallet'
          ? 'Akun e-wallet ini sudah terdaftar di akun Anda.'
          : 'Rekening bank ini sudah terdaftar di akun Anda.',
    };
  }

  const slug = resolveIndonesianBankSlug(bankName);
  const displayBankName = slug && !bankName.toLowerCase().includes('bank') ? bankName : bankName;

  const nextBank: UserBankAccount = UserBankAccountSchema.parse({
    id: `BNK-M-${String(state.member.banks.length + 1).padStart(2, '0')}`,
    accountType,
    bankName: displayBankName,
    accountNumber: cleanAccountNumber,
    accountHolder,
    isPrimary: state.member.banks.length === 0,
  });

  return {
    state: {
      ...state,
      member: {
        ...state.member,
        banks: [nextBank, ...state.member.banks],
      },
    },
    error: null,
  };
}

