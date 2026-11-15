import { z } from 'zod';

export const TimeRangeSchema = z.enum(['7d', '30d', '90d', '1y']);
export type TimeRange = z.infer<typeof TimeRangeSchema>;

export const ActiveConditionTypeSchema = z.enum(['inti', 'tambahan']);
export type ActiveConditionType = z.infer<typeof ActiveConditionTypeSchema>;

export const DailyCashflowPointSchema = z.object({
  id: z.string(),
  label: z.string(),
  fullDate: z.string(),
  topUp: z.number().nonnegative(),
  withdrawal: z.number().nonnegative(),
});
export type DailyCashflowPoint = z.infer<typeof DailyCashflowPointSchema>;

export const ActiveConditionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: ActiveConditionTypeSchema,
  description: z.string(),
  count: z.number().int().nonnegative(),
});
export type ActiveConditionItem = z.infer<typeof ActiveConditionItemSchema>;

export const DashboardSnapshotSchema = z.object({
  range: TimeRangeSchema,
  rangeLabel: z.string(),
  rangeDescription: z.string(),
  activeUsers: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
  newUsers30d: z.number().int().nonnegative(),
  totalDepositBalance: z.number().nonnegative(),
  totalWithdrawableBalance: z.number().nonnegative(),
  cashflow: z.object({
    topUpTotal: z.number().nonnegative(),
    withdrawalTotal: z.number().nonnegative(),
    difference: z.number(),
    peakTopUpAmount: z.number().nonnegative(),
    peakTopUpDate: z.string(),
    peakWithdrawalAmount: z.number().nonnegative(),
    peakWithdrawalDate: z.string(),
    series: z.array(DailyCashflowPointSchema).min(1),
  }),
  activeBreakdown: z.object({
    conditions: z.array(ActiveConditionItemSchema).length(6),
    coreTotal: z.number().int().nonnegative(),
    withAdditionalTotal: z.number().int().nonnegative(),
    passiveCount: z.number().int().nonnegative(),
    notStartedCount: z.number().int().nonnegative(),
  }),
  operational: z.object({
    pendingTopUpCount: z.number().int().nonnegative(),
    pendingTopUpAmount: z.number().nonnegative(),
    pendingWithdrawalCount: z.number().int().nonnegative(),
    pendingWithdrawalAmount: z.number().nonnegative(),
    runningProductsCount: z.number().int().nonnegative(),
    runningProductsCapital: z.number().nonnegative(),
    activeProductsCount: z.number().int().nonnegative(),
    totalCatalogProducts: z.number().int().nonnegative(),
  }),
  lifetime: z.object({
    totalApprovedTopUp: z.number().nonnegative(),
    totalApprovedWithdrawal: z.number().nonnegative(),
    totalClaimsPaid: z.number().nonnegative(),
    remainingEstimatedYield: z.number().nonnegative(),
  }),
});
export type DashboardSnapshot = z.infer<typeof DashboardSnapshotSchema>;

export const QueueTransactionSchema = z.object({
  id: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  type: z.enum(['topup', 'withdrawal']),
  channel: z.string(),
  amount: z.number().positive(),
  submittedAt: z.string(),
  status: z.enum(['menunggu', 'disetujui', 'ditolak']),
});
export type QueueTransaction = z.infer<typeof QueueTransactionSchema>;

export const CommissionTypeSchema = z.enum(['percent', 'idr']);
export type CommissionType = z.infer<typeof CommissionTypeSchema>;

export const StockModeSchema = z.enum(['limited', 'unlimited']);
export type StockMode = z.infer<typeof StockModeSchema>;

