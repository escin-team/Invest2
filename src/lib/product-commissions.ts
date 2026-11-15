import type {
  AdminUserRecord,
  InvestmentProduct,
  ProductCommissionEntry,
} from './dashboard-schema';

export function isProductCommissionActive(
  product: Pick<InvestmentProduct, 'status' | 'commissionRate'>
): boolean {
  return product.status === 'aktif' && product.commissionRate > 0;
}

export function calculateProductCommissionAmount(
  product: Pick<InvestmentProduct, 'minCapital' | 'commissionType' | 'commissionRate'>,
  units = 1
): number {
  if (!Number.isFinite(units) || units <= 0 || !Number.isFinite(product.commissionRate)) {
    return 0;
  }
  const cleanUnits = Math.trunc(units);
  if (cleanUnits <= 0 || product.commissionRate <= 0) {
    return 0;
  }
  if (product.commissionType === 'idr') {
    return Math.round(product.commissionRate * cleanUnits);
  }
  return Math.round(((product.minCapital * product.commissionRate) / 100) * cleanUnits);
}

export function buildReferralRegistrationLink(referralCode: string): string {
  const clean = referralCode.trim() || 'FINVAULT';
  return `https://finvault.id/daftar?ref=${encodeURIComponent(clean)}`;
}

export const INITIAL_PRODUCT_COMMISSIONS: ProductCommissionEntry[] = [
  {
    id: 'KOM-014',
    recipientUserId: 'USR-8791',
    recipientUserNumber: 2290,
    recipientName: 'Adi Kurniawan',
    recipientEmail: 'adi.kurniawan@mail.id',
    recipientPhone: '0821-4092-1188',
    referralCode: 'ADI2290',
    referredUserName: '#2305 Bagas Pratama',
    referredUserEmail: 'bagas.pratama@mail.id',
    registeredViaReferralAt: '14 Nov 2026 11:20',
    productId: 'PRD-04',
    productName: 'Armada EV Komersial Jabodetabek',
    purchaseUnits: 2,
    purchaseAmount: 5_000_000,
    commissionType: 'percent',
    commissionRate: 6,
    commissionAmount: 300_000,
    earnedAt: '2026-11-14 15:40',
  },
  {
    id: 'KOM-013',
    recipientUserId: 'USR-8812',
    recipientUserNumber: 2298,
    recipientName: 'Rizky Pratama',
    recipientEmail: 'rizky.pratama@mail.id',
    recipientPhone: '0812-8491-2201',
    referralCode: 'RIZKY2298',
    referredUserName: '#2301 Nadia Kusuma',
    referredUserEmail: 'nadia.kusuma@mail.id',
    registeredViaReferralAt: '09 Nov 2026 13:05',
    productId: 'PRD-05',
    productName: 'Pusat Data Regional Batam',
    purchaseUnits: 2,
    purchaseAmount: 4_000_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 200_000,
    earnedAt: '2026-11-14 13:18',
  },
  {
    id: 'KOM-012',
    recipientUserId: null,
    recipientUserNumber: 2302,
    recipientName: 'Moana Sari',
    recipientEmail: 'moana.sari@mail.id',
    recipientPhone: '0815-7741-9023',
    referralCode: 'MOANA2302',
    referredUserName: '#2304 Fajar Nugraha',
    referredUserEmail: 'fajar.nugraha@mail.id',
    registeredViaReferralAt: '11 Nov 2026 09:42',
    productId: 'PRD-02',
    productName: 'Logistik Rantai Dingin Jawa',
    purchaseUnits: 1,
    purchaseAmount: 1_500_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 75_000,
    earnedAt: '2026-11-14 10:05',
  },
  {
    id: 'KOM-011',
    recipientUserId: 'USR-8804',
    recipientUserNumber: 2295,
    recipientName: 'Siti Nurhaliza',
    recipientEmail: 'siti.nur@mail.id',
    recipientPhone: '0813-7724-5190',
    referralCode: 'SITI2295',
    referredUserName: '#2300 Dewi Anggraini',
    referredUserEmail: 'dewi.anggraini@mail.id',
    registeredViaReferralAt: '03 Nov 2026 16:12',
    productId: 'PRD-05',
    productName: 'Pusat Data Regional Batam',
    purchaseUnits: 1,
    purchaseAmount: 2_000_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 100_000,
    earnedAt: '2026-11-13 17:45',
  },
  {
    id: 'KOM-010',
    recipientUserId: null,
    recipientUserNumber: 2104,
    recipientName: 'Arif Hidayat',
    recipientEmail: 'arif.hidayat@mail.id',
    recipientPhone: '0811-2904-7712',
    referralCode: 'ARIF2104',
    referredUserName: '#2298 Rizky Pratama',
    referredUserEmail: 'rizky.pratama@mail.id',
    registeredViaReferralAt: '22 Okt 2026 14:12',
    productId: 'PRD-04',
    productName: 'Armada EV Komersial Jabodetabek',
    purchaseUnits: 1,
    purchaseAmount: 2_500_000,
    commissionType: 'percent',
    commissionRate: 6,
    commissionAmount: 150_000,
    earnedAt: '2026-11-12 19:10',
  },
  {
    id: 'KOM-009',
    recipientUserId: 'USR-8812',
    recipientUserNumber: 2298,
    recipientName: 'Rizky Pratama',
    recipientEmail: 'rizky.pratama@mail.id',
    recipientPhone: '0812-8491-2201',
    referralCode: 'RIZKY2298',
    referredUserName: '#2299 Hendra Wijaya',
    referredUserEmail: 'hendra.w@mail.id',
    registeredViaReferralAt: '05 Nov 2026 08:30',
    productId: 'PRD-04',
    productName: 'Armada EV Komersial Jabodetabek',
    purchaseUnits: 1,
    purchaseAmount: 2_500_000,
    commissionType: 'percent',
    commissionRate: 6,
    commissionAmount: 150_000,
    earnedAt: '2026-11-11 14:22',
  },
  {
    id: 'KOM-008',
    recipientUserId: 'USR-8791',
    recipientUserNumber: 2290,
    recipientName: 'Adi Kurniawan',
    recipientEmail: 'adi.kurniawan@mail.id',
    recipientPhone: '0821-4092-1188',
    referralCode: 'ADI2290',
    referredUserName: '#2296 Galih Permana',
    referredUserEmail: 'galih.p@mail.id',
    registeredViaReferralAt: '04 Nov 2026 10:15',
    productId: 'PRD-05',
    productName: 'Pusat Data Regional Batam',
    purchaseUnits: 2,
    purchaseAmount: 4_000_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 200_000,
    earnedAt: '2026-11-10 16:08',
  },
  {
    id: 'KOM-007',
    recipientUserId: 'USR-8812',
    recipientUserNumber: 2298,
    recipientName: 'Rizky Pratama',
    recipientEmail: 'rizky.pratama@mail.id',
    recipientPhone: '0812-8491-2201',
    referralCode: 'RIZKY2298',
    referredUserName: '#2299 Hendra Wijaya',
    referredUserEmail: 'hendra.w@mail.id',
    registeredViaReferralAt: '05 Nov 2026 08:30',
    productId: 'PRD-02',
    productName: 'Logistik Rantai Dingin Jawa',
    purchaseUnits: 1,
    purchaseAmount: 1_500_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 75_000,
    earnedAt: '2026-11-08 09:50',
  },
  {
    id: 'KOM-006',
    recipientUserId: null,
    recipientUserNumber: 2302,
    recipientName: 'Moana Sari',
    recipientEmail: 'moana.sari@mail.id',
    recipientPhone: '0815-7741-9023',
    referralCode: 'MOANA2302',
    referredUserName: '#2303 Risma',
    referredUserEmail: 'rismamulyani225@gmail.com',
    registeredViaReferralAt: '06 Nov 2026 07:56',
    productId: 'PRD-01',
    productName: 'Reksa Energi Surya Nusantara',
    purchaseUnits: 1,
    purchaseAmount: 1_000_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 50_000,
    earnedAt: '2026-11-07 11:30',
  },
  {
    id: 'KOM-005',
    recipientUserId: 'USR-8804',
    recipientUserNumber: 2295,
    recipientName: 'Siti Nurhaliza',
    recipientEmail: 'siti.nur@mail.id',
    recipientPhone: '0813-7724-5190',
    referralCode: 'SITI2295',
    referredUserName: '#2300 Dewi Anggraini',
    referredUserEmail: 'dewi.anggraini@mail.id',
    registeredViaReferralAt: '03 Nov 2026 16:12',
    productId: 'PRD-01',
    productName: 'Reksa Energi Surya Nusantara',
    purchaseUnits: 1,
    purchaseAmount: 1_000_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 50_000,
    earnedAt: '2026-11-05 14:15',
  },
  {
    id: 'KOM-004',
    recipientUserId: 'USR-8791',
    recipientUserNumber: 2290,
    recipientName: 'Adi Kurniawan',
    recipientEmail: 'adi.kurniawan@mail.id',
    recipientPhone: '0821-4092-1188',
    referralCode: 'ADI2290',
    referredUserName: '#2294 Yusuf Ramadhan',
    referredUserEmail: 'yusuf.ramadhan@mail.id',
    registeredViaReferralAt: '28 Okt 2026 12:00',
    productId: 'PRD-02',
    productName: 'Logistik Rantai Dingin Jawa',
    purchaseUnits: 1,
    purchaseAmount: 1_500_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 75_000,
    earnedAt: '2026-11-02 18:05',
  },
  {
    id: 'KOM-003',
    recipientUserId: null,
    recipientUserNumber: 2104,
    recipientName: 'Arif Hidayat',
    recipientEmail: 'arif.hidayat@mail.id',
    recipientPhone: '0811-2904-7712',
    referralCode: 'ARIF2104',
    referredUserName: '#2298 Rizky Pratama',
    referredUserEmail: 'rizky.pratama@mail.id',
    registeredViaReferralAt: '22 Okt 2026 14:12',
    productId: 'PRD-05',
    productName: 'Pusat Data Regional Batam',
    purchaseUnits: 1,
    purchaseAmount: 2_000_000,
    commissionType: 'percent',
    commissionRate: 5,
    commissionAmount: 100_000,
    earnedAt: '2026-10-29 12:40',
  },
  {
    id: 'KOM-002',
    recipientUserId: 'USR-8791',
    recipientUserNumber: 2290,
    recipientName: 'Adi Kurniawan',
    recipientEmail: 'adi.kurniawan@mail.id',
    recipientPhone: '0821-4092-1188',
    referralCode: 'ADI2290',
    referredUserName: '#2291 Lestari Putri',
    referredUserEmail: 'lestari.putri@mail.id',
    registeredViaReferralAt: '20 Okt 2026 15:10',
    productId: 'PRD-03',
    productName: 'Obligasi Mikro UMKM Digital',
    purchaseUnits: 3,
    purchaseAmount: 1_500_000,
    commissionType: 'percent',
    commissionRate: 3,
    commissionAmount: 45_000,
    earnedAt: '2026-10-25 10:12',
  },
  {
    id: 'KOM-001',
    recipientUserId: 'USR-8398',
    recipientUserNumber: 2118,
    recipientName: 'Tania Maharani',
    recipientEmail: 'tania.maharani@mail.id',
    recipientPhone: '0817-6304-8821',
    referralCode: 'TANIA2118',
    referredUserName: '#2125 Kartika Sari',
    referredUserEmail: 'kartika.sari@mail.id',
    registeredViaReferralAt: '12 Okt 2026 09:05',
    productId: 'PRD-03',
    productName: 'Obligasi Mikro UMKM Digital',
    purchaseUnits: 3,
    purchaseAmount: 1_500_000,
    commissionType: 'percent',
    commissionRate: 3,
    commissionAmount: 45_000,
    earnedAt: '2026-10-18 16:30',
  },
];

