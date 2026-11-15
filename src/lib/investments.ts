import {
  AdminInvestmentRecordSchema,
  type AdminInvestmentRecord,
  type AdminInvestmentStatus,
} from './dashboard-schema';

export type InvestmentFilter = 'semua' | 'Active' | 'Nonaktif' | 'Selesai';

export const INITIAL_ADMIN_INVESTMENTS: AdminInvestmentRecord[] = [
  {
    id: '1304',
    userId: null,
    userName: 'Sarminah',
    userPhone: '6285202032609',
    productName: 'C - 10',
    sellingPrice: 250_000,
    durationDays: 30,
    claimsCompleted: 0,
    totalClaims: 30,
    incomePerClaim: 35_000,
    totalEstimated: 1_050_000,
    status: 'Active',
    startDate: '2026-11-14 22:33',
    endDate: '2026-12-14 22:33',
    statusChangeReason: '-',
    statusHistory: [],
  },
  {
    id: '1303',
    userId: 'USR-8812',
    userName: 'Rizky Pratama',
    userPhone: '6281284912201',
    productName: 'Reksa Energi Surya Nusantara',
    sellingPrice: 1_000_000,
    durationDays: 30,
    claimsCompleted: 15,
    totalClaims: 30,
    incomePerClaim: 45_000,
    totalEstimated: 1_350_000,
    status: 'Active',
    startDate: '2026-10-30 09:15',
    endDate: '2026-11-29 09:15',
    statusChangeReason: '-',
    statusHistory: [],
  },
  {
    id: '1302',
    userId: 'USR-8804',
    userName: 'Siti Nurhaliza',
    userPhone: '6281377245190',
    productName: 'Logistik Rantai Dingin Jawa',
    sellingPrice: 1_500_000,
    durationDays: 45,
    claimsCompleted: 21,
    totalClaims: 45,
    incomePerClaim: 52_500,
    totalEstimated: 2_362_500,
    status: 'Active',
    startDate: '2026-10-25 14:20',
    endDate: '2026-12-09 14:20',
    statusChangeReason: '-',
    statusHistory: [],
  },
  {
    id: '1301',
    userId: 'USR-8791',
    userName: 'Adi Kurniawan',
    userPhone: '6282140921188',
    productName: 'Pusat Data Regional Batam',
    sellingPrice: 2_000_000,
    durationDays: 45,
    claimsCompleted: 24,
    totalClaims: 45,
    incomePerClaim: 68_000,
    totalEstimated: 3_060_000,
    status: 'Active',
    startDate: '2026-10-21 11:05',
    endDate: '2026-12-05 11:05',
    statusChangeReason: '-',
    statusHistory: [],
  },
  {
    id: '1298',
    userId: null,
    userName: 'Hendra Wijaya',
    userPhone: '6285711223344',
    productName: 'C - 10',
    sellingPrice: 250_000,
    durationDays: 30,
    claimsCompleted: 8,
    totalClaims: 30,
    incomePerClaim: 35_000,
    totalEstimated: 1_050_000,
    status: 'Nonaktif',
    startDate: '2026-10-28 19:40',
    endDate: '2026-11-27 19:40',
    statusChangeReason: 'Permintaan pembatalan & audit transaksi duplikat',
    statusHistory: [
      {
        id: 'INV-ST-1298-1',
        fromStatus: 'Active',
        toStatus: 'Nonaktif',
        reason: 'Permintaan pembatalan & audit transaksi duplikat',
        actor: 'Alfaciro Admin',
        changedAt: '2026-11-05 10:12',
      },
    ],
  },
  {
    id: '1295',
    userId: 'USR-8410',
    userName: 'Bagus Setiawan',
    userPhone: '6285691204432',
    productName: 'Obligasi Mikro UMKM Digital',
    sellingPrice: 500_000,
    durationDays: 21,
    claimsCompleted: 21,
    totalClaims: 21,
    incomePerClaim: 31_250,
    totalEstimated: 656_250,
    status: 'Selesai',
    startDate: '2026-09-04 08:00',
    endDate: '2026-09-25 08:00',
    statusChangeReason: 'Seluruh 21/21 klaim selesai dibayarkan',
    statusHistory: [],
  },
  {
    id: '1290',
    userId: 'USR-8398',
    userName: 'Tania Maharani',
    userPhone: '6281763048821',
    productName: 'Armada EV Komersial Jabodetabek',
    sellingPrice: 2_500_000,
    durationDays: 60,
    claimsCompleted: 60,
    totalClaims: 60,
    incomePerClaim: 62_500,
    totalEstimated: 3_750_000,
    status: 'Selesai',
    startDate: '2026-08-26 10:30',
    endDate: '2026-10-25 10:30',
    statusChangeReason: 'Kontrak tenor 60 hari lunas',
    statusHistory: [],
  },
];