export const InvestmentProductSchema = z
  .object({
    id: z.string(),
    name: z.string().trim().min(1, 'Nama produk wajib diisi'),
    category: z.string().trim().min(1, 'Kategori wajib diisi'),
    imageUrl: z.string(),
    minCapital: z.number().positive('Harga investasi harus lebih dari 0'),
    tenorDays: z.number().int('Durasi harus bilangan bulat').positive('Durasi minimal 1 hari'),
    dailyReturnRate: z.number().positive('Imbal harian harus lebih dari 0'),
    claimIncome: z.number().positive('Pendapatan / klaim harus lebih dari 0'),
    commissionType: CommissionTypeSchema.default('percent'),
    commissionRate: z.number().min(0, 'Komisi tidak boleh negatif'),
    maxPerUser: z.number().int('Batas/User harus bilangan bulat').positive('Batas/User minimal 1 unit'),
    stockMode: StockModeSchema.default('limited'),
    activeHolders: z.number().int('Stok harus bilangan bulat').nonnegative('Stok tidak boleh negatif'),
    totalCapitalIn: z.number().nonnegative('Modal masuk tidak boleh negatif'),
    allowedLevels: z
      .array(
        z
          .number()
          .int('VIP user harus berupa bilangan bulat')
          .min(1, 'Minimal VIP 1')
          .max(8, 'Maksimal VIP 8')
      )
      .min(1, 'Pilih minimal 1 VIP user yang boleh membeli produk ini')
      .transform((levels) => Array.from(new Set(levels)).sort((a, b) => a - b))
      .default([1, 2, 3, 4, 5, 6, 7, 8]),
    status: z.enum(['aktif', 'nonaktif']),
  })
  .superRefine((data, ctx) => {
    if (data.commissionType === 'percent' && data.commissionRate > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['commissionRate'],
        message: 'Komisi persentase maksimal 100%',
      });
    }
  });
export type InvestmentProduct = z.infer<typeof InvestmentProductSchema>;

export const UserStatusHistoryItemSchema = z.object({
  id: z.string(),
  action: z.enum(['dinonaktifkan', 'diaktifkan']),
  timestamp: z.string(),
  actor: z.string(),
  reason: z.string(),
});
export type UserStatusHistoryItem = z.infer<typeof UserStatusHistoryItemSchema>;

export const UserTopUpRecordSchema = z.object({
  id: z.string(),
  amount: z.number().nonnegative(),
  channel: z.string(),
  status: z.enum(['disetujui', 'menunggu', 'ditolak']),
  createdAt: z.string(),
});
export type UserTopUpRecord = z.infer<typeof UserTopUpRecordSchema>;

export const UserWithdrawalRecordSchema = z.object({
  id: z.string(),
  amount: z.number().nonnegative(),
  destination: z.string(),
  status: z.enum(['disetujui', 'menunggu', 'ditolak']),
  createdAt: z.string(),
});
export type UserWithdrawalRecord = z.infer<typeof UserWithdrawalRecordSchema>;

export const UserInvestmentRecordSchema = z.object({
  id: z.string(),
  productName: z.string(),
  capital: z.number().nonnegative(),
  expectedReturn: z.number().nonnegative(),
  earnedReturn: z.number().nonnegative(),
  status: z.enum(['aktif', 'selesai']),
  startedAt: z.string(),
});
export type UserInvestmentRecord = z.infer<typeof UserInvestmentRecordSchema>;

export const UserTransactionLedgerSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  amount: z.number(),
  createdAt: z.string(),
});
export type UserTransactionLedger = z.infer<typeof UserTransactionLedgerSchema>;

export const AccountChannelTypeSchema = z.enum(['bank', 'ewallet']);
export type AccountChannelType = z.infer<typeof AccountChannelTypeSchema>;

export const UserBankAccountSchema = z.object({
  id: z.string(),
  accountType: AccountChannelTypeSchema.default('bank'),
  bankName: z.string(),
  accountNumber: z.string(),
  accountHolder: z.string(),
  isPrimary: z.boolean(),
});
export type UserBankAccount = z.infer<typeof UserBankAccountSchema>;

