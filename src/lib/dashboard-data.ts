import {
  AdminUserRecordSchema,
  DashboardSnapshotSchema,
  InvestmentProductSchema,
  QueueTransactionSchema,
  type AdminSession,
  type AdminUserRecord,
  type DailyCashflowPoint,
  type DashboardSnapshot,
  type InvestmentProduct,
  type QueueTransaction,
  type TimeRange,
} from './dashboard-schema';
import { formatNumber, formatRupiah, formatSignedRupiah } from './utils';

export const TIME_RANGE_OPTIONS: ReadonlyArray<{ value: TimeRange; label: string }> = [
  { value: '7d', label: '7 hari' },
  { value: '30d', label: '30 hari' },
  { value: '90d', label: '90 hari' },
  { value: '1y', label: '1 tahun' },
];

export const LIFETIME_METRICS = {
  totalApprovedTopUp: 1_969_304_178,
  totalApprovedWithdrawal: 1_582_680_500,
  totalClaimsPaid: 1_637_162_000,
  remainingEstimatedYield: 0,
} as const;

const BASE_OPERATIONAL = {
  pendingTopUpCount: 5,
  pendingTopUpAmount: 6_100_000,
  pendingWithdrawalCount: 423,
  pendingWithdrawalAmount: 451_431_500,
  runningProductsCount: 1_296,
  runningProductsCapital: 1_947_810_000,
  activeProductsCount: 30,
  totalCatalogProducts: 62,
} as const;

function summarizeCashflow(series: DailyCashflowPoint[]) {
  let topUpTotal = 0;
  let withdrawalTotal = 0;
  let peakTopUp = series[0];
  let peakWithdrawal = series[0];

  for (const point of series) {
    topUpTotal += point.topUp;
    withdrawalTotal += point.withdrawal;
    if (point.topUp >= peakTopUp.topUp) {
      peakTopUp = point;
    }
    if (point.withdrawal >= peakWithdrawal.withdrawal) {
      peakWithdrawal = point;
    }
  }

  return {
    topUpTotal,
    withdrawalTotal,
    difference: topUpTotal - withdrawalTotal,
    peakTopUpAmount: peakTopUp.topUp,
    peakTopUpDate: peakTopUp.fullDate,
    peakWithdrawalAmount: peakWithdrawal.withdrawal,
    peakWithdrawalDate: peakWithdrawal.fullDate,
    series,
  };
}

const SERIES_7D: DailyCashflowPoint[] = [
  { id: '2026-11-08', label: '08 Nov', fullDate: '08 Nov 2026', topUp: 34_520_000, withdrawal: 39_400_000 },
  { id: '2026-11-09', label: '09 Nov', fullDate: '09 Nov 2026', topUp: 41_850_000, withdrawal: 44_212_000 },
  { id: '2026-11-10', label: '10 Nov', fullDate: '10 Nov 2026', topUp: 38_412_018, withdrawal: 48_900_000 },
  { id: '2026-11-11', label: '11 Nov', fullDate: '11 Nov 2026', topUp: 46_900_000, withdrawal: 45_600_000 },
  { id: '2026-11-12', label: '12 Nov', fullDate: '12 Nov 2026', topUp: 42_100_000, withdrawal: 51_200_000 },
  { id: '2026-11-13', label: '13 Nov', fullDate: '13 Nov 2026', topUp: 50_300_000, withdrawal: 52_100_000 },
  { id: '2026-11-14', label: '14 Nov', fullDate: '14 Nov 2026', topUp: 128_700_000, withdrawal: 117_116_000 },
];

const SERIES_30D: DailyCashflowPoint[] = [
  { id: 'w1', label: '16–20 Okt', fullDate: '20 Okt 2026', topUp: 142_500_000, withdrawal: 118_400_000 },
  { id: 'w2', label: '21–25 Okt', fullDate: '25 Okt 2026', topUp: 186_200_000, withdrawal: 144_900_000 },
  { id: 'w3', label: '26–30 Okt', fullDate: '30 Okt 2026', topUp: 224_800_000, withdrawal: 192_350_000 },
  { id: 'w4', label: '31 Okt–04 Nov', fullDate: '04 Nov 2026', topUp: 248_100_000, withdrawal: 210_600_000 },
  { id: 'w5', label: '05–09 Nov', fullDate: '09 Nov 2026', topUp: 216_450_000, withdrawal: 198_720_000 },
  { id: 'w6', label: '10–14 Nov', fullDate: '14 Nov 2026', topUp: 306_412_018, withdrawal: 314_916_000 },
];

const SERIES_90D: DailyCashflowPoint[] = [
  { id: 'm1', label: 'Agu 2026 (2)', fullDate: '31 Agu 2026', topUp: 148_200_000, withdrawal: 94_100_000 },
  { id: 'm2', label: 'Sep 2026 (1)', fullDate: '15 Sep 2026', topUp: 215_600_000, withdrawal: 148_900_000 },
  { id: 'm3', label: 'Sep 2026 (2)', fullDate: '30 Sep 2026', topUp: 278_400_000, withdrawal: 212_500_000 },
  { id: 'm4', label: 'Okt 2026 (1)', fullDate: '15 Okt 2026', topUp: 342_900_000, withdrawal: 268_400_000 },
  { id: 'm5', label: 'Okt 2026 (2)', fullDate: '31 Okt 2026', topUp: 388_500_000, withdrawal: 318_200_000 },
  { id: 'm6', label: 'Nov 2026 (1)', fullDate: '14 Nov 2026', topUp: 432_782_018, withdrawal: 398_528_000 },
];

const SERIES_1Y: DailyCashflowPoint[] = [
  { id: 'q1', label: 'Des 25–Jan 26', fullDate: '31 Jan 2026', topUp: 98_400_000, withdrawal: 54_200_000 },
  { id: 'q2', label: 'Feb–Mar 26', fullDate: '31 Mar 2026', topUp: 152_800_000, withdrawal: 98_600_000 },
  { id: 'q3', label: 'Apr–Mei 26', fullDate: '31 Mei 2026', topUp: 214_500_000, withdrawal: 156_400_000 },
  { id: 'q4', label: 'Jun–Jul 26', fullDate: '31 Jul 2026', topUp: 312_900_000, withdrawal: 248_100_000 },
  { id: 'q5', label: 'Agu–Sep 26', fullDate: '30 Sep 2026', topUp: 468_200_000, withdrawal: 382_450_000 },
  { id: 'q6', label: 'Okt–Nov 26', fullDate: '14 Nov 2026', topUp: 722_504_178, withdrawal: 642_930_500 },
];