export interface EnrichedProductCommissionEntry extends ProductCommissionEntry {
  matchedProduct: InvestmentProduct | null;
  isProductCommissionCurrentlyActive: boolean;
}

export interface ProductCommissionRecipientSummary {
  recipientKey: string;
  recipientUserId: string | null;
  recipientUserNumber: number;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  referralCode: string;
  referralLink: string;
  commissionCount: number;
  totalReceived: number;
  latestCommission: EnrichedProductCommissionEntry;
  entries: EnrichedProductCommissionEntry[];
}

export function aggregateProductCommissionRecipients(
  entries: ProductCommissionEntry[],
  products: InvestmentProduct[]
): ProductCommissionRecipientSummary[] {
  const productById = new Map<string, InvestmentProduct>();
  const productByName = new Map<string, InvestmentProduct>();

  for (const product of products) {
    productById.set(product.id.toLowerCase(), product);
    productByName.set(product.name.trim().toLowerCase(), product);
  }

  const grouped = new Map<string, EnrichedProductCommissionEntry[]>();

  for (const entry of entries) {
    const matchedProduct =
      productById.get(entry.productId.toLowerCase()) ??
      productByName.get(entry.productName.trim().toLowerCase()) ??
      null;
    const isActiveNow = matchedProduct
      ? isProductCommissionActive(matchedProduct)
      : false;

    const enriched: EnrichedProductCommissionEntry = {
      ...entry,
      matchedProduct,
      isProductCommissionCurrentlyActive: isActiveNow,
    };

    const key = entry.recipientUserId ?? `email:${entry.recipientEmail.toLowerCase()}`;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(enriched);
    } else {
      grouped.set(key, [enriched]);
    }
  }

  const summaries: ProductCommissionRecipientSummary[] = [];

  for (const [recipientKey, bucket] of grouped.entries()) {
    const sorted = [...bucket].sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
    const latest = sorted[0];
    const totalReceived = sorted.reduce((sum, item) => sum + item.commissionAmount, 0);

    summaries.push({
      recipientKey,
      recipientUserId: latest.recipientUserId,
      recipientUserNumber: latest.recipientUserNumber,
      recipientName: latest.recipientName,
      recipientEmail: latest.recipientEmail,
      recipientPhone: latest.recipientPhone,
      referralCode: latest.referralCode,
      referralLink: buildReferralRegistrationLink(latest.referralCode),
      commissionCount: sorted.length,
      totalReceived,
      latestCommission: latest,
      entries: sorted,
    });
  }

  return summaries.sort((a, b) =>
    b.latestCommission.earnedAt.localeCompare(a.latestCommission.earnedAt)
  );
}