export const UserReferralRecordSchema = z.object({
  id: z.string(),
  userName: z.string(),
  joinedAt: z.string(),
  commissionEarned: z.number().nonnegative(),
  status: z.enum(['aktif', 'belum_transaksi']),
});
export type UserReferralRecord = z.infer<typeof UserReferralRecordSchema>;

export const AdminUserRecordSchema = z.object({
  id: z.string(),
  userNumber: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  phone: z.string().trim().min(1),
  whatsappRaw: z.string().trim().min(1),
  invitedBy: z.string().nullable(),
  registeredAt: z.string(),
  segment: z.enum(['aktif', 'pasif', 'belum_mulai']),
  accountStatus: z.enum(['aktif', 'nonaktif']),
  inactiveDays: z.number().int().nonnegative(),
  inactiveNote: z.string().trim().min(1),
  depositBalance: z.number().nonnegative(),
  withdrawableBalance: z.number().nonnegative(),
  totalTopUp: z.number().nonnegative(),
  totalTopUpCount: z.number().int().nonnegative(),
  totalWithdrawal: z.number().nonnegative(),
  totalWithdrawalCount: z.number().int().nonnegative(),
  totalInvestmentModal: z.number().nonnegative(),
  totalInvestmentCount: z.number().int().nonnegative(),
  activeInvestmentCount: z.number().int().nonnegative(),
  totalExpectedReturn: z.number().nonnegative(),
  totalEarnedReturn: z.number().nonnegative(),
  remainingExpectedReturn: z.number().nonnegative(),
  cashbackReceived: z.number().nonnegative(),
  referralCommissionReceived: z.number().nonnegative(),
  voucherClaimed: z.number().nonnegative(),
  runningProducts: z.number().int().nonnegative(),
  joinedAt: z.string(),
  lastActivity: z.string(),
  statusHistory: z.array(UserStatusHistoryItemSchema),
  topUps: z.array(UserTopUpRecordSchema),
  withdrawals: z.array(UserWithdrawalRecordSchema),
  investments: z.array(UserInvestmentRecordSchema),
  transactions: z.array(UserTransactionLedgerSchema),
  banks: z.array(UserBankAccountSchema),
  referrals: z.array(UserReferralRecordSchema),
});
export type AdminUserRecord = z.infer<typeof AdminUserRecordSchema>;

export const AdminSessionSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['Super Admin', 'Admin', 'Finance Reviewer', 'Operations Lead']),
  sessionId: z.string(),
});
export type AdminSession = z.infer<typeof AdminSessionSchema>;

export const WithdrawalPublicationSchema = z.object({
  id: z.string().trim().min(1),
  userId: z.string().nullable(),
  userNumber: z.number().int().positive(),
  userName: z.string().trim().min(1),
  userEmail: z.string().email(),
  bankChannel: z.string().trim().min(1),
  amount: z.number().positive(),
  withdrawalDate: z.string().trim().min(1),
  proofUrl: z.string(),
  proofFileName: z.string(),
  proofUploadedAt: z.string().nullable(),
  publicationStatus: z.enum(['published', 'draft']),
  publishedAt: z.string().nullable(),
});
export type WithdrawalPublication = z.infer<typeof WithdrawalPublicationSchema>;

export const AdminInvestmentStatusSchema = z.enum(['Active', 'Nonaktif', 'Selesai']);
export type AdminInvestmentStatus = z.infer<typeof AdminInvestmentStatusSchema>;

export const AdminInvestmentStatusHistorySchema = z.object({
  id: z.string().trim().min(1),
  fromStatus: AdminInvestmentStatusSchema,
  toStatus: AdminInvestmentStatusSchema,
  reason: z.string().trim().min(1),
  actor: z.string().trim().min(1),
  changedAt: z.string().trim().min(1),
});
export type AdminInvestmentStatusHistory = z.infer<typeof AdminInvestmentStatusHistorySchema>;