const RAW_SNAPSHOTS: Record<TimeRange, DashboardSnapshot> = {
  '7d': {
    range: '7d',
    rangeLabel: '7 hari',
    rangeDescription: 'Grafik dan hitungan user aktif memakai rentang 7 hari terakhir.',
    activeUsers: 510,
    totalUsers: 2_291,
    newUsers30d: 1_895,
    totalDepositBalance: 20_522_293,
    totalWithdrawableBalance: 1_647_185_000,
    cashflow: summarizeCashflow(SERIES_7D),
    activeBreakdown: {
      conditions: [
        {
          id: 'running-product',
          title: 'Punya produk berjalan',
          type: 'inti',
          description: 'Investasi berstatus aktif dan masih ada sisa klaim',
          count: 510,
        },
        {
          id: 'buying-product',
          title: 'Masih beli produk',
          type: 'inti',
          description: 'Ada pembelian produk dalam 7 hari terakhir',
          count: 138,
        },
        {
          id: 'claiming-product',
          title: 'Masih klaim produk',
          type: 'inti',
          description: 'Ada klaim dalam 7 hari terakhir',
          count: 490,
        },
        {
          id: 'has-balance',
          title: 'Masih punya saldo',
          type: 'tambahan',
          description: 'Saldo deposit atau saldo bisa ditarik masih di atas nol',
          count: 528,
        },
        {
          id: 'approved-topup',
          title: 'Top up disetujui',
          type: 'tambahan',
          description: 'Top up disetujui dalam 7 hari terakhir',
          count: 140,
        },
        {
          id: 'transacting',
          title: 'Masih bertransaksi',
          type: 'tambahan',
          description: 'Transaksi apa pun dalam 7 hari terakhir',
          count: 509,
        },
      ],
      coreTotal: 510,
      withAdditionalTotal: 598,
      passiveCount: 5,
      notStartedCount: 1_776,
    },
    operational: { ...BASE_OPERATIONAL },
    lifetime: { ...LIFETIME_METRICS },
  },
  '30d': {
    range: '30d',
    rangeLabel: '30 hari',
    rangeDescription: 'Grafik dan hitungan user aktif memakai rentang 30 hari terakhir.',
    activeUsers: 564,
    totalUsers: 2_291,
    newUsers30d: 1_895,
    totalDepositBalance: 20_522_293,
    totalWithdrawableBalance: 1_647_185_000,
    cashflow: summarizeCashflow(SERIES_30D),
    activeBreakdown: {
      conditions: [
        {
          id: 'running-product',
          title: 'Punya produk berjalan',
          type: 'inti',
          description: 'Investasi berstatus aktif dan masih ada sisa klaim',
          count: 510,
        },
        {
          id: 'buying-product',
          title: 'Masih beli produk',
          type: 'inti',
          description: 'Ada pembelian produk dalam 30 hari terakhir',
          count: 428,
        },
        {
          id: 'claiming-product',
          title: 'Masih klaim produk',
          type: 'inti',
          description: 'Ada klaim dalam 30 hari terakhir',
          count: 548,
        },
        {
          id: 'has-balance',
          title: 'Masih punya saldo',
          type: 'tambahan',
          description: 'Saldo deposit atau saldo bisa ditarik masih di atas nol',
          count: 528,
        },
        {
          id: 'approved-topup',
          title: 'Top up disetujui',
          type: 'tambahan',
          description: 'Top up disetujui dalam 30 hari terakhir',
          count: 462,
        },
        {
          id: 'transacting',
          title: 'Masih bertransaksi',
          type: 'tambahan',
          description: 'Transaksi apa pun dalam 30 hari terakhir',
          count: 589,
        },
      ],
      coreTotal: 564,
      withAdditionalTotal: 642,
      passiveCount: 19,
      notStartedCount: 1_708,
    },
    operational: { ...BASE_OPERATIONAL },
    lifetime: { ...LIFETIME_METRICS },
  },
  '90d': {
    range: '90d',
    rangeLabel: '90 hari',
    rangeDescription: 'Grafik dan hitungan user aktif memakai rentang 90 hari terakhir.',
    activeUsers: 612,
    totalUsers: 2_291,
    newUsers30d: 1_895,
    totalDepositBalance: 20_522_293,
    totalWithdrawableBalance: 1_647_185_000,
    cashflow: summarizeCashflow(SERIES_90D),
    activeBreakdown: {
      conditions: [
        {
          id: 'running-product',
          title: 'Punya produk berjalan',
          type: 'inti',
          description: 'Investasi berstatus aktif dan masih ada sisa klaim',
          count: 510,
        },
        {
          id: 'buying-product',
          title: 'Masih beli produk',
          type: 'inti',
          description: 'Ada pembelian produk dalam 90 hari terakhir',
          count: 540,
        },
        {
          id: 'claiming-product',
          title: 'Masih klaim produk',
          type: 'inti',
          description: 'Ada klaim dalam 90 hari terakhir',
          count: 598,
        },
        {
          id: 'has-balance',
          title: 'Masih punya saldo',
          type: 'tambahan',
          description: 'Saldo deposit atau saldo bisa ditarik masih di atas nol',
          count: 528,
        },
        {
          id: 'approved-topup',
          title: 'Top up disetujui',
          type: 'tambahan',
          description: 'Top up disetujui dalam 90 hari terakhir',
          count: 565,
        },
        {
          id: 'transacting',
          title: 'Masih bertransaksi',
          type: 'tambahan',
          description: 'Transaksi apa pun dalam 90 hari terakhir',
          count: 634,
        },
      ],
      coreTotal: 612,
      withAdditionalTotal: 688,
      passiveCount: 31,
      notStartedCount: 1_648,
    },
    operational: { ...BASE_OPERATIONAL },
    lifetime: { ...LIFETIME_METRICS },
  },
  '1y': {
    range: '1y',
    rangeLabel: '1 tahun',
    rangeDescription: 'Grafik dan hitungan user aktif memakai rentang 1 tahun terakhir.',
    activeUsers: 658,
    totalUsers: 2_291,
    newUsers30d: 1_895,
    totalDepositBalance: 20_522_293,
    totalWithdrawableBalance: 1_647_185_000,
    cashflow: summarizeCashflow(SERIES_1Y),
    activeBreakdown: {
      conditions: [
        {
          id: 'running-product',
          title: 'Punya produk berjalan',
          type: 'inti',
          description: 'Investasi berstatus aktif dan masih ada sisa klaim',
          count: 510,
        },
        {
          id: 'buying-product',
          title: 'Masih beli produk',
          type: 'inti',
          description: 'Ada pembelian produk dalam 1 tahun terakhir',
          count: 612,
        },
        {
          id: 'claiming-product',
          title: 'Masih klaim produk',
          type: 'inti',
          description: 'Ada klaim dalam 1 tahun terakhir',
          count: 644,
        },
        {
          id: 'has-balance',
          title: 'Masih punya saldo',
          type: 'tambahan',
          description: 'Saldo deposit atau saldo bisa ditarik masih di atas nol',
          count: 528,
        },
        {
          id: 'approved-topup',
          title: 'Top up disetujui',
          type: 'tambahan',
          description: 'Top up disetujui dalam 1 tahun terakhir',
          count: 638,
        },
        {
          id: 'transacting',
          title: 'Masih bertransaksi',
          type: 'tambahan',
          description: 'Transaksi apa pun dalam 1 tahun terakhir',
          count: 679,
        },
      ],
      coreTotal: 658,
      withAdditionalTotal: 724,
      passiveCount: 44,
      notStartedCount: 1_589,
    },
    operational: { ...BASE_OPERATIONAL },
    lifetime: { ...LIFETIME_METRICS },
  },
};