export interface InvestmentSummary {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  completedCount: number;
  totalSellingValue: number;
  activeSellingValue: number;
  totalEstimatedValue: number;
  totalPaidClaimsValue: number;
}

export function getInvestmentSummary(records: AdminInvestmentRecord[]): InvestmentSummary {
  let activeCount = 0;
  let inactiveCount = 0;
  let completedCount = 0;
  let totalSellingValue = 0;
  let activeSellingValue = 0;
  let totalEstimatedValue = 0;
  let totalPaidClaimsValue = 0;

  for (const item of records) {
    totalSellingValue += item.sellingPrice;
    totalEstimatedValue += item.totalEstimated;
    totalPaidClaimsValue += item.claimsCompleted * item.incomePerClaim;

    if (item.status === 'Active') {
      activeCount += 1;
      activeSellingValue += item.sellingPrice;
    } else if (item.status === 'Nonaktif') {
      inactiveCount += 1;
    } else {
      completedCount += 1;
    }
  }

  return {
    totalCount: records.length,
    activeCount,
    inactiveCount,
    completedCount,
    totalSellingValue,
    activeSellingValue,
    totalEstimatedValue,
    totalPaidClaimsValue,
  };
}

export function filterAdminInvestments(
  records: AdminInvestmentRecord[],
  options: { filter: InvestmentFilter; query: string }
): AdminInvestmentRecord[] {
  const { filter, query } = options;
  const trimmed = query.trim().toLowerCase();
  const normalizedQuery = trimmed.replace(/[-\s]/g, '');

  return records.filter((item) => {
    if (filter !== 'semua' && item.status !== filter) {
      return false;
    }
    if (!trimmed) return true;

    return (
      item.id.toLowerCase().includes(trimmed) ||
      item.userName.toLowerCase().includes(trimmed) ||
      item.userPhone.toLowerCase().includes(trimmed) ||
      item.productName.toLowerCase().includes(trimmed) ||
      item.statusChangeReason.toLowerCase().includes(trimmed) ||
      (normalizedQuery.length > 0 &&
        item.userPhone.replace(/[-\s]/g, '').includes(normalizedQuery))
    );
  });
}

function formatCurrentTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function changeInvestmentStatus(
  records: AdminInvestmentRecord[],
  investmentId: string,
  options: {
    nextStatus: Extract<AdminInvestmentStatus, 'Active' | 'Nonaktif'>;
    reason: string;
    actor?: string;
    changedAt?: string;
  }
): { records: AdminInvestmentRecord[]; error: string | null } {
  const cleanedReason = options.reason.trim();
  if (!cleanedReason) {
    return {
      records,
      error: 'Alasan perubahan status wajib diisi sebelum menyimpan.',
    };
  }

  const target = records.find((item) => item.id === investmentId);
  if (!target) {
    return {
      records,
      error: `Investment #${investmentId} tidak ditemukan.`,
    };
  }

  if (target.status === 'Selesai') {
    return {
      records,
      error: 'Investment yang sudah selesai tidak dapat diubah statusnya.',
    };
  }

  if (target.status === options.nextStatus) {
    return {
      records,
      error: `Investment #${investmentId} sudah berstatus ${options.nextStatus}.`,
    };
  }

  const timestamp = options.changedAt ?? formatCurrentTimestamp();
  const actor = options.actor?.trim() || 'Alfaciro Admin';

  const updated = records.map((item) => {
    if (item.id !== investmentId) return item;
    const candidate: AdminInvestmentRecord = {
      ...item,
      status: options.nextStatus,
      statusChangeReason: cleanedReason,
      statusHistory: [
        {
          id: `INV-ST-${item.id}-${item.statusHistory.length + 1}`,
          fromStatus: item.status,
          toStatus: options.nextStatus,
          reason: cleanedReason,
          actor,
          changedAt: timestamp,
        },
        ...item.statusHistory,
      ],
    };
    return AdminInvestmentRecordSchema.parse(candidate);
  });

  return { records: updated, error: null };
}