export const AdminInvestmentRecordSchema = z.object({
  id: z.string().trim().min(1),
  userId: z.string().nullable(),
  userName: z.string().trim().min(1),
  userPhone: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  sellingPrice: z.number().positive(),
  durationDays: z.number().int().positive(),
  claimsCompleted: z.number().int().nonnegative(),
  totalClaims: z.number().int().positive(),
  incomePerClaim: z.number().positive(),
  totalEstimated: z.number().positive(),
  status: AdminInvestmentStatusSchema,
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  statusChangeReason: z.string().trim().min(1),
  statusHistory: z.array(AdminInvestmentStatusHistorySchema),
});
export type AdminInvestmentRecord = z.infer<typeof AdminInvestmentRecordSchema>;

export const ProductCategorySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, 'Nama kategori wajib diisi'),
  slug: z.string().trim().min(1, 'Slug kategori wajib diisi'),
  description: z.string().trim(),
  status: z.enum(['aktif', 'nonaktif']),
  createdAt: z.string().trim().min(1),
});
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const CashbackTargetTypeSchema = z.enum([
  'produk_tertentu',
  'semua_produk',
  'top_up',
]);
export type CashbackTargetType = z.infer<typeof CashbackTargetTypeSchema>;

export const CashbackRuleSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, 'Nama cashback wajib diisi'),
  targetType: CashbackTargetTypeSchema,
  targetProduct: z.string().trim(),
  applicableLabel: z.string().trim().min(1, 'Target berlaku wajib diisi'),
  minTransaction: z.number().nonnegative('Minimum transaksi tidak boleh negatif'),
  cashbackAmount: z.number().positive('Nominal cashback harus lebih dari 0'),
  status: z.enum(['aktif', 'nonaktif']),
  createdAt: z.string().trim().min(1),
});
export type CashbackRule = z.infer<typeof CashbackRuleSchema>;

export const ProductCommissionEntrySchema = z.object({
  id: z.string().trim().min(1),
  recipientUserId: z.string().nullable(),
  recipientUserNumber: z.number().int().positive(),
  recipientName: z.string().trim().min(1),
  recipientEmail: z.string().email(),
  recipientPhone: z.string().trim().min(1),
  referralCode: z.string().trim().min(1),
  referredUserName: z.string().trim().min(1),
  referredUserEmail: z.string().email(),
  registeredViaReferralAt: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  purchaseUnits: z.number().int().positive(),
  purchaseAmount: z.number().positive(),
  commissionType: CommissionTypeSchema,
  commissionRate: z.number().nonnegative(),
  commissionAmount: z.number().positive(),
  earnedAt: z.string().trim().min(1),
});
export type ProductCommissionEntry = z.infer<typeof ProductCommissionEntrySchema>;

export const UserLevelCustomFieldSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1, 'Nama kolom wajib diisi'),
  value: z.string().trim().min(1, 'Nilai kolom wajib diisi'),
});
export type UserLevelCustomField = z.infer<typeof UserLevelCustomFieldSchema>;

export const SalaryPeriodSchema = z.enum(['hari', 'minggu']);
export type SalaryPeriod = z.infer<typeof SalaryPeriodSchema>;

export const UserLevelRuleSchema = z.object({
  level: z.number().int().min(1).max(8),
  label: z.string().trim().min(1),
  tierTitle: z.string().trim().min(1).default('Bronze'),
  badgeImageUrl: z.string().trim().min(1).default('/assets/vip/vip-1.png'),
  isStarterLevel: z.boolean(),
  minActiveReferrals: z.number().int().nonnegative(),
  minTotalPurchase: z.number().nonnegative(),
  extraRequirements: z.array(UserLevelCustomFieldSchema).default([]),
  minWithdrawal: z.number().nonnegative().default(50_000),
  maxWithdrawal: z.number().nonnegative().default(500_000),
  salaryAmount: z.number().nonnegative().default(0),
  salaryPeriod: SalaryPeriodSchema.default('hari'),
  extraBenefits: z.array(UserLevelCustomFieldSchema).default([]),
});
export type UserLevelRule = z.infer<typeof UserLevelRuleSchema>;