export function getDashboardSnapshot(range: TimeRange): DashboardSnapshot {
  return DashboardSnapshotSchema.parse(RAW_SNAPSHOTS[range]);
}

export const INITIAL_QUEUE_TRANSACTIONS: QueueTransaction[] = [
  {
    id: 'TU-261114-001',
    userName: 'Rizky Pratama',
    userEmail: 'rizky.pratama@mail.id',
    type: 'topup',
    channel: 'BCA Virtual Account',
    amount: 1_500_000,
    submittedAt: '14 Nov 2026 · 16:42',
    status: 'menunggu',
  },
  {
    id: 'TU-261114-002',
    userName: 'Siti Nurhaliza',
    userEmail: 'siti.nur@mail.id',
    type: 'topup',
    channel: 'Mandiri Transfer',
    amount: 1_250_000,
    submittedAt: '14 Nov 2026 · 16:18',
    status: 'menunggu',
  },
  {
    id: 'TU-261114-003',
    userName: 'Budi Santoso',
    userEmail: 'budi.santoso@mail.id',
    type: 'topup',
    channel: 'QRIS Instan',
    amount: 850_000,
    submittedAt: '14 Nov 2026 · 15:54',
    status: 'menunggu',
  },
  {
    id: 'TU-261114-004',
    userName: 'Dewi Anggraini',
    userEmail: 'dewi.anggraini@mail.id',
    type: 'topup',
    channel: 'BRI Virtual Account',
    amount: 1_500_000,
    submittedAt: '14 Nov 2026 · 15:11',
    status: 'menunggu',
  },
  {
    id: 'TU-261114-005',
    userName: 'Hendra Wijaya',
    userEmail: 'hendra.w@mail.id',
    type: 'topup',
    channel: 'BNI Virtual Account',
    amount: 1_000_000,
    submittedAt: '14 Nov 2026 · 14:47',
    status: 'menunggu',
  },
  {
    id: 'WD-261114-101',
    userName: 'Adi Kurniawan',
    userEmail: 'adi.kurniawan@mail.id',
    type: 'withdrawal',
    channel: 'Bank BCA · 882104412',
    amount: 4_250_000,
    submittedAt: '14 Nov 2026 · 16:50',
    status: 'menunggu',
  },
  {
    id: 'WD-261114-102',
    userName: 'Nadia Kusuma',
    userEmail: 'nadia.kusuma@mail.id',
    type: 'withdrawal',
    channel: 'Bank Mandiri · 137000492',
    amount: 2_850_000,
    submittedAt: '14 Nov 2026 · 16:33',
    status: 'menunggu',
  },
  {
    id: 'WD-261114-103',
    userName: 'Fajar Maulana',
    userEmail: 'fajar.maulana@mail.id',
    type: 'withdrawal',
    channel: 'Bank BRI · 041901002',
    amount: 1_900_000,
    submittedAt: '14 Nov 2026 · 16:09',
    status: 'menunggu',
  },
  {
    id: 'WD-261114-104',
    userName: 'Lestari Putri',
    userEmail: 'lestari.putri@mail.id',
    type: 'withdrawal',
    channel: 'Bank BNI · 092441812',
    amount: 3_500_000,
    submittedAt: '14 Nov 2026 · 15:40',
    status: 'menunggu',
  },
  {
    id: 'WD-261114-105',
    userName: 'Yusuf Ramadhan',
    userEmail: 'yusuf.ramadhan@mail.id',
    type: 'withdrawal',
    channel: 'Bank CIMB · 704129910',
    amount: 1_250_000,
    submittedAt: '14 Nov 2026 · 15:02',
    status: 'menunggu',
  },
];