export function filterProductCommissionRecipients(
  recipients: ProductCommissionRecipientSummary[],
  options: { query: string; productId?: string }
): ProductCommissionRecipientSummary[] {
  const q = options.query.trim().toLowerCase();
  const normalizedPhoneQuery = q.replace(/[-\s]/g, '');
  const productFilter = (options.productId ?? '').trim().toLowerCase();

  return recipients.filter((rec) => {
    if (productFilter && productFilter !== 'semua') {
      const hasProduct = rec.entries.some(
        (e) => e.productId.toLowerCase() === productFilter
      );
      if (!hasProduct) return false;
    }

    if (!q) return true;

    const matchesRecipient =
      rec.recipientName.toLowerCase().includes(q) ||
      rec.recipientEmail.toLowerCase().includes(q) ||
      rec.recipientPhone.toLowerCase().includes(q) ||
      (rec.recipientUserId?.toLowerCase().includes(q) ?? false) ||
      `#${rec.recipientUserNumber}`.includes(q) ||
      String(rec.recipientUserNumber).includes(q) ||
      rec.referralCode.toLowerCase().includes(q) ||
      (normalizedPhoneQuery.length > 0 &&
        rec.recipientPhone.replace(/[-\s]/g, '').includes(normalizedPhoneQuery));

    if (matchesRecipient) return true;

    return rec.entries.some(
      (e) =>
        e.productName.toLowerCase().includes(q) ||
        e.productId.toLowerCase().includes(q) ||
        e.referredUserName.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
    );
  });
}