export const CompanyDocumentSlotKeySchema = z.enum([
  'faqImage',
  'rulesImage',
  'contractImage',
  'charityImage',
]);
export type CompanyDocumentSlotKey = z.infer<typeof CompanyDocumentSlotKeySchema>;

export const CompanyImageAssetSchema = z.object({
  dataUrl: z.string().min(1),
  fileName: z.string().trim().min(1),
  fileSize: z.number().int().positive(),
  updatedAt: z.string().trim().min(1),
});
export type CompanyImageAsset = z.infer<typeof CompanyImageAssetSchema>;

export const CompanySettingsSchema = z.object({
  faqImage: CompanyImageAssetSchema.nullable(),
  rulesImage: CompanyImageAssetSchema.nullable(),
  contractImage: CompanyImageAssetSchema.nullable(),
  charityImage: CompanyImageAssetSchema.nullable(),
  csPhone: z.string().trim(),
  csEmail: z.string().trim(),
  updatedAt: z.string().nullable(),
});
export type CompanySettings = z.infer<typeof CompanySettingsSchema>;

export const AdminLoginInputSchema = z.object({
  email: z.string().trim().email('Format email admin tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});
export type AdminLoginInput = z.infer<typeof AdminLoginInputSchema>;

export const ADMIN_MIN_PASSWORD_LENGTH = 8;

export const AdminPasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi.'),
    newPassword: z
      .string()
      .min(
        ADMIN_MIN_PASSWORD_LENGTH,
        `Password baru minimal ${ADMIN_MIN_PASSWORD_LENGTH} karakter.`
      ),
    confirmPassword: z.string().min(1, 'Konfirmasi password baru wajib diisi.'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Konfirmasi password baru tidak sama.',
      });
    }
    if (data.currentPassword && data.newPassword === data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'Password baru harus berbeda dari password saat ini.',
      });
    }
  });
export type AdminPasswordChangeInput = z.infer<typeof AdminPasswordChangeSchema>;

export const DokuEnvironmentSchema = z.enum(['sandbox', 'production']);
export type DokuEnvironment = z.infer<typeof DokuEnvironmentSchema>;

export const PaymentMethodCategorySchema = z.enum([
  'qris',
  'bank_transfer_manual',
  'virtual_account',
  'ewallet',
  'retail_outlet',
  'credit_card',
]);
export type PaymentMethodCategory = z.infer<typeof PaymentMethodCategorySchema>;

export const PaymentProviderSchema = z.enum(['manual', 'doku']);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

export const ManualBankAccountSchema = z.object({
  id: z.string().trim().min(1),
  accountType: AccountChannelTypeSchema.default('bank'),
  bankName: z.string().trim().min(2, 'Nama bank atau e-wallet minimal 2 karakter.'),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, 'Nomor rekening atau e-wallet harus berupa 6 sampai 20 digit angka.'),
  accountHolder: z.string().trim().min(2, 'Nama pemilik rekening/akun wajib diisi.'),
  branchOrNote: z.string().trim(),
  isActive: z.boolean(),
  updatedAt: z.string().trim().min(1),
});
export type ManualBankAccount = z.infer<typeof ManualBankAccountSchema>;

export const PaymentMethodConfigSchema = z.object({
  id: z.string().trim().min(1),
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: PaymentMethodCategorySchema,
  provider: PaymentProviderSchema,
  description: z.string().trim(),
  feeLabel: z.string().trim(),
  enabled: z.boolean(),
  updatedAt: z.string().trim().min(1),
});
export type PaymentMethodConfig = z.infer<typeof PaymentMethodConfigSchema>;

export const DokuGatewayPublicStatusSchema = z.object({
  configured: z.boolean(),
  merchantIdConfigured: z.boolean(),
  secretKeyConfigured: z.boolean(),
  publicKeyConfigured: z.boolean(),
  environment: DokuEnvironmentSchema,
  apiBaseUrl: z.string().url(),
  webhookPath: z.string().trim().min(1),
  checkedAt: z.string().trim().min(1),
});
export type DokuGatewayPublicStatus = z.infer<typeof DokuGatewayPublicStatusSchema>;