export const INVESTMENT_PRODUCTS: InvestmentProduct[] = [
  {
    id: 'PRD-01',
    name: 'Reksa Energi Surya Nusantara',
    category: 'Infrastruktur Hijau',
    imageUrl: '/src/assets/images/product_solar_energy_1794705588627.jpg',
    minCapital: 1_000_000,
    tenorDays: 30,
    dailyReturnRate: 1.45,
    claimIncome: 14_500,
    commissionType: 'percent',
    commissionRate: 5,
    maxPerUser: 5,
    stockMode: 'limited',
    activeHolders: 312,
    totalCapitalIn: 542_000_000,
    allowedLevels: [1, 2, 3, 4, 5, 6, 7, 8],
    status: 'aktif',
  },
  {
    id: 'PRD-02',
    name: 'Logistik Rantai Dingin Jawa',
    category: 'Rantai Pasok',
    imageUrl: '/src/assets/images/product_cold_logistics_1794705587811.jpg',
    minCapital: 1_500_000,
    tenorDays: 45,
    dailyReturnRate: 1.65,
    claimIncome: 24_750,
    commissionType: 'percent',
    commissionRate: 5,
    maxPerUser: 3,
    stockMode: 'limited',
    activeHolders: 268,
    totalCapitalIn: 468_500_000,
    allowedLevels: [1, 2, 3, 4, 5, 6, 7, 8],
    status: 'aktif',
  },
  {
    id: 'PRD-03',
    name: 'Obligasi Mikro UMKM Digital',
    category: 'Pembiayaan Produktif',
    imageUrl: '/src/assets/images/product_umkm_digital_1794705590783.jpg',
    minCapital: 500_000,
    tenorDays: 21,
    dailyReturnRate: 1.25,
    claimIncome: 6_250,
    commissionType: 'percent',
    commissionRate: 3,
    maxPerUser: 10,
    stockMode: 'limited',
    activeHolders: 384,
    totalCapitalIn: 318_200_000,
    allowedLevels: [1, 2, 3, 4, 5, 6, 7, 8],
    status: 'aktif',
  },
  {
    id: 'PRD-04',
    name: 'Armada EV Komersial Jabodetabek',
    category: 'Mobilitas Bersih',
    imageUrl: '/src/assets/images/product_ev_fleet_1794705588861.jpg',
    minCapital: 2_500_000,
    tenorDays: 60,
    dailyReturnRate: 1.8,
    claimIncome: 45_000,
    commissionType: 'percent',
    commissionRate: 6,
    maxPerUser: 2,
    stockMode: 'limited',
    activeHolders: 194,
    totalCapitalIn: 412_610_000,
    allowedLevels: [2, 3, 4, 5, 6, 7, 8],
    status: 'aktif',
  },
  {
    id: 'PRD-05',
    name: 'Pusat Data Regional Batam',
    category: 'Infrastruktur Digital',
    imageUrl: '/src/assets/images/product_data_center_1794705590000.jpg',
    minCapital: 2_000_000,
    tenorDays: 45,
    dailyReturnRate: 1.55,
    claimIncome: 31_000,
    commissionType: 'percent',
    commissionRate: 5,
    maxPerUser: 3,
    stockMode: 'limited',
    activeHolders: 138,
    totalCapitalIn: 206_500_000,
    allowedLevels: [1, 2, 3, 4, 5, 6, 7, 8],
    status: 'aktif',
  },
  {
    id: 'PRD-06',
    name: 'Agribisnis Hidroponik Seri A',
    category: 'Agroteknologi',
    imageUrl: '/src/assets/images/product_hydroponic_farm_1794705590697.jpg',
    minCapital: 750_000,
    tenorDays: 30,
    dailyReturnRate: 1.35,
    claimIncome: 10_125,
    commissionType: 'percent',
    commissionRate: 4,
    maxPerUser: 5,
    stockMode: 'limited',
    activeHolders: 0,
    totalCapitalIn: 0,
    allowedLevels: [1, 2, 3, 4, 5, 6, 7, 8],
    status: 'nonaktif',
  },
];

