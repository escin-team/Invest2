import {
  VoucherRecordSchema,
  type VoucherRecord,
  type VoucherStatus,
} from './dashboard-schema';

export type VoucherStatusFilter = 'all' | VoucherStatus;

export interface CreateVoucherInput {
  code: string;
  totalAmount: number;
  quota: number;
  expiredAt: string;
  status: Extract<VoucherStatus, 'Active' | 'Inactive'>;
}

export interface VoucherSummary {
  totalCount: number;
  activeCount: number;
  expiredCount: number;
  totalBudget: number;
  totalRemaining: number;
}

const VOUCHER_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const INITIAL_VOUCHERS: ReadonlyArray<VoucherRecord> = [
  {
    id: 'VCH-01',
    code: '5N9JK5',
    totalAmount: 100_000,
    remainingAmount: 17_000,
    quota: 2,
    claimedCount: 1,
    expiredAt: '2026-11-14 17:01',
    status: 'Expired',
    createdAt: '2026-11-13 09:00',
    claims: [
      {
        id: 'VCL-01',
        claimerName: 'Dian Prasetyo (Contoh)',
        claimerMaskedPhone: '+62 812-****-4109',
        claimedAmount: 83_000,
        claimedAt: '2026-11-14 11:24',
      },
    ],
  },
];

export function formatVoucherTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function normalizeVoucherExpiredAt(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '';
  return trimmed.replace('T', ' ').slice(0, 16);
}

export function getNextVoucherId(records: ReadonlyArray<VoucherRecord>): string {
  let maxNumber = 0;
  for (const item of records) {
    const match = /^VCH-(\d+)$/i.exec(item.id);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  }
  return `VCH-${String(maxNumber + 1).padStart(2, '0')}`;
}

export function generateVoucherCode(
  existingRecords: ReadonlyArray<VoucherRecord>,
  length = 6,
  rng: () => number = Math.random
): string {
  const existingSet = new Set(
    existingRecords.map((item) => item.code.trim().toUpperCase())
  );
  for (let attempt = 0; attempt < 25; attempt += 1) {
    let candidate = '';
    for (let i = 0; i < length; i += 1) {
      const idx = Math.floor(rng() * VOUCHER_CODE_ALPHABET.length);
      candidate += VOUCHER_CODE_ALPHABET[idx] ?? 'A';
    }
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }
  return `VCH${String(existingRecords.length + 101)}`;
}

export function filterVouchers(
  records: ReadonlyArray<VoucherRecord>,
  options: {
    query: string;
    statusFilter: VoucherStatusFilter;
  }
): VoucherRecord[] {
  const normalizedQuery = options.query.trim().toLowerCase();
  return records.filter((item) => {
    if (options.statusFilter !== 'all' && item.status !== options.statusFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return item.code.toLowerCase().includes(normalizedQuery);
  });
}

export function getVoucherSummary(
  records: ReadonlyArray<VoucherRecord>
): VoucherSummary {
  return records.reduce<VoucherSummary>(
    (acc, item) => {
      acc.totalCount += 1;
      if (item.status === 'Active') {
        acc.activeCount += 1;
      } else if (item.status === 'Expired') {
        acc.expiredCount += 1;
      }
      acc.totalBudget += item.totalAmount;
      acc.totalRemaining += item.remainingAmount;
      return acc;
    },
    {
      totalCount: 0,
      activeCount: 0,
      expiredCount: 0,
      totalBudget: 0,
      totalRemaining: 0,
    }
  );
}

export function addVoucher(
  records: ReadonlyArray<VoucherRecord>,
  input: CreateVoucherInput,
  now = new Date()
): {
  records: VoucherRecord[];
  created: VoucherRecord | null;
  error: string | null;
} {
  const normalizedCode = input.code.trim().toUpperCase();
  const isDuplicate = records.some(
    (item) => item.code.trim().toUpperCase() === normalizedCode
  );
  if (isDuplicate) {
    return {
      records: [...records],
      created: null,
      error: `Kode voucher "${normalizedCode}" sudah terdaftar.`,
    };
  }

  const expiredAt = normalizeVoucherExpiredAt(input.expiredAt);
  const candidate: VoucherRecord = {
    id: getNextVoucherId(records),
    code: normalizedCode,
    totalAmount: input.totalAmount,
    remainingAmount: input.totalAmount,
    quota: input.quota,
    claimedCount: 0,
    expiredAt,
    status: input.status,
    createdAt: formatVoucherTimestamp(now),
    claims: [],
  };

  const parsed = VoucherRecordSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      records: [...records],
      created: null,
      error: parsed.error.issues[0]?.message ?? 'Data voucher tidak valid.',
    };
  }

  return {
    records: [parsed.data, ...records],
    created: parsed.data,
    error: null,
  };
}

export function toggleVoucherStatus(
  records: ReadonlyArray<VoucherRecord>,
  voucherId: string
): { records: VoucherRecord[]; error: string | null } {
  const target = records.find((item) => item.id === voucherId);
  if (!target) {
    return { records: [...records], error: 'Data voucher tidak ditemukan.' };
  }
  if (target.status === 'Expired' || target.status === 'Depleted') {
    return {
      records: [...records],
      error: `Voucher berstatus ${target.status} tidak dapat diaktifkan kembali tanpa pembaruan kuota/masa berlaku.`,
    };
  }
  const nextStatus: VoucherStatus =
    target.status === 'Active' ? 'Inactive' : 'Active';
  return {
    records: records.map((item) =>
      item.id === voucherId ? { ...item, status: nextStatus } : item
    ),
    error: null,
  };
}

export function deleteVoucher(
  records: ReadonlyArray<VoucherRecord>,
  voucherId: string
): VoucherRecord[] {
  return records.filter((item) => item.id !== voucherId);
}