export const BankSettingsStateSchema = z.object({
  manualBanks: z.array(ManualBankAccountSchema),
  dokuEnabled: z.boolean(),
  paymentMethods: z.array(PaymentMethodConfigSchema),
  updatedAt: z.string().nullable(),
});
export type BankSettingsState = z.infer<typeof BankSettingsStateSchema>;

export const AdBannerStatusSchema = z.enum(['Active', 'Inactive']);
export type AdBannerStatus = z.infer<typeof AdBannerStatusSchema>;

export const AdBannerRecordSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1, 'Judul iklan wajib diisi.'),
  imageUrl: z.string().trim().min(1, 'Gambar iklan (Portrait) wajib diunggah.'),
  imageFileName: z.string().trim(),
  showTime: z.string().trim().min(1),
  status: AdBannerStatusSchema,
  showOnMemberLogin: z.boolean().default(true),
  createdAt: z.string().trim().min(1),
});
export type AdBannerRecord = z.infer<typeof AdBannerRecordSchema>;

export const AnnouncementStatusSchema = z.enum(['Active', 'Inactive']);
export type AnnouncementStatus = z.infer<typeof AnnouncementStatusSchema>;

export const AnnouncementRecordSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1, 'Judul pengumuman wajib diisi.'),
  message: z.string().trim().min(1, 'Isi pesan pengumuman wajib diisi.'),
  publishedAt: z.string().trim().min(1),
  status: AnnouncementStatusSchema,
  showOnMemberMarquee: z.boolean().default(true),
});
export type AnnouncementRecord = z.infer<typeof AnnouncementRecordSchema>;

export const MarqueeDurationSecondsSchema = z.union([
  z.literal(60),
  z.literal(48),
  z.literal(32),
  z.literal(24),
  z.literal(18),
  z.literal(12),
  z.literal(8),
]);
export type MarqueeDurationSeconds = z.infer<typeof MarqueeDurationSecondsSchema>;

export const VoucherStatusSchema = z.enum([
  'Active',
  'Expired',
  'Depleted',
  'Inactive',
]);
export type VoucherStatus = z.infer<typeof VoucherStatusSchema>;

export const VoucherClaimEntrySchema = z.object({
  id: z.string().trim().min(1),
  claimerName: z.string().trim().min(1),
  claimerMaskedPhone: z.string().trim().min(1),
  claimedAmount: z.number().positive(),
  claimedAt: z.string().trim().min(1),
});
export type VoucherClaimEntry = z.infer<typeof VoucherClaimEntrySchema>;

export const VoucherRecordSchema = z
  .object({
    id: z.string().trim().min(1),
    code: z
      .string()
      .trim()
      .min(4, 'Kode voucher minimal 4 karakter.')
      .max(20, 'Kode voucher maksimal 20 karakter.')
      .regex(
        /^[A-Z0-9_-]+$/,
        'Kode voucher hanya boleh berisi huruf kapital, angka, tanda hubung, atau garis bawah.'
      ),
    totalAmount: z
      .number()
      .positive('Total Amount voucher harus lebih dari Rp 0.'),
    remainingAmount: z
      .number()
      .nonnegative('Remaining voucher tidak boleh negatif.'),
    quota: z
      .number()
      .int('Quota harus berupa bilangan bulat.')
      .positive('Quota minimal 1 penerima.'),
    claimedCount: z
      .number()
      .int()
      .nonnegative('Jumlah Claimed tidak boleh negatif.'),
    expiredAt: z.string().trim().min(1, 'Tanggal Expired At wajib diisi.'),
    status: VoucherStatusSchema,
    createdAt: z.string().trim().min(1),
    claims: z.array(VoucherClaimEntrySchema),
  })
  .superRefine((data, ctx) => {
    if (data.remainingAmount > data.totalAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['remainingAmount'],
        message: 'Remaining tidak boleh melebihi Total Amount.',
      });
    }
    if (data.claimedCount > data.quota) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['claimedCount'],
        message: 'Claimed tidak boleh melebihi Quota.',
      });
    }
  });