export const ADMIN_USER_RECORDS: AdminUserRecord[] = [
  {
    id: 'USR-2303',
    userNumber: 2303,
    name: 'Risma',
    email: 'rismamulyani225@gmail.com',
    emailVerified: false,
    phone: '0896-0835-9465',
    whatsappRaw: '6289608359465',
    invitedBy: '#2302 moana',
    registeredAt: '15 Nov 2026 07:56',
    segment: 'belum_mulai',
    accountStatus: 'aktif',
    inactiveDays: 0,
    inactiveNote: 'Baru mendaftar · Belum bertransaksi',
    depositBalance: 0,
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
    joinedAt: '15 Nov 2026',
    lastActivity: '15 Nov 2026 · Registrasi akun',
    statusHistory: [],
    topUps: [],
    withdrawals: [],
    investments: [],
    transactions: [],
    banks: [],
    referrals: [],
  },
  {
    id: 'USR-8812',
    userNumber: 2298,
    name: 'Rizky Pratama',
    email: 'rizky.pratama@mail.id',
    emailVerified: true,
    phone: '0812-8491-2201',
    whatsappRaw: '6281284912201',
    invitedBy: '#2104 arif',
    registeredAt: '22 Okt 2026 14:12',
    segment: 'aktif',
    accountStatus: 'aktif',
    inactiveDays: 0,
    inactiveNote: 'Aktif bertransaksi',
    depositBalance: 2_450_000,
    withdrawableBalance: 6_820_000,
    totalTopUp: 12_500_000,
    totalTopUpCount: 4,
    totalWithdrawal: 3_200_000,
    totalWithdrawalCount: 2,
    totalInvestmentModal: 8_500_000,
    totalInvestmentCount: 5,
    activeInvestmentCount: 3,
    totalExpectedReturn: 12_150_000,
    totalEarnedReturn: 5_420_000,
    remainingExpectedReturn: 6_730_000,
    cashbackReceived: 185_000,
    referralCommissionReceived: 425_000,
    voucherClaimed: 100_000,
    runningProducts: 3,
    joinedAt: '22 Okt 2026',
    lastActivity: '14 Nov 2026 · Klaim produk',
    statusHistory: [],
    topUps: [
      { id: 'TU-8812-01', amount: 5_000_000, channel: 'BCA Virtual Account', status: 'disetujui', createdAt: '12 Nov 2026 09:30' },
      { id: 'TU-8812-02', amount: 3_500_000, channel: 'Mandiri Transfer', status: 'disetujui', createdAt: '02 Nov 2026 16:15' },
    ],
    withdrawals: [
      { id: 'WD-8812-01', amount: 2_000_000, destination: 'Bank BCA · 882104412', status: 'disetujui', createdAt: '10 Nov 2026 11:20' },
      { id: 'WD-8812-02', amount: 1_200_000, destination: 'Bank BCA · 882104412', status: 'disetujui', createdAt: '29 Okt 2026 15:04' },
    ],
    investments: [
      { id: 'INV-8812-01', productName: 'Reksa Energi Surya Nusantara', capital: 3_000_000, expectedReturn: 4_305_000, earnedReturn: 2_152_500, status: 'aktif', startedAt: '30 Okt 2026' },
      { id: 'INV-8812-02', productName: 'Armada EV Komersial Jabodetabek', capital: 2_500_000, expectedReturn: 3_750_000, earnedReturn: 1_450_000, status: 'aktif', startedAt: '04 Nov 2026' },
    ],
    transactions: [
      { id: 'TRX-8812-01', type: 'Klaim Harian', description: 'Klaim hasil Reksa Energi Surya Nusantara', amount: 43_500, createdAt: '14 Nov 2026 08:05' },
      { id: 'TRX-8812-02', type: 'Top Up', description: 'Top Up via BCA Virtual Account', amount: 5_000_000, createdAt: '12 Nov 2026 09:30' },
    ],
    banks: [
      { id: 'BNK-8812-01', accountType: 'bank', bankName: 'Bank BCA', accountNumber: '8821044129', accountHolder: 'Rizky Pratama', isPrimary: true },
    ],
    referrals: [
      { id: 'REF-8812-01', userName: '#2299 Hendra Wijaya', joinedAt: '05 Nov 2026', commissionEarned: 250_000, status: 'aktif' },
      { id: 'REF-8812-02', userName: '#2301 Nadia Kusuma', joinedAt: '09 Nov 2026', commissionEarned: 175_000, status: 'aktif' },
    ],
  },
  {
    id: 'USR-8804',
    userNumber: 2295,
    name: 'Siti Nurhaliza',
    email: 'siti.nur@mail.id',
    emailVerified: true,
    phone: '0813-7724-5190',
    whatsappRaw: '6281377245190',
    invitedBy: null,
    registeredAt: '19 Okt 2026 10:28',
    segment: 'aktif',
    accountStatus: 'aktif',
    inactiveDays: 0,
    inactiveNote: 'Aktif bertransaksi',
    depositBalance: 1_120_000,
    withdrawableBalance: 4_390_000,
    totalTopUp: 7_800_000,
    totalTopUpCount: 3,
    totalWithdrawal: 1_500_000,
    totalWithdrawalCount: 1,
    totalInvestmentModal: 5_000_000,
    totalInvestmentCount: 2,
    activeInvestmentCount: 2,
    totalExpectedReturn: 7_200_000,
    totalEarnedReturn: 3_110_000,
    remainingExpectedReturn: 4_090_000,
    cashbackReceived: 95_000,
    referralCommissionReceived: 150_000,
    voucherClaimed: 50_000,
    runningProducts: 2,
    joinedAt: '19 Okt 2026',
    lastActivity: '14 Nov 2026 · Top up menunggu',
    statusHistory: [],
    topUps: [
      { id: 'TU-8804-01', amount: 1_250_000, channel: 'Mandiri Transfer', status: 'menunggu', createdAt: '14 Nov 2026 16:18' },
    ],
    withdrawals: [
      { id: 'WD-8804-01', amount: 1_500_000, destination: 'Bank Mandiri · 137000492', status: 'disetujui', createdAt: '07 Nov 2026 13:45' },
    ],
    investments: [
      { id: 'INV-8804-01', productName: 'Logistik Rantai Dingin Jawa', capital: 3_000_000, expectedReturn: 4_450_000, earnedReturn: 2_100_000, status: 'aktif', startedAt: '25 Okt 2026' },
    ],
    transactions: [
      { id: 'TRX-8804-01', type: 'Klaim Harian', description: 'Klaim Logistik Rantai Dingin Jawa', amount: 49_500, createdAt: '14 Nov 2026 09:00' },
    ],
    banks: [
      { id: 'BNK-8804-01', accountType: 'bank', bankName: 'Bank Mandiri', accountNumber: '13700049218', accountHolder: 'Siti Nurhaliza', isPrimary: true },
    ],
    referrals: [
      { id: 'REF-8804-01', userName: '#2300 Dewi Anggraini', joinedAt: '03 Nov 2026', commissionEarned: 150_000, status: 'aktif' },
    ],
  },
  {
    id: 'USR-8791',
    userNumber: 2290,
    name: 'Adi Kurniawan',
    email: 'adi.kurniawan@mail.id',
    emailVerified: true,
    phone: '0821-4092-1188',
    whatsappRaw: '6282140921188',
    invitedBy: '#2100 admin',
    registeredAt: '15 Okt 2026 09:15',
    segment: 'aktif',
    accountStatus: 'aktif',
    inactiveDays: 0,
    inactiveNote: 'Aktif bertransaksi',
    depositBalance: 450_000,
    withdrawableBalance: 9_150_000,
    totalTopUp: 18_000_000,
    totalTopUpCount: 6,
    totalWithdrawal: 6_500_000,
    totalWithdrawalCount: 3,
    totalInvestmentModal: 14_500_000,
    totalInvestmentCount: 6,
    activeInvestmentCount: 4,
    totalExpectedReturn: 21_400_000,
    totalEarnedReturn: 11_200_000,
    remainingExpectedReturn: 10_200_000,
    cashbackReceived: 240_000,
    referralCommissionReceived: 620_000,
    voucherClaimed: 150_000,
    runningProducts: 4,
    joinedAt: '15 Okt 2026',
    lastActivity: '14 Nov 2026 · Ajukan withdrawal',
    statusHistory: [],
    topUps: [
      { id: 'TU-8791-01', amount: 5_000_000, channel: 'BRI Virtual Account', status: 'disetujui', createdAt: '01 Nov 2026 10:20' },
    ],
    withdrawals: [
      { id: 'WD-8791-01', amount: 4_250_000, destination: 'Bank BCA · 882104412', status: 'menunggu', createdAt: '14 Nov 2026 16:50' },
    ],
    investments: [
      { id: 'INV-8791-01', productName: 'Pusat Data Regional Batam', capital: 4_000_000, expectedReturn: 5_900_000, earnedReturn: 3_100_000, status: 'aktif', startedAt: '21 Okt 2026' },
    ],
    transactions: [
      { id: 'TRX-8791-01', type: 'Withdrawal', description: 'Pengajuan withdrawal ke Bank BCA', amount: -4_250_000, createdAt: '14 Nov 2026 16:50' },
    ],
    banks: [
      { id: 'BNK-8791-01', accountType: 'bank', bankName: 'Bank BCA', accountNumber: '882104412', accountHolder: 'Adi Kurniawan', isPrimary: true },
    ],
    referrals: [],
  },
  {
    id: 'USR-8410',
    userNumber: 2140,
    name: 'Bagus Setiawan',
    email: 'bagus.setiawan@mail.id',
    emailVerified: true,
    phone: '0856-9120-4432',
    whatsappRaw: '6285691204432',
    invitedBy: '#2018 rudi',
    registeredAt: '02 Sep 2026 18:04',
    segment: 'pasif',
    accountStatus: 'nonaktif',
    inactiveDays: 27,
    inactiveNote: 'Tidak ada produk berjalan',
    depositBalance: 125_000,
    withdrawableBalance: 0,
    totalTopUp: 1_500_000,
    totalTopUpCount: 1,
    totalWithdrawal: 1_950_000,
    totalWithdrawalCount: 1,
    totalInvestmentModal: 1_500_000,
    totalInvestmentCount: 1,
    activeInvestmentCount: 0,
    totalExpectedReturn: 2_075_000,
    totalEarnedReturn: 2_075_000,
    remainingExpectedReturn: 0,
    cashbackReceived: 25_000,
    referralCommissionReceived: 0,
    voucherClaimed: 0,
    runningProducts: 0,
    joinedAt: '02 Sep 2026',
    lastActivity: '18 Okt 2026 · Produk selesai',
    statusHistory: [
      {
        id: 'ST-2140-1',
        action: 'dinonaktifkan',
        timestamp: '10 Nov 2026 09:15',
        actor: 'Sistem Monitoring',
        reason: 'Tidak ada produk berjalan selama > 20 hari',
      },
    ],
    topUps: [
      { id: 'TU-8410-01', amount: 1_500_000, channel: 'BNI Virtual Account', status: 'disetujui', createdAt: '03 Sep 2026 11:00' },
    ],
    withdrawals: [
      { id: 'WD-8410-01', amount: 1_950_000, destination: 'Bank BNI · 092118822', status: 'disetujui', createdAt: '18 Okt 2026 14:22' },
    ],
    investments: [
      { id: 'INV-8410-01', productName: 'Obligasi Mikro UMKM Digital', capital: 1_500_000, expectedReturn: 2_075_000, earnedReturn: 2_075_000, status: 'selesai', startedAt: '04 Sep 2026' },
    ],
    transactions: [
      { id: 'TRX-8410-01', type: 'Selesai Kontrak', description: 'Obligasi Mikro UMKM Digital lunas', amount: 575_000, createdAt: '18 Okt 2026 08:00' },
    ],
    banks: [
      { id: 'BNK-8410-01', accountType: 'bank', bankName: 'Bank BNI', accountNumber: '092118822', accountHolder: 'Bagus Setiawan', isPrimary: true },
    ],
    referrals: [],
  },
  {
    id: 'USR-8398',
    userNumber: 2118,
    name: 'Tania Maharani',
    email: 'tania.maharani@mail.id',
    emailVerified: true,
    phone: '0817-6304-8821',
    whatsappRaw: '6281763048821',
    invitedBy: null,
    registeredAt: '28 Agu 2026 13:40',
    segment: 'pasif',
    accountStatus: 'nonaktif',
    inactiveDays: 20,
    inactiveNote: 'Berhenti setelah withdrawal',
    depositBalance: 0,
    withdrawableBalance: 350_000,
    totalTopUp: 2_000_000,
    totalTopUpCount: 2,
    totalWithdrawal: 2_350_000,
    totalWithdrawalCount: 1,
    totalInvestmentModal: 2_000_000,
    totalInvestmentCount: 1,
    activeInvestmentCount: 0,
    totalExpectedReturn: 2_700_000,
    totalEarnedReturn: 2_700_000,
    remainingExpectedReturn: 0,
    cashbackReceived: 30_000,
    referralCommissionReceived: 45_000,
    voucherClaimed: 25_000,
    runningProducts: 0,
    joinedAt: '28 Agu 2026',
    lastActivity: '25 Okt 2026 · Withdrawal disetujui',
    statusHistory: [
      {
        id: 'ST-2118-1',
        action: 'dinonaktifkan',
        timestamp: '12 Nov 2026 16:00',
        actor: 'Alfaciro Admin',
        reason: 'Berhenti setelah withdrawal penuh',
      },
    ],
    topUps: [],
    withdrawals: [
      { id: 'WD-8398-01', amount: 2_350_000, destination: 'Bank Mandiri · 142009123', status: 'disetujui', createdAt: '25 Okt 2026 10:15' },
    ],
    investments: [],
    transactions: [],
    banks: [
      { id: 'BNK-8398-01', accountType: 'bank', bankName: 'Bank Mandiri', accountNumber: '142009123', accountHolder: 'Tania Maharani', isPrimary: true },
    ],
    referrals: [],
  },
  {
    id: 'USR-8105',
    userNumber: 1984,
    name: 'Rina Oktaviani',
    email: 'rina.oktaviani@mail.id',
    emailVerified: false,
    phone: '0819-4410-3287',
    whatsappRaw: '6281944103287',
    invitedBy: '#1920 sari',
    registeredAt: '14 Agu 2026 11:22',
    segment: 'pasif',
    accountStatus: 'nonaktif',
    inactiveDays: 38,
    inactiveNote: 'Tidak ada transaksi > 30 hari',
    depositBalance: 0,
    withdrawableBalance: 0,
    totalTopUp: 750_000,
    totalTopUpCount: 1,
    totalWithdrawal: 980_000,
    totalWithdrawalCount: 1,
    totalInvestmentModal: 750_000,
    totalInvestmentCount: 1,
    activeInvestmentCount: 0,
    totalExpectedReturn: 980_000,
    totalEarnedReturn: 980_000,
    remainingExpectedReturn: 0,
    cashbackReceived: 0,
    referralCommissionReceived: 0,
    voucherClaimed: 0,
    runningProducts: 0,
    joinedAt: '14 Agu 2026',
    lastActivity: '07 Okt 2026 · Klaim terakhir',
    statusHistory: [
      {
        id: 'ST-1984-1',
        action: 'dinonaktifkan',
        timestamp: '08 Nov 2026 08:30',
        actor: 'Alfaciro Admin',
        reason: 'Tidak ada transaksi lebih dari 30 hari',
      },
    ],
    topUps: [],
    withdrawals: [],
    investments: [],
    transactions: [],
    banks: [],
    referrals: [],
  },
  {
    id: 'USR-9102',
    userNumber: 2301,
    name: 'Dimas Saputra',
    email: 'dimas.saputra@mail.id',
    emailVerified: true,
    phone: '0852-1940-7765',
    whatsappRaw: '6285219407765',
    invitedBy: '#2298 rizky',
    registeredAt: '13 Nov 2026 19:41',
    segment: 'belum_mulai',
    accountStatus: 'nonaktif',
    inactiveDays: 1,
    inactiveNote: 'Belum top up & investasi',
    depositBalance: 0,
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
    joinedAt: '13 Nov 2026',
    lastActivity: '13 Nov 2026 · Registrasi akun',
    statusHistory: [],
    topUps: [],
    withdrawals: [],
    investments: [],
    transactions: [],
    banks: [],
    referrals: [],
  },
  {
    id: 'USR-9099',
    userNumber: 2300,
    name: 'Putri Ayuningtyas',
    email: 'putri.ayu@mail.id',
    emailVerified: false,
    phone: '0878-3310-6542',
    whatsappRaw: '6287833106542',
    invitedBy: null,
    registeredAt: '12 Nov 2026 15:09',
    segment: 'belum_mulai',
    accountStatus: 'nonaktif',
    inactiveDays: 2,
    inactiveNote: 'Belum top up & investasi',
    depositBalance: 0,
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
    joinedAt: '12 Nov 2026',
    lastActivity: '12 Nov 2026 · Verifikasi email',
    statusHistory: [],
    topUps: [],
    withdrawals: [],
    investments: [],
    transactions: [],
    banks: [],
    referrals: [],
  },
];