export function getProductCommissionOverview(
  recipients: ProductCommissionRecipientSummary[],
  products: InvestmentProduct[]
): {
  totalRecipients: number;
  totalCommissionsCount: number;
  totalCommissionPaid: number;
  activeCommissionProductsCount: number;
  totalCatalogProducts: number;
  activeCommissionProducts: InvestmentProduct[];
} {
  let totalCommissionsCount = 0;
  let totalCommissionPaid = 0;

  for (const rec of recipients) {
    totalCommissionsCount += rec.commissionCount;
    totalCommissionPaid += rec.totalReceived;
  }

  const activeCommissionProducts = products.filter(isProductCommissionActive);

  return {
    totalRecipients: recipients.length,
    totalCommissionsCount,
    totalCommissionPaid,
    activeCommissionProductsCount: activeCommissionProducts.length,
    totalCatalogProducts: products.length,
    activeCommissionProducts,
  };
}

export function deriveUserReferralCode(
  user: Pick<AdminUserRecord, 'name' | 'userNumber'>
): string {
  const firstWord = user.name
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  return `${firstWord || 'USER'}${user.userNumber}`;
}

export interface UserProductCommissionSummary {
  referralCode: string;
  referralLink: string;
  commissionCount: number;
  totalReceived: number;
  latestCommission: EnrichedProductCommissionEntry | null;
  entries: EnrichedProductCommissionEntry[];
}

export function getUserProductCommissionSummary(
  user: Pick<AdminUserRecord, 'id' | 'name' | 'email' | 'userNumber'>,
  entries: ProductCommissionEntry[],
  products: InvestmentProduct[]
): UserProductCommissionSummary {
  const productById = new Map<string, InvestmentProduct>();
  const productByName = new Map<string, InvestmentProduct>();

  for (const product of products) {
    productById.set(product.id.toLowerCase(), product);
    productByName.set(product.name.trim().toLowerCase(), product);
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const matched = entries.filter(
    (entry) =>
      entry.recipientUserId === user.id ||
      entry.recipientEmail.trim().toLowerCase() === normalizedEmail
  );

  const enriched: EnrichedProductCommissionEntry[] = matched
    .map((entry) => {
      const matchedProduct =
        productById.get(entry.productId.toLowerCase()) ??
        productByName.get(entry.productName.trim().toLowerCase()) ??
        null;
      return {
        ...entry,
        matchedProduct,
        isProductCommissionCurrentlyActive: matchedProduct
          ? isProductCommissionActive(matchedProduct)
          : false,
      };
    })
    .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));

  const referralCode = enriched[0]?.referralCode ?? deriveUserReferralCode(user);
  const totalReceived = enriched.reduce((sum, item) => sum + item.commissionAmount, 0);

  return {
    referralCode,
    referralLink: buildReferralRegistrationLink(referralCode),
    commissionCount: enriched.length,
    totalReceived,
    latestCommission: enriched[0] ?? null,
    entries: enriched,
  };
}