export type VoucherRecord = z.infer<typeof VoucherRecordSchema>;

export const SmtpEncryptionSchema = z.enum(['ssl', 'starttls', 'none']);
export type SmtpEncryption = z.infer<typeof SmtpEncryptionSchema>;

export const SmtpProviderPresetSchema = z.enum([
  'custom',
  'gmail',
  'brevo',
  'mailgun',
  'resend',
  'mailtrap',
]);
export type SmtpProviderPreset = z.infer<typeof SmtpProviderPresetSchema>;

export const SmtpSettingsPublicSchema = z.object({
  enabled: z.boolean(),
  preset: SmtpProviderPresetSchema,
  host: z.string().trim(),
  port: z.number().int().min(1).max(65535),
  encryption: SmtpEncryptionSchema,
  username: z.string().trim(),
  hasPassword: z.boolean(),
  fromName: z.string().trim().min(1),
  fromEmail: z.string().trim(),
  replyTo: z.string().trim(),
  configured: z.boolean(),
  envConfigured: z.boolean(),
  updatedAt: z.string().nullable(),
});
export type SmtpSettingsPublic = z.infer<typeof SmtpSettingsPublicSchema>;

export const SmtpSettingsSaveInputSchema = z.object({
  enabled: z.boolean(),
  preset: SmtpProviderPresetSchema,
  host: z.string().trim().max(255),
  port: z.number().int().min(1, 'Port SMTP minimal 1.').max(65535, 'Port SMTP maksimal 65535.'),
  encryption: SmtpEncryptionSchema,
  username: z.string().trim().max(255),
  password: z.string().max(512).optional(),
  clearPassword: z.boolean().optional(),
  fromName: z.string().trim().min(2, 'Nama pengirim minimal 2 karakter.').max(120),
  fromEmail: z
    .string()
    .trim()
    .refine(
      (val) => val.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'Format Email Pengirim tidak valid.'
    ),
  replyTo: z
    .string()
    .trim()
    .refine(
      (val) => val.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'Format Reply-To Email tidak valid.'
    ),
});
export type SmtpSettingsSaveInput = z.infer<typeof SmtpSettingsSaveInputSchema>;

export const SmtpEmailPurposeSchema = z.enum([
  'register_otp',
  'forgot_password',
  'test',
]);
export type SmtpEmailPurpose = z.infer<typeof SmtpEmailPurposeSchema>;

export const SmtpEmailLogSchema = z.object({
  id: z.string().trim().min(1),
  purpose: SmtpEmailPurposeSchema,
  maskedRecipient: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  mode: z.enum(['smtp', 'simulation']),
  status: z.enum(['terkirim', 'simulasi', 'gagal']),
  errorMessage: z.string().nullable(),
  sentAt: z.string().trim().min(1),
});
export type SmtpEmailLog = z.infer<typeof SmtpEmailLogSchema>;

export const MemberRegisterInputSchema = z
  .object({
    name: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.').max(100),
    email: z.string().trim().email('Masukkan alamat email yang valid.'),
    phone: z
      .string()
      .trim()
      .min(9, 'Nomor WhatsApp minimal 9 digit.')
      .max(20, 'Nomor WhatsApp terlalu panjang.'),
    password: z
      .string()
      .min(6, 'Kata sandi minimal 6 karakter.')
      .max(64, 'Kata sandi maksimal 64 karakter.'),
    confirmPassword: z.string().min(6, 'Konfirmasi kata sandi wajib diisi.'),
    referralCode: z.string().trim().max(32).optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Konfirmasi kata sandi tidak cocok.',
      });
    }
  });