export const DEFAULT_ADMIN_SESSION: AdminSession = {
  userId: 'ADM-001',
  name: 'Alfaciro Admin',
  email: 'alfaciro05@gmail.com',
  role: 'Super Admin',
  sessionId: 'ba_sess_98a4f2c1',
};

export function updateQueueTransactionStatus(
  transactions: QueueTransaction[],
  txId: string,
  nextStatus: 'disetujui' | 'ditolak'
): {
  transactions: QueueTransaction[];
  deltaPendingTopUpCount: number;
  deltaPendingTopUpAmount: number;
  deltaPendingWithdrawalCount: number;
  deltaPendingWithdrawalAmount: number;
} {
  let deltaPendingTopUpCount = 0;
  let deltaPendingTopUpAmount = 0;
  let deltaPendingWithdrawalCount = 0;
  let deltaPendingWithdrawalAmount = 0;

  const updated = transactions.map((tx) => {
    const parsed = QueueTransactionSchema.parse(tx);
    if (parsed.id !== txId || parsed.status !== 'menunggu') {
      return parsed;
    }
    if (parsed.type === 'topup') {
      deltaPendingTopUpCount -= 1;
      deltaPendingTopUpAmount -= parsed.amount;
    } else {
      deltaPendingWithdrawalCount -= 1;
      deltaPendingWithdrawalAmount -= parsed.amount;
    }
    return {
      ...parsed,
      status: nextStatus,
    };
  });

  return {
    transactions: updated,
    deltaPendingTopUpCount,
    deltaPendingTopUpAmount,
    deltaPendingWithdrawalCount,
    deltaPendingWithdrawalAmount,
  };
}