export type MemberRegisterInput = z.infer<typeof MemberRegisterInputSchema>;

export const MemberPasswordResetInputSchema = z
  .object({
    email: z.string().trim().email('Masukkan alamat email terdaftar yang valid.'),
    newPassword: z
      .string()
      .min(6, 'Kata sandi baru minimal 6 karakter.')
      .max(64, 'Kata sandi baru maksimal 64 karakter.'),
    confirmPassword: z.string().min(6, 'Konfirmasi kata sandi wajib diisi.'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Konfirmasi kata sandi tidak cocok.',
      });
    }
  });
export type MemberPasswordResetInput = z.infer<typeof MemberPasswordResetInputSchema>;

export const AdminForgotResetInputSchema = z
  .object({
    email: z.string().trim().email('Masukkan alamat email admin yang valid.'),
    newPassword: z
      .string()
      .min(8, 'Password admin baru minimal 8 karakter.')
      .max(64, 'Password admin maksimal 64 karakter.'),
    confirmPassword: z.string().min(8, 'Konfirmasi password baru wajib diisi.'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Konfirmasi password admin tidak cocok.',
      });
    }
  });
export type AdminForgotResetInput = z.infer<typeof AdminForgotResetInputSchema>;

export const AdminAccountRoleSchema = z.enum(['Super Admin', 'Admin']);
export type AdminAccountRole = z.infer<typeof AdminAccountRoleSchema>;

export const AdminRoleAccountSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(3, 'Nama admin minimal 3 karakter.').max(100),
  email: z.string().trim().email('Format email admin tidak valid.'),
  role: AdminAccountRoleSchema,
  password: z.string().min(ADMIN_MIN_PASSWORD_LENGTH),
  avatarUrl: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  createdAt: z.string().trim().min(1),
  passwordUpdatedAt: z.string().nullable().default(null),
});
export type AdminRoleAccount = z.infer<typeof AdminRoleAccountSchema>;

export const AdminCreateInputSchema = z
  .object({
    name: z.string().trim().min(3, 'Nama admin minimal 3 karakter.').max(100),
    email: z.string().trim().email('Format email admin tidak valid.'),
    password: z
      .string()
      .min(
        ADMIN_MIN_PASSWORD_LENGTH,
        `Password admin minimal ${ADMIN_MIN_PASSWORD_LENGTH} karakter.`
      )
      .max(64),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Konfirmasi password admin tidak sama.',
      });
    }
  });
export type AdminCreateInput = z.infer<typeof AdminCreateInputSchema>;

export const ServerControlSettingsSchema = z.object({
  blockedAdminIds: z.array(z.string()).default([]),
  blockedMemberIds: z.array(z.string()).default([]),
  allowAdminCreateAdmin: z.boolean().default(false),
  maintenanceTitle: z
    .string()
    .trim()
    .min(1, 'Judul popup gangguan wajib diisi.')
    .default('Server Sedang Mengalami Gangguan'),
  maintenanceMessage: z
    .string()
    .trim()
    .min(1, 'Pesan popup gangguan wajib diisi.')
    .default(
      'Mohon maaf, server untuk akses akun Anda sedang mengalami gangguan atau pemeliharaan sementara. Silakan coba masuk kembali beberapa saat lagi.'
    ),
  maintenanceEta: z
    .string()
    .trim()
    .default('Estimasi pemulihan: segera setelah pemeriksaan selesai'),
  updatedAt: z.string().nullable().default(null),
});
export type ServerControlSettings = z.infer<typeof ServerControlSettingsSchema>;

export const ActivePlatformSessionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('logged_out') }),
  z.object({ kind: z.literal('admin'), adminId: z.string().trim().min(1) }),
  z.object({ kind: z.literal('member'), memberId: z.string().trim().min(1) }),
]);
export type ActivePlatformSession = z.infer<typeof ActivePlatformSessionSchema>;