export function buildDashboardCsv(snapshot: DashboardSnapshot): string {
  const rows: string[][] = [
    ['Bagian', 'Metrik', 'Nilai', 'Keterangan'],
    ['Ringkasan', 'Rentang Filter', snapshot.rangeLabel, snapshot.rangeDescription],
    ['Ringkasan', 'User Aktif', formatNumber(snapshot.activeUsers), `${snapshot.rangeLabel} terakhir`],
    ['Ringkasan', 'Total User', formatNumber(snapshot.totalUsers), `+${formatNumber(snapshot.newUsers30d)} user baru dalam 30 hari`],
    ['Ringkasan', 'Total Saldo Deposit', formatRupiah(snapshot.totalDepositBalance), 'Uang user yang tersimpan di platform'],
    ['Ringkasan', 'Total Saldo Bisa Ditarik', formatRupiah(snapshot.totalWithdrawableBalance), 'Kewajiban yang bisa ditarik user'],
    ['Arus Kas', 'Top Up Disetujui', formatRupiah(snapshot.cashflow.topUpTotal), `Rentang ${snapshot.rangeLabel}`],
    ['Arus Kas', 'Withdrawal Disetujui', formatRupiah(snapshot.cashflow.withdrawalTotal), `Rentang ${snapshot.rangeLabel}`],
    ['Arus Kas', 'Selisih', formatSignedRupiah(snapshot.cashflow.difference), 'Top Up dikurangi Withdrawal'],
    ['Arus Kas', 'Top up tertinggi', formatRupiah(snapshot.cashflow.peakTopUpAmount), snapshot.cashflow.peakTopUpDate],
    ['Arus Kas', 'Withdrawal tertinggi', formatRupiah(snapshot.cashflow.peakWithdrawalAmount), snapshot.cashflow.peakWithdrawalDate],
  ];

  for (const cond of snapshot.activeBreakdown.conditions) {
    rows.push(['Syarat User Aktif', `${cond.title} (${cond.type})`, formatNumber(cond.count), cond.description]);
  }

  rows.push(['Di Luar Kriteria Aktif', 'Pasif', formatNumber(snapshot.activeBreakdown.passiveCount), 'Pernah top up atau investasi tanpa syarat inti']);
  rows.push(['Di Luar Kriteria Aktif', 'Belum mulai', formatNumber(snapshot.activeBreakdown.notStartedCount), 'Belum pernah top up atau investasi']);
  rows.push(['Operasional', 'Top Up Menunggu', formatNumber(snapshot.operational.pendingTopUpCount), formatRupiah(snapshot.operational.pendingTopUpAmount)]);
  rows.push(['Operasional', 'Withdrawal Menunggu', formatNumber(snapshot.operational.pendingWithdrawalCount), formatRupiah(snapshot.operational.pendingWithdrawalAmount)]);
  rows.push(['Operasional', 'Produk Berjalan', formatNumber(snapshot.operational.runningProductsCount), formatRupiah(snapshot.operational.runningProductsCapital)]);
  rows.push(['Operasional', 'Produk Aktif', formatNumber(snapshot.operational.activeProductsCount), `dari ${snapshot.operational.totalCatalogProducts} produk di katalog`]);
  rows.push(['Seumur Hidup', 'Total Top Up Disetujui', formatRupiah(snapshot.lifetime.totalApprovedTopUp), 'Akumulasi seumur hidup']);
  rows.push(['Seumur Hidup', 'Total Withdrawal Disetujui', formatRupiah(snapshot.lifetime.totalApprovedWithdrawal), 'Akumulasi seumur hidup']);
  rows.push(['Seumur Hidup', 'Total Klaim Dibayarkan', formatRupiah(snapshot.lifetime.totalClaimsPaid), 'Akumulasi seumur hidup']);
  rows.push(['Seumur Hidup', 'Sisa Estimasi Hasil', formatRupiah(snapshot.lifetime.remainingEstimatedYield), 'Akumulasi seumur hidup']);

  return rows
    .map((cols) => cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function getNextProductId(products: InvestmentProduct[]): string {
  let maxNum = 0;
  for (const item of products) {
    const match = /^PRD-(\d+)$/i.exec(item.id);
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `PRD-${String(maxNum + 1).padStart(2, '0')}`;
}

export function addInvestmentProduct(
  products: InvestmentProduct[],
  newProduct: InvestmentProduct
): InvestmentProduct[] {
  const candidate: InvestmentProduct = {
    ...newProduct,
    id: newProduct.id.trim() || getNextProductId(products),
  };
  const validated = InvestmentProductSchema.parse(candidate);
  return [validated, ...products];
}

export function updateInvestmentProduct(
  products: InvestmentProduct[],
  updatedProduct: InvestmentProduct
): InvestmentProduct[] {
  const validated = InvestmentProductSchema.parse(updatedProduct);
  return products.map((item) => (item.id === validated.id ? validated : item));
}

export function deleteInvestmentProduct(
  products: InvestmentProduct[],
  productId: string
): InvestmentProduct[] {
  return products.filter((item) => item.id !== productId);
}

export const PRODUCTS_STORAGE_KEY = 'finvault_products_v1';
const PRODUCTS_UPDATED_EVENT = 'finvault:products-updated';

let cachedRawProductsJson: string | null = null;
let cachedProductsSnapshot: InvestmentProduct[] = INVESTMENT_PRODUCTS;

export function parseStoredProducts(rawJson: string | null): InvestmentProduct[] | null {
  if (!rawJson) return null;
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const validated: InvestmentProduct[] = [];
    for (const item of parsed) {
      const result = InvestmentProductSchema.safeParse(item);
      if (!result.success) return null;
      validated.push(result.data);
    }
    return validated;
  } catch {
    return null;
  }
}

export function getStoredProductsSnapshot(): InvestmentProduct[] {
  if (typeof window === 'undefined') {
    return INVESTMENT_PRODUCTS;
  }
  try {
    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw === cachedRawProductsJson) {
      return cachedProductsSnapshot;
    }
    const parsed = parseStoredProducts(raw);
    cachedRawProductsJson = raw;
    cachedProductsSnapshot = parsed ?? INVESTMENT_PRODUCTS;
    return cachedProductsSnapshot;
  } catch {
    return INVESTMENT_PRODUCTS;
  }
}

export function getServerProductsSnapshot(): InvestmentProduct[] {
  return INVESTMENT_PRODUCTS;
}

export function subscribeStoredProducts(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === PRODUCTS_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustom = () => {
    onStoreChange();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(PRODUCTS_UPDATED_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleCustom);
  };
}

export function saveStoredProducts(products: ReadonlyArray<InvestmentProduct>): void {
  if (typeof window === 'undefined') return;
  try {
    const validated = products.map((item) => InvestmentProductSchema.parse(item));
    const json = JSON.stringify(validated);
    cachedRawProductsJson = json;
    cachedProductsSnapshot = validated;
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, json);
    window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
  } catch {
    // Ignore storage quota or serialization errors
  }
}

export type UserSegmentFilter = 'semua' | 'aktif' | 'nonaktif' | 'pasif' | 'belum_mulai';

export function getNonActiveUserSummary(breakdown: DashboardSnapshot['activeBreakdown']): {
  totalNonActive: number;
  passiveCount: number;
  notStartedCount: number;
} {
  return {
    totalNonActive: breakdown.passiveCount + breakdown.notStartedCount,
    passiveCount: breakdown.passiveCount,
    notStartedCount: breakdown.notStartedCount,
  };
}

export function filterAdminUsers(
  users: AdminUserRecord[],
  options: { segmentFilter: UserSegmentFilter; query: string }
): AdminUserRecord[] {
  const { segmentFilter, query } = options;
  return users.filter((u) => {
    if (segmentFilter === 'nonaktif') {
      if (u.accountStatus !== 'nonaktif') return false;
    } else if (segmentFilter !== 'semua' && u.segment !== segmentFilter) {
      return false;
    }

    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const normalizedQ = q.replace(/[-\s]/g, '');
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.inactiveNote.toLowerCase().includes(q) ||
      (normalizedQ.length > 0 && u.phone.replace(/[-\s]/g, '').includes(normalizedQ))
    );
  });
}

export const USERS_STORAGE_KEY = 'naturerepublic_users_v1';
const USERS_UPDATED_EVENT = 'naturerepublic:users-updated';

let cachedRawUsersJson: string | null = null;
let cachedUsersSnapshot: AdminUserRecord[] = ADMIN_USER_RECORDS;

export function parseStoredUsers(rawJson: string | null): AdminUserRecord[] | null {
  if (!rawJson) return null;
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const validated: AdminUserRecord[] = [];
    for (const item of parsed) {
      const result = AdminUserRecordSchema.safeParse(item);
      if (!result.success) return null;
      validated.push(result.data);
    }
    return validated;
  } catch {
    return null;
  }
}

export function getStoredUsersSnapshot(): AdminUserRecord[] {
  if (typeof window === 'undefined') {
    return ADMIN_USER_RECORDS;
  }
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (raw === cachedRawUsersJson) {
      return cachedUsersSnapshot;
    }
    const parsed = parseStoredUsers(raw);
    cachedRawUsersJson = raw;
    cachedUsersSnapshot = parsed ?? ADMIN_USER_RECORDS;
    return cachedUsersSnapshot;
  } catch {
    return ADMIN_USER_RECORDS;
  }
}

export function getServerUsersSnapshot(): AdminUserRecord[] {
  return ADMIN_USER_RECORDS;
}

export function subscribeStoredUsers(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === USERS_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustom = () => {
    onStoreChange();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(USERS_UPDATED_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(USERS_UPDATED_EVENT, handleCustom);
  };
}

export function saveStoredUsers(users: ReadonlyArray<AdminUserRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    const validated = users.map((item) => AdminUserRecordSchema.parse(item));
    const json = JSON.stringify(validated);
    cachedRawUsersJson = json;
    cachedUsersSnapshot = validated;
    window.localStorage.setItem(USERS_STORAGE_KEY, json);
    window.dispatchEvent(new Event(USERS_UPDATED_EVENT));
  } catch {
    // Ignore storage quota or serialization errors
  }
}

