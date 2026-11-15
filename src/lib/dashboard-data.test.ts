import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TIME_RANGE_OPTIONS,
  INITIAL_QUEUE_TRANSACTIONS,
  INVESTMENT_PRODUCTS,
  ADMIN_USER_RECORDS,
  getDashboardSnapshot,
  getNonActiveUserSummary,
  filterAdminUsers,
  updateQueueTransactionStatus,
  getNextProductId,
  addInvestmentProduct,
  updateInvestmentProduct,
  deleteInvestmentProduct,
  parseStoredProducts,
  buildDashboardCsv,
} from './dashboard-data';
import {
  AdBannerRecordSchema,
  AdminInvestmentRecordSchema,
  AdminUserRecordSchema,
  AnnouncementRecordSchema,
  BankSettingsStateSchema,
  CashbackRuleSchema,
  InvestmentProductSchema,
  ProductCategorySchema,
  ProductCommissionEntrySchema,
  UserLevelRuleSchema,
  VoucherRecordSchema,
  WithdrawalPublicationSchema,
} from './dashboard-schema';
import {
  INITIAL_AD_BANNERS,
  addAdBanner,
  deleteAdBanner,
  filterAdBanners,
  getActiveMemberLoginAds,
  toggleAdBannerStatus,
  updateAdBanner,
} from './iklan';
import {
  DEFAULT_MARQUEE_DURATION_SECONDS,
  INITIAL_ANNOUNCEMENTS,
  MARQUEE_SPEED_OPTIONS,
  addAnnouncement,
  buildMemberMarqueeText,
  deleteAnnouncement,
  filterAnnouncements,
  formatAnnouncementDate,
  getActiveMemberMarqueeAnnouncements,
  getMarqueeDurationClassName,
  getMarqueeSpeedOption,
  parseMarqueeDurationSeconds,
  toggleAnnouncementStatus,
  updateAnnouncement,
} from './announcements';
import {
  INITIAL_VOUCHERS,
  addVoucher,
  deleteVoucher,
  filterVouchers,
  generateVoucherCode,
  getVoucherSummary,
  normalizeVoucherExpiredAt,
  toggleVoucherStatus,
} from './vouchers';
import {
  INDONESIAN_BANK_OPTIONS,
  INDONESIAN_EWALLET_OPTIONS,
  resolveIndonesianBankSlug,
  resolvePaymentChannelSlugs,
} from './bank-logos';
import {
  MemberAppStateSchema,
  addMemberBankAccount,
  claimMemberDailyInvestment,
  createInitialMemberAppState,
  getMemberCurrentLevel,
  loginMemberByIdentifier,
  purchaseMemberProduct,
  redeemMemberVoucher,
  registerMemberAccount,
  resetMemberPassword,
  submitMemberTopUp,
  submitMemberWithdrawal,
} from './member-app';
import {
  addManualBankAccount,
  createInitialBankSettings,
  deleteManualBankAccount,
  filterPaymentMethods,
  formatBankAccountNumber,
  toggleDokuGatewayEnabled,
  toggleManualBankAccountStatus,
  togglePaymentMethodEnabled,
  updateManualBankAccount,
} from './bank-settings';
import {
  INITIAL_CASHBACK_RULES,
  addCashbackRule,
  deleteCashbackRule,
  filterCashbackRules,
  findProductForCashback,
  formatCashbackApplicableLabel,
  getCashbackProductOptions,
  getCashbackSummary,
  getNextCashbackId,
  updateCashbackRule,
} from './cashbacks';
import {
  INITIAL_PRODUCT_CATEGORIES,
  addProductCategory,
  countProductsByCategory,
  deleteProductCategory,
  filterProductCategories,
  getCategorySummary,
  getNextCategoryId,
  slugifyCategoryName,
  updateProductCategory,
} from './categories';
import {
  INITIAL_ADMIN_INVESTMENTS,
  changeInvestmentStatus,
  filterAdminInvestments,
  getInvestmentSummary,
} from './investments';
import {
  INITIAL_WITHDRAWAL_PUBLICATIONS,
  clearWithdrawalProof,
  filterWithdrawalPublications,
  getWithdrawalPublicationSummary,
  toggleWithdrawalPublication,
  updateWithdrawalProof,
  upsertWithdrawalPublicationFromQueueTx,
} from './withdrawal-publications';
import {
  INITIAL_PRODUCT_COMMISSIONS,
  aggregateProductCommissionRecipients,
  buildReferralRegistrationLink,
  calculateProductCommissionAmount,
  deriveUserReferralCode,
  filterProductCommissionRecipients,
  getProductCommissionOverview,
  getUserProductCommissionSummary,
  isProductCommissionActive,
} from './product-commissions';
import {
  checkUserEmail,
  checkWhatsAppNumber,
  createAdminUser,
  detectIndonesianCarrier,
  normalizeIndonesianPhone,
  toggleUserAccountStatus,
} from './user-diagnostics';
import {
  ALL_USER_LEVELS,
  DEFAULT_USER_LEVEL_RULES,
  canUserLevelPurchaseProduct,
  cloneDefaultUserLevelRules,
  countUserActiveReferrals,
  evaluateUserLevel,
  formatAllowedLevelsLabel,
  formatProductVipLevelBadge,
  formatSalaryPeriodLabel,
  getVipBadgeImageSrc,
  normalizeAllowedLevels,
  parseStoredUserLevels,
  validateAndSaveUserLevels,
} from './user-levels';
import {
  createEmptyCompanySettings,
  formatCompanyImageSize,
  validateAndSaveCompanySettings,
  validateCompanyCsPhone,
} from './company-settings';
import {
  DEMO_ADMIN_PASSWORD,
  changeAdminPassword,
  createInitialAdminAccount,
  getAdminInitials,
  resetAdminPasswordByEmail,
  verifyAdminLogin,
} from './admin-auth';
import {
  SMTP_PROVIDER_PRESETS,
  maskEmailAddress,
  validateSmtpSavePayload,
} from './smtp-settings';
import {
  buildAuthEmailContent,
  getSmtpEmailLogs,
  getSmtpPublicStatus,
  resetSmtpConfigurationToEnv,
  saveSmtpConfiguration,
  sendAuthOtpEmail,
  verifyAuthOtpChallenge,
} from './smtp-server';
import {
  DEMO_REGULAR_ADMIN_PASSWORD,
  canAccessServerMenu,
  canViewerCreateAdmin,
  createInitialAdminAccounts,
  createInitialServerControlSettings,
  createRegularAdminAccount,
  deleteAdminAccount,
  getVisibleAdminAccountsForViewer,
  resolveUnifiedLogin,
  toggleAllowAdminCreateAdmin,
  toggleBlockedAdminAccount,
  toggleBlockedMemberAccount,
} from './platform-auth';
import {
  DEMO_MEMBER_DEFAULT_PASSWORD,
} from './member-app';
import {
  MAX_PRODUCT_IMAGE_BYTES,
  formatNumber,
  formatProductCommission,
  formatProductStock,
  formatRupiah,
  formatSignedRupiah,
  validateProductImageFile,
} from './utils';

test('Indonesian currency and number formatters match exact prompt conventions', () => {
  assert.equal(formatNumber(2291), '2.291');
  assert.equal(formatNumber(1776), '1.776');
  assert.equal(formatRupiah(20522293), 'Rp 20.522.293');
  assert.equal(formatRupiah(1647185000), 'Rp 1.647.185.000');
  assert.equal(formatRupiah(-15745982), '−Rp 15.745.982');
  assert.equal(formatSignedRupiah(-15745982), '−Rp 15.745.982');
  assert.equal(formatSignedRupiah(500000), '+Rp 500.000');
  assert.equal(formatProductCommission(5, 'percent'), '5%');
  assert.equal(formatProductCommission(4.5, 'percent'), '4.5%');
  assert.equal(formatProductCommission(50000, 'idr'), 'Rp 50.000');
  assert.equal(formatProductStock(312, 'limited'), '312');
  assert.equal(formatProductStock(312, 'unlimited'), 'Unlimited');
});

test('7-day default snapshot matches every prompt figure verbatim', () => {
  const s = getDashboardSnapshot('7d');

  assert.equal(s.rangeDescription, 'Grafik dan hitungan user aktif memakai rentang 7 hari terakhir.');
  assert.equal(s.activeUsers, 510);
  assert.equal(s.totalUsers, 2291);
  assert.equal(s.newUsers30d, 1895);
  assert.equal(s.totalDepositBalance, 20522293);
  assert.equal(s.totalWithdrawableBalance, 1647185000);

  assert.equal(s.cashflow.topUpTotal, 382782018);
  assert.equal(s.cashflow.withdrawalTotal, 398528000);
  assert.equal(s.cashflow.difference, -15745982);
  assert.equal(s.cashflow.peakTopUpAmount, 128700000);
  assert.equal(s.cashflow.peakTopUpDate, '14 Nov 2026');
  assert.equal(s.cashflow.peakWithdrawalAmount, 117116000);
  assert.equal(s.cashflow.peakWithdrawalDate, '14 Nov 2026');

  const conditionMap = Object.fromEntries(
    s.activeBreakdown.conditions.map((c) => [c.title, { type: c.type, count: c.count }])
  );
  assert.deepEqual(conditionMap['Punya produk berjalan'], { type: 'inti', count: 510 });
  assert.deepEqual(conditionMap['Masih beli produk'], { type: 'inti', count: 138 });
  assert.deepEqual(conditionMap['Masih klaim produk'], { type: 'inti', count: 490 });
  assert.deepEqual(conditionMap['Masih punya saldo'], { type: 'tambahan', count: 528 });
  assert.deepEqual(conditionMap['Top up disetujui'], { type: 'tambahan', count: 140 });
  assert.deepEqual(conditionMap['Masih bertransaksi'], { type: 'tambahan', count: 509 });

  assert.equal(s.activeBreakdown.coreTotal, 510);
  assert.equal(s.activeBreakdown.withAdditionalTotal, 598);
  assert.equal(s.activeBreakdown.passiveCount, 5);
  assert.equal(s.activeBreakdown.notStartedCount, 1776);

  assert.equal(s.operational.pendingTopUpCount, 5);
  assert.equal(s.operational.pendingTopUpAmount, 6100000);
  assert.equal(s.operational.pendingWithdrawalCount, 423);
  assert.equal(s.operational.pendingWithdrawalAmount, 451431500);
  assert.equal(s.operational.runningProductsCount, 1296);
  assert.equal(s.operational.runningProductsCapital, 1947810000);
  assert.equal(s.operational.activeProductsCount, 30);
  assert.equal(s.operational.totalCatalogProducts, 62);

  assert.equal(s.lifetime.totalApprovedTopUp, 1969304178);
  assert.equal(s.lifetime.totalApprovedWithdrawal, 1582680500);
  assert.equal(s.lifetime.totalClaimsPaid, 1637162000);
  assert.equal(s.lifetime.remainingEstimatedYield, 0);
});

test('All time ranges maintain mathematical invariants and invariant lifetime figures', () => {
  for (const { value } of TIME_RANGE_OPTIONS) {
    const s = getDashboardSnapshot(value);

    // Sum of series equals cashflow totals
    const seriesTopUpSum = s.cashflow.series.reduce((acc, p) => acc + p.topUp, 0);
    const seriesWithdrawalSum = s.cashflow.series.reduce((acc, p) => acc + p.withdrawal, 0);
    assert.equal(seriesTopUpSum, s.cashflow.topUpTotal, `TopUp sum mismatch for ${value}`);
    assert.equal(seriesWithdrawalSum, s.cashflow.withdrawalTotal, `Withdrawal sum mismatch for ${value}`);
    assert.equal(s.cashflow.difference, s.cashflow.topUpTotal - s.cashflow.withdrawalTotal);

    // User segmentation equals total users
    const userSegmentTotal =
      s.activeBreakdown.coreTotal + s.activeBreakdown.passiveCount + s.activeBreakdown.notStartedCount;
    assert.equal(userSegmentTotal, s.totalUsers, `User segmentation mismatch for ${value}`);

    // Lifetime metrics never change with range filter
    assert.equal(s.lifetime.totalApprovedTopUp, 1969304178);
    assert.equal(s.lifetime.totalApprovedWithdrawal, 1582680500);
    assert.equal(s.lifetime.totalClaimsPaid, 1637162000);
    assert.equal(s.lifetime.remainingEstimatedYield, 0);
  }
});

test('Pending queue approval updates pending count and amount accurately', () => {
  const pendingTopUps = INITIAL_QUEUE_TRANSACTIONS.filter((t) => t.type === 'topup');
  assert.equal(pendingTopUps.length, 5);
  assert.equal(
    pendingTopUps.reduce((acc, t) => acc + t.amount, 0),
    6100000
  );

  const res = updateQueueTransactionStatus(INITIAL_QUEUE_TRANSACTIONS, 'TU-261114-001', 'disetujui');
  assert.equal(res.deltaPendingTopUpCount, -1);
  assert.equal(res.deltaPendingTopUpAmount, -1500000);
  assert.equal(res.deltaPendingWithdrawalCount, 0);
  assert.equal(res.transactions.find((t) => t.id === 'TU-261114-001')?.status, 'disetujui');
});

test('CSV export includes key summary rows', () => {
  const csv = buildDashboardCsv(getDashboardSnapshot('7d'));
  assert.ok(csv.includes('Rp 20.522.293'));
  assert.ok(csv.includes('−Rp 15.745.982'));
  assert.ok(csv.includes('Rp 1.969.304.178'));
});

test('Product update validates with Zod and updates matching product', () => {
  const target = INVESTMENT_PRODUCTS[0];
  const updatedList = updateInvestmentProduct(INVESTMENT_PRODUCTS, {
    ...target,
    name: 'Reksa Energi Surya Nusantara v2',
    minCapital: 2_000_000,
    tenorDays: 45,
    claimIncome: 29_000,
    commissionRate: 7.5,
    maxPerUser: 8,
    status: 'nonaktif',
  });
  assert.equal(updatedList[0].name, 'Reksa Energi Surya Nusantara v2');
  assert.equal(updatedList[0].minCapital, 2_000_000);
  assert.equal(updatedList[0].tenorDays, 45);
  assert.equal(updatedList[0].claimIncome, 29_000);
  assert.equal(updatedList[0].commissionRate, 7.5);
  assert.equal(updatedList[0].maxPerUser, 8);
  assert.equal(updatedList[0].status, 'nonaktif');

  const badResult = InvestmentProductSchema.safeParse({
    ...target,
    name: '   ',
    minCapital: 0,
    claimIncome: -100,
    commissionType: 'percent',
    commissionRate: 120,
    maxPerUser: 0,
  });
  assert.equal(badResult.success, false);

  const flatIdrResult = InvestmentProductSchema.safeParse({
    ...target,
    commissionType: 'idr',
    commissionRate: 75_000,
    stockMode: 'unlimited',
  });
  assert.equal(flatIdrResult.success, true);
});

test('Product delete removes matching product cleanly', () => {
  const afterDelete = deleteInvestmentProduct(INVESTMENT_PRODUCTS, 'PRD-02');
  assert.equal(afterDelete.length, INVESTMENT_PRODUCTS.length - 1);
  assert.equal(afterDelete.some((p) => p.id === 'PRD-02'), false);
});

test('Product add generates next sequential PRD ID and validates with Zod', () => {
  assert.equal(getNextProductId(INVESTMENT_PRODUCTS), 'PRD-07');
  const nextList = addInvestmentProduct(INVESTMENT_PRODUCTS, {
    ...INVESTMENT_PRODUCTS[0],
    id: '',
    name: 'Obligasi Hijau Kalimantan',
    minCapital: 1_250_000,
    commissionType: 'idr',
    commissionRate: 50_000,
    stockMode: 'unlimited',
  });
  assert.equal(nextList.length, INVESTMENT_PRODUCTS.length + 1);
  assert.equal(nextList[0].id, 'PRD-07');
  assert.equal(nextList[0].name, 'Obligasi Hijau Kalimantan');
  assert.equal(nextList[0].commissionType, 'idr');
  assert.equal(nextList[0].stockMode, 'unlimited');
});

test('Gallery image upload validation accepts valid images and rejects non-images or oversized files', () => {
  assert.deepEqual(validateProductImageFile({ type: 'image/jpeg', size: 250_000 }), { valid: true });
  assert.deepEqual(validateProductImageFile({ type: 'image/png', size: MAX_PRODUCT_IMAGE_BYTES }), {
    valid: true,
  });

  const nonImage = validateProductImageFile({ type: 'application/pdf', size: 1024 });
  assert.equal(nonImage.valid, false);

  const emptyFile = validateProductImageFile({ type: 'image/webp', size: 0 });
  assert.equal(emptyFile.valid, false);

  const oversized = validateProductImageFile({
    type: 'image/png',
    size: MAX_PRODUCT_IMAGE_BYTES + 1,
  });
  assert.equal(oversized.valid, false);
});

test('Admin user records validate with Zod and include phone & non-active info', () => {
  assert.ok(ADMIN_USER_RECORDS.length > 0);
  for (const user of ADMIN_USER_RECORDS) {
    const parsed = AdminUserRecordSchema.safeParse(user);
    assert.equal(parsed.success, true, `User ${user.id} failed validation`);
    assert.ok(user.phone.trim().length >= 8, `User ${user.id} missing valid phone number`);
    if (user.accountStatus === 'nonaktif') {
      assert.ok(user.inactiveDays >= 1, `Non-active user ${user.id} should track inactiveDays`);
    }
  }

  const summary = getNonActiveUserSummary(getDashboardSnapshot('7d').activeBreakdown);
  assert.equal(summary.passiveCount, 5);
  assert.equal(summary.notStartedCount, 1776);
  assert.equal(summary.totalNonActive, 1781);

  const nonActiveUsers = filterAdminUsers(ADMIN_USER_RECORDS, {
    segmentFilter: 'nonaktif',
    query: '',
  });
  assert.ok(nonActiveUsers.length >= 4);
  assert.equal(
    nonActiveUsers.every((u) => u.accountStatus === 'nonaktif'),
    true
  );

  const phoneMatches = filterAdminUsers(ADMIN_USER_RECORDS, {
    segmentFilter: 'semua',
    query: '08137724',
  });
  assert.equal(phoneMatches.length, 1);
  assert.equal(phoneMatches[0].id, 'USR-8804');
});

test('User WhatsApp & Email diagnostics and status toggling work accurately', () => {
  const risma = ADMIN_USER_RECORDS.find((u) => u.id === 'USR-2303');
  assert.ok(risma, 'Sample user Risma (#2303) should exist');

  const norm = normalizeIndonesianPhone(risma.whatsappRaw);
  assert.equal(norm.internationalDigits, '6289608359465');
  assert.equal(norm.plusInternational, '+6289608359465');
  assert.equal(norm.local, '089608359465');
  assert.equal(norm.isIndonesia, true);
  assert.equal(norm.isReasonableLength, true);
  assert.equal(detectIndonesianCarrier(norm.local).carrier, 'Tri');

  const waCheck = checkWhatsAppNumber(risma, ADMIN_USER_RECORDS);
  assert.equal(waCheck.isValid, true);
  assert.equal(waCheck.checks.find((c) => c.id === 'carrier')?.detail.startsWith('Tri'), true);
  assert.equal(waCheck.checks.find((c) => c.id === 'whatsapp-registered')?.status, 'unknown');

  const emailCheck = checkUserEmail(risma, ADMIN_USER_RECORDS);
  assert.equal(emailCheck.isValid, true);
  assert.equal(
    emailCheck.checks.find((c) => c.id === 'mx')?.detail,
    'Domain gmail.com punya mail server.'
  );

  const emailCheckWithMx = checkUserEmail(risma, ADMIN_USER_RECORDS, {
    mxHost: 'gmail-smtp-in.l.google.com',
  });
  assert.equal(
    emailCheckWithMx.checks.find((c) => c.id === 'mx')?.detail,
    'Domain gmail.com punya mail server (gmail-smtp-in.l.google.com).'
  );

  const disposableEmailCheck = checkUserEmail(
    { id: 'TMP-1', email: 'test@mailinator.com' },
    ADMIN_USER_RECORDS
  );
  assert.equal(disposableEmailCheck.isValid, false);

  const afterDeactivate = toggleUserAccountStatus(ADMIN_USER_RECORDS, 'USR-2303', {
    reason: 'Uji penonaktifan akun',
  });
  const deactivatedRisma = afterDeactivate.find((u) => u.id === 'USR-2303')!;
  assert.equal(deactivatedRisma.accountStatus, 'nonaktif');
  assert.equal(deactivatedRisma.statusHistory.length, 1);
  assert.equal(deactivatedRisma.statusHistory[0].action, 'dinonaktifkan');
  assert.equal(deactivatedRisma.statusHistory[0].reason, 'Uji penonaktifan akun');

  const afterReactivate = toggleUserAccountStatus(afterDeactivate, 'USR-2303', {
    reason: 'Verifikasi selesai',
  });
  const reactivatedRisma = afterReactivate.find((u) => u.id === 'USR-2303')!;
  assert.equal(reactivatedRisma.accountStatus, 'aktif');
  assert.equal(reactivatedRisma.statusHistory.length, 2);
  assert.equal(reactivatedRisma.statusHistory[0].action, 'diaktifkan');
});

test('Withdrawal publications validate with Zod, filter accurately, and treat proof as optional', () => {
  assert.ok(INITIAL_WITHDRAWAL_PUBLICATIONS.length >= 4);
  for (const item of INITIAL_WITHDRAWAL_PUBLICATIONS) {
    const parsed = WithdrawalPublicationSchema.safeParse(item);
    assert.equal(parsed.success, true, `Withdrawal publication ${item.id} failed validation`);
  }

  const summary = getWithdrawalPublicationSummary(INITIAL_WITHDRAWAL_PUBLICATIONS);
  assert.equal(summary.totalCount, INITIAL_WITHDRAWAL_PUBLICATIONS.length);
  assert.ok(summary.publishedCount >= 1);
  assert.ok(summary.missingProofCount >= 1);

  const missingProofRow = INITIAL_WITHDRAWAL_PUBLICATIONS.find((r) => !r.proofUrl)!;
  const directPublishWithoutProof = toggleWithdrawalPublication(
    INITIAL_WITHDRAWAL_PUBLICATIONS,
    missingProofRow.id
  );
  assert.equal(directPublishWithoutProof.error, null, 'Should allow publishing without proof');
  assert.equal(
    directPublishWithoutProof.records.find((r) => r.id === missingProofRow.id)?.publicationStatus,
    'published'
  );

  const withProof = updateWithdrawalProof(
    directPublishWithoutProof.records,
    missingProofRow.id,
    {
      proofUrl: 'data:image/png;base64,iVBORw0KGgo=',
      proofFileName: 'bukti-transfer.png',
    }
  );
  assert.equal(
    withProof.find((r) => r.id === missingProofRow.id)?.proofFileName,
    'bukti-transfer.png'
  );

  const afterClear = clearWithdrawalProof(withProof, missingProofRow.id);
  const clearedRow = afterClear.find((r) => r.id === missingProofRow.id)!;
  assert.equal(clearedRow.proofUrl, '');
  assert.equal(clearedRow.publicationStatus, 'published');

  const noProofFiltered = filterWithdrawalPublications(INITIAL_WITHDRAWAL_PUBLICATIONS, {
    filter: 'no_proof',
    query: '',
  });
  assert.equal(noProofFiltered.every((r) => r.proofUrl === ''), true);

  const queueWd = INITIAL_QUEUE_TRANSACTIONS.find((t) => t.id === 'WD-261114-101')!;
  const syncedWithoutProof = upsertWithdrawalPublicationFromQueueTx(
    INITIAL_WITHDRAWAL_PUBLICATIONS,
    queueWd,
    ADMIN_USER_RECORDS
  );
  assert.equal(syncedWithoutProof.length, INITIAL_WITHDRAWAL_PUBLICATIONS.length + 1);
  assert.equal(syncedWithoutProof[0].id, 'WD-261114-101');
  assert.equal(syncedWithoutProof[0].userId, 'USR-8791');
  assert.equal(syncedWithoutProof[0].proofUrl, '');
  assert.equal(syncedWithoutProof[0].publicationStatus, 'draft');

  const syncedWithProof = upsertWithdrawalPublicationFromQueueTx(
    syncedWithoutProof,
    queueWd,
    ADMIN_USER_RECORDS,
    {
      proofUrl: 'data:image/png;base64,iVBORw0KGgo=',
      proofFileName: 'struk-adi.png',
      publishImmediately: true,
    }
  );
  assert.equal(syncedWithProof.length, syncedWithoutProof.length);
  assert.equal(syncedWithProof[0].proofFileName, 'struk-adi.png');
  assert.equal(syncedWithProof[0].publicationStatus, 'published');
});

test('Admin investments validate with Zod, match Sarminah seed row, filter, and require reason on status change', () => {
  assert.ok(INITIAL_ADMIN_INVESTMENTS.length >= 5);
  for (const inv of INITIAL_ADMIN_INVESTMENTS) {
    const parsed = AdminInvestmentRecordSchema.safeParse(inv);
    assert.equal(parsed.success, true, `Investment ${inv.id} failed validation`);
  }

  const sarminah = INITIAL_ADMIN_INVESTMENTS.find((i) => i.id === '1304');
  assert.ok(sarminah, 'Seed investment #1304 for Sarminah should exist');
  assert.equal(sarminah.userName, 'Sarminah');
  assert.equal(sarminah.userPhone, '6285202032609');
  assert.equal(sarminah.productName, 'C - 10');
  assert.equal(sarminah.sellingPrice, 250_000);
  assert.equal(sarminah.durationDays, 30);
  assert.equal(sarminah.claimsCompleted, 0);
  assert.equal(sarminah.totalClaims, 30);
  assert.equal(sarminah.incomePerClaim, 35_000);
  assert.equal(sarminah.totalEstimated, 1_050_000);
  assert.equal(sarminah.status, 'Active');
  assert.equal(sarminah.startDate, '2026-11-14 22:33');
  assert.equal(sarminah.endDate, '2026-12-14 22:33');
  assert.equal(sarminah.statusChangeReason, '-');

  const summary = getInvestmentSummary(INITIAL_ADMIN_INVESTMENTS);
  assert.equal(summary.totalCount, INITIAL_ADMIN_INVESTMENTS.length);
  assert.ok(summary.activeCount >= 1);
  assert.ok(summary.inactiveCount >= 1);
  assert.ok(summary.completedCount >= 1);

  const byPhone = filterAdminInvestments(INITIAL_ADMIN_INVESTMENTS, {
    filter: 'semua',
    query: '6285202032609',
  });
  assert.equal(byPhone.length, 1);
  assert.equal(byPhone[0].id, '1304');

  const activeOnly = filterAdminInvestments(INITIAL_ADMIN_INVESTMENTS, {
    filter: 'Active',
    query: '',
  });
  assert.equal(
    activeOnly.every((item) => item.status === 'Active'),
    true
  );

  // Empty reason must fail validation
  const emptyReasonAttempt = changeInvestmentStatus(INITIAL_ADMIN_INVESTMENTS, '1304', {
    nextStatus: 'Nonaktif',
    reason: '   ',
  });
  assert.ok(emptyReasonAttempt.error);
  assert.equal(
    emptyReasonAttempt.records.find((i) => i.id === '1304')?.status,
    'Active'
  );

  // Valid deactivation updates status, reason, and history
  const deactivated = changeInvestmentStatus(INITIAL_ADMIN_INVESTMENTS, '1304', {
    nextStatus: 'Nonaktif',
    reason: 'Verifikasi manual transaksi user',
    actor: 'Alfaciro Admin',
    changedAt: '2026-11-14 23:00',
  });
  assert.equal(deactivated.error, null);
  const updatedRow = deactivated.records.find((i) => i.id === '1304')!;
  assert.equal(updatedRow.status, 'Nonaktif');
  assert.equal(updatedRow.statusChangeReason, 'Verifikasi manual transaksi user');
  assert.equal(updatedRow.statusHistory.length, 1);
  assert.equal(updatedRow.statusHistory[0].toStatus, 'Nonaktif');

  // Reactivating updates status back to Active
  const reactivated = changeInvestmentStatus(deactivated.records, '1304', {
    nextStatus: 'Active',
    reason: 'Verifikasi selesai, kontrak dilanjutkan',
    actor: 'Alfaciro Admin',
    changedAt: '2026-11-14 23:10',
  });
  assert.equal(reactivated.error, null);
  const restoredRow = reactivated.records.find((i) => i.id === '1304')!;
  assert.equal(restoredRow.status, 'Active');
  assert.equal(restoredRow.statusChangeReason, 'Verifikasi selesai, kontrak dilanjutkan');
  assert.equal(restoredRow.statusHistory.length, 2);
});

test('Product categories validate with Zod, summarize linked products, filter, and support add/edit/delete', () => {
  assert.equal(INITIAL_PRODUCT_CATEGORIES.length, 6);
  for (const cat of INITIAL_PRODUCT_CATEGORIES) {
    const parsed = ProductCategorySchema.safeParse(cat);
    assert.equal(parsed.success, true, `Category ${cat.id} failed validation`);
  }

  const summary = getCategorySummary(INITIAL_PRODUCT_CATEGORIES, INVESTMENT_PRODUCTS);
  assert.equal(summary.totalCount, 6);
  assert.equal(summary.activeCount, 5);
  assert.equal(summary.inactiveCount, 1);
  assert.equal(summary.linkedProductsCount, 6);

  assert.equal(slugifyCategoryName('  Energi Terbarukan & Hijau! '), 'energi-terbarukan-hijau');
  assert.equal(getNextCategoryId(INITIAL_PRODUCT_CATEGORIES), 'CAT-07');
  assert.equal(countProductsByCategory(INVESTMENT_PRODUCTS, 'Infrastruktur Hijau'), 1);

  const activeOnly = filterProductCategories(INITIAL_PRODUCT_CATEGORIES, {
    statusFilter: 'aktif',
    query: '',
  });
  assert.equal(activeOnly.length, 5);

  const searchMatches = filterProductCategories(INITIAL_PRODUCT_CATEGORIES, {
    statusFilter: 'semua',
    query: 'rantai-pasok',
  });
  assert.equal(searchMatches.length, 1);
  assert.equal(searchMatches[0].id, 'CAT-02');

  // Empty name and case-insensitive duplicates must be rejected
  const emptyAttempt = addProductCategory(INITIAL_PRODUCT_CATEGORIES, {
    name: '   ',
  });
  assert.ok(emptyAttempt.error);
  assert.equal(emptyAttempt.categories.length, 6);

  const duplicateAttempt = addProductCategory(INITIAL_PRODUCT_CATEGORIES, {
    name: 'infrastruktur hijau',
  });
  assert.ok(duplicateAttempt.error);
  assert.equal(duplicateAttempt.categories.length, 6);

  // Valid create generates CAT-07 and auto-slug
  const created = addProductCategory(INITIAL_PRODUCT_CATEGORIES, {
    name: 'Energi Terbarukan',
    description: 'Pembangkit listrik tenaga angin dan mikrohidro.',
    status: 'aktif',
    createdAt: '2026-11-15',
  });
  assert.equal(created.error, null);
  assert.equal(created.categories.length, 7);
  assert.equal(created.categories[0].id, 'CAT-07');
  assert.equal(created.categories[0].slug, 'energi-terbarukan');

  // Update rejects duplicate name on another ID
  const duplicateRename = updateProductCategory(created.categories, {
    id: 'CAT-07',
    name: 'Rantai Pasok',
    slug: 'rantai-pasok',
    description: '',
    status: 'aktif',
  });
  assert.ok(duplicateRename.error);

  // Valid edit returns previousName and nextName
  const updated = updateProductCategory(created.categories, {
    id: 'CAT-07',
    name: 'Energi Bersih',
    slug: 'energi-bersih',
    description: 'Portofolio energi bersih terverifikasi.',
    status: 'nonaktif',
  });
  assert.equal(updated.error, null);
  assert.equal(updated.previousName, 'Energi Terbarukan');
  assert.equal(updated.nextName, 'Energi Bersih');
  const editedCat = updated.categories.find((c) => c.id === 'CAT-07')!;
  assert.equal(editedCat.slug, 'energi-bersih');
  assert.equal(editedCat.status, 'nonaktif');

  // Delete removes target and returns deletedCategory
  const deleted = deleteProductCategory(updated.categories, 'CAT-07');
  assert.equal(deleted.deletedCategory?.id, 'CAT-07');
  assert.equal(deleted.categories.length, 6);
  assert.equal(deleted.categories.some((c) => c.id === 'CAT-07'), false);
});

test('Cashback rules validate with Zod, match Investment Growth seed row, filter, and support CRUD', () => {
  assert.ok(INITIAL_CASHBACK_RULES.length >= 1);
  for (const rule of INITIAL_CASHBACK_RULES) {
    const parsed = CashbackRuleSchema.safeParse(rule);
    assert.equal(parsed.success, true, `Cashback ${rule.id} failed validation`);
  }

  const seed = INITIAL_CASHBACK_RULES.find((r) => r.name === 'Investment Growth');
  assert.ok(seed, 'Seed cashback Investment Growth should exist');
  assert.equal(seed.applicableLabel, 'Pembelian produk: V - 50');
  assert.equal(seed.minTransaction, 17_600_000);
  assert.equal(seed.cashbackAmount, 1_600_000);
  assert.equal(seed.status, 'aktif');

  assert.equal(
    formatCashbackApplicableLabel('produk_tertentu', 'V - 50'),
    'Pembelian produk: V - 50'
  );
  assert.equal(
    formatCashbackApplicableLabel('semua_produk', ''),
    'Semua produk investasi'
  );
  assert.equal(
    formatCashbackApplicableLabel('top_up', ''),
    'Top up saldo deposit'
  );
  assert.equal(getNextCashbackId(INITIAL_CASHBACK_RULES), 'CB-04');

  const summary = getCashbackSummary(INITIAL_CASHBACK_RULES);
  assert.equal(summary.totalCount, INITIAL_CASHBACK_RULES.length);
  assert.equal(summary.maxCashbackAmount, 1_600_000);

  const searchV50 = filterCashbackRules(INITIAL_CASHBACK_RULES, {
    statusFilter: 'semua',
    query: 'V - 50',
  });
  assert.equal(searchV50.length, 1);
  assert.equal(searchV50[0].id, 'CB-01');

  // Validation rejects missing name, missing targetProduct, or non-positive cashback
  const missingProduct = addCashbackRule(INITIAL_CASHBACK_RULES, {
    name: 'Promo Baru',
    targetType: 'produk_tertentu',
    targetProduct: '   ',
    minTransaction: 1_000_000,
    cashbackAmount: 100_000,
    status: 'aktif',
  });
  assert.ok(missingProduct.error);

  const zeroCashback = addCashbackRule(INITIAL_CASHBACK_RULES, {
    name: 'Promo Baru',
    targetType: 'semua_produk',
    targetProduct: '',
    minTransaction: 1_000_000,
    cashbackAmount: 0,
    status: 'aktif',
  });
  assert.ok(zeroCashback.error);

  // Valid create
  const created = addCashbackRule(INITIAL_CASHBACK_RULES, {
    name: 'Bonus Akhir Tahun',
    targetType: 'semua_produk',
    targetProduct: '',
    minTransaction: 10_000_000,
    cashbackAmount: 750_000,
    status: 'aktif',
    createdAt: '2026-11-15',
  });
  assert.equal(created.error, null);
  assert.equal(created.rules.length, INITIAL_CASHBACK_RULES.length + 1);
  assert.equal(created.rules[0].id, 'CB-04');
  assert.equal(created.rules[0].applicableLabel, 'Semua produk investasi');

  // Valid edit
  const edited = updateCashbackRule(created.rules, {
    id: 'CB-04',
    name: 'Bonus Akhir Tahun VIP',
    targetType: 'produk_tertentu',
    targetProduct: 'C - 10',
    minTransaction: 12_000_000,
    cashbackAmount: 900_000,
    status: 'nonaktif',
  });
  assert.equal(edited.error, null);
  const editedRow = edited.rules.find((r) => r.id === 'CB-04')!;
  assert.equal(editedRow.name, 'Bonus Akhir Tahun VIP');
  assert.equal(editedRow.applicableLabel, 'Pembelian produk: C - 10');
  assert.equal(editedRow.status, 'nonaktif');

  // Delete
  const afterDelete = deleteCashbackRule(edited.rules, 'CB-04');
  assert.equal(afterDelete.length, INITIAL_CASHBACK_RULES.length);
  assert.equal(afterDelete.some((r) => r.id === 'CB-04'), false);

  // Product dropdown options come directly from catalog products with price & image
  const createOptions = getCashbackProductOptions(INVESTMENT_PRODUCTS);
  assert.equal(createOptions.length, INVESTMENT_PRODUCTS.length);
  assert.equal(createOptions[0].value, INVESTMENT_PRODUCTS[0].name);
  assert.equal(createOptions[0].minCapital, INVESTMENT_PRODUCTS[0].minCapital);
  assert.ok(createOptions[0].imageUrl.length > 0);
  assert.equal(createOptions[0].isCustomLegacy, false);
  assert.equal(
    createOptions.some((o) => o.label.includes('(Nonaktif)')),
    true
  );

  // Editing an existing rule preserves custom/legacy product while listing catalog products
  const editOptions = getCashbackProductOptions(INVESTMENT_PRODUCTS, 'V - 50');
  assert.equal(editOptions[0].value, 'V - 50');
  assert.equal(editOptions[0].isCustomLegacy, true);
  assert.equal(editOptions[0].minCapital, null);
  assert.equal(editOptions.length, INVESTMENT_PRODUCTS.length + 1);

  // Matching product lookup for table rows
  const matched = findProductForCashback(INVESTMENT_PRODUCTS, INITIAL_CASHBACK_RULES[1]);
  assert.equal(matched?.id, 'PRD-01');
  assert.equal(matched?.minCapital, 1_000_000);
  assert.equal(findProductForCashback(INVESTMENT_PRODUCTS, INITIAL_CASHBACK_RULES[0]), null);
});

test('Product commissions validate with Zod, sync with active product commission rates, derive automatic member referral codes/links, and aggregate recipients', () => {
  assert.ok(INITIAL_PRODUCT_COMMISSIONS.length >= 10);
  for (const entry of INITIAL_PRODUCT_COMMISSIONS) {
    const parsed = ProductCommissionEntrySchema.safeParse(entry);
    assert.equal(parsed.success, true, `Commission entry ${entry.id} failed validation`);
  }

  const activeSolar = INVESTMENT_PRODUCTS.find((p) => p.id === 'PRD-01')!;
  const inactiveHydro = INVESTMENT_PRODUCTS.find((p) => p.id === 'PRD-06')!;
  assert.equal(isProductCommissionActive(activeSolar), true);
  assert.equal(isProductCommissionActive(inactiveHydro), false);
  assert.equal(
    isProductCommissionActive({ ...activeSolar, commissionRate: 0 }),
    false
  );

  // Percent vs IDR commission calculations
  assert.equal(calculateProductCommissionAmount(activeSolar, 1), 50_000);
  assert.equal(calculateProductCommissionAmount(activeSolar, 3), 150_000);
  assert.equal(
    calculateProductCommissionAmount(
      { minCapital: 1_000_000, commissionType: 'idr', commissionRate: 75_000 },
      2
    ),
    150_000
  );

  // Automatic member referral code & link generation upon registration
  const sampleMember = ADMIN_USER_RECORDS.find((u) => u.id === 'USR-8812')!;
  const autoCode = deriveUserReferralCode(sampleMember);
  assert.equal(autoCode, 'RIZKY2298');
  assert.equal(
    buildReferralRegistrationLink(autoCode),
    'https://finvault.id/daftar?ref=RIZKY2298'
  );

  // Aggregation matches user referral totals and latest commission
  const recipients = aggregateProductCommissionRecipients(
    INITIAL_PRODUCT_COMMISSIONS,
    INVESTMENT_PRODUCTS
  );
  const adi = recipients.find((r) => r.recipientUserId === 'USR-8791')!;
  const rizky = recipients.find((r) => r.recipientUserId === 'USR-8812')!;
  const siti = recipients.find((r) => r.recipientUserId === 'USR-8804')!;
  const tania = recipients.find((r) => r.recipientUserId === 'USR-8398')!;

  assert.equal(adi.totalReceived, 620_000);
  assert.equal(adi.commissionCount, 4);
  assert.equal(adi.latestCommission.id, 'KOM-014');

  assert.equal(rizky.totalReceived, 425_000);
  assert.equal(rizky.commissionCount, 3);
  assert.equal(rizky.latestCommission.id, 'KOM-013');

  assert.equal(siti.totalReceived, 150_000);
  assert.equal(tania.totalReceived, 45_000);

  const overview = getProductCommissionOverview(recipients, INVESTMENT_PRODUCTS);
  assert.equal(overview.totalRecipients, recipients.length);
  assert.equal(overview.totalCommissionsCount, INITIAL_PRODUCT_COMMISSIONS.length);
  assert.equal(overview.activeCommissionProductsCount, 5);

  // Syncs live product active status when catalog changes
  const deactivatedSolarCatalog = INVESTMENT_PRODUCTS.map((p) =>
    p.id === 'PRD-01' ? { ...p, status: 'nonaktif' as const } : p
  );
  const syncedOverview = getProductCommissionOverview(
    aggregateProductCommissionRecipients(INITIAL_PRODUCT_COMMISSIONS, deactivatedSolarCatalog),
    deactivatedSolarCatalog
  );
  assert.equal(syncedOverview.activeCommissionProductsCount, 4);

  // Filtering by referral code & product name
  assert.equal(
    filterProductCommissionRecipients(recipients, { query: 'MOANA2302' }).length,
    1
  );
  assert.equal(
    filterProductCommissionRecipients(recipients, { query: 'Pusat Data Regional Batam' }).length,
    4
  );

  // Per-user detail summary for user with product commissions (Rizky Pratama)
  const rizkySummary = getUserProductCommissionSummary(
    sampleMember,
    INITIAL_PRODUCT_COMMISSIONS,
    INVESTMENT_PRODUCTS
  );
  assert.equal(rizkySummary.referralCode, 'RIZKY2298');
  assert.equal(rizkySummary.referralLink, 'https://finvault.id/daftar?ref=RIZKY2298');
  assert.equal(rizkySummary.commissionCount, 3);
  assert.equal(rizkySummary.totalReceived, 425_000);
  assert.equal(rizkySummary.latestCommission?.id, 'KOM-013');
  assert.equal(rizkySummary.entries.every((e) => e.isProductCommissionCurrentlyActive), true);

  // Per-user detail summary for user with 0 product commissions (Risma)
  const rismaUser = ADMIN_USER_RECORDS.find((u) => u.id === 'USR-2303')!;
  const rismaSummary = getUserProductCommissionSummary(
    rismaUser,
    INITIAL_PRODUCT_COMMISSIONS,
    INVESTMENT_PRODUCTS
  );
  assert.equal(rismaSummary.referralCode, 'RISMA2303');
  assert.equal(rismaSummary.referralLink, 'https://finvault.id/daftar?ref=RISMA2303');
  assert.equal(rismaSummary.commissionCount, 0);
  assert.equal(rismaSummary.totalReceived, 0);
  assert.equal(rismaSummary.latestCommission, null);
});

test('Admin user creation validates required fields, prevents duplicate email/phone, normalizes phone, and derives referral code', () => {
  const missingName = createAdminUser(ADMIN_USER_RECORDS, {
    name: '   ',
    email: 'baru@mail.id',
    phone: '081234567890',
  });
  assert.ok(missingName.error);
  assert.equal(missingName.createdUser, null);

  const duplicateEmail = createAdminUser(ADMIN_USER_RECORDS, {
    name: 'Duplikat Email',
    email: 'RIZKY.PRATAMA@MAIL.ID',
    phone: '081299988877',
  });
  assert.ok(duplicateEmail.error);
  assert.equal(duplicateEmail.createdUser, null);

  const duplicatePhone = createAdminUser(ADMIN_USER_RECORDS, {
    name: 'Duplikat Phone',
    email: 'unik@mail.id',
    phone: '+6281284912201',
  });
  assert.ok(duplicatePhone.error);
  assert.equal(duplicatePhone.createdUser, null);

  const invalidPhone = createAdminUser(ADMIN_USER_RECORDS, {
    name: 'Nomor Pendek',
    email: 'unik@mail.id',
    phone: '08123',
  });
  assert.ok(invalidPhone.error);

  const created = createAdminUser(ADMIN_USER_RECORDS, {
    name: 'Hendra Kusuma',
    email: 'hendra.kusuma@mail.id',
    phone: '081299988877',
    depositBalance: 500_000,
    invitedBy: '#2298 rizky',
    emailVerified: true,
    accountStatus: 'aktif',
    actor: 'Alfaciro Admin',
    now: new Date(2026, 10, 15, 9, 30),
  });
  assert.equal(created.error, null);
  assert.ok(created.createdUser);
  assert.equal(created.users.length, ADMIN_USER_RECORDS.length + 1);
  assert.equal(created.createdUser.id, 'USR-2304');
  assert.equal(created.createdUser.userNumber, 2304);
  assert.equal(created.createdUser.phone, '0812-9998-8877');
  assert.equal(created.createdUser.whatsappRaw, '6281299988877');
  assert.equal(created.createdUser.depositBalance, 500_000);
  assert.equal(created.createdUser.transactions.length, 1);
  assert.equal(deriveUserReferralCode(created.createdUser), 'HENDRA2304');
});

test('User levels validate VIP 1-8 thresholds, withdrawal limits, salary periods, custom columns, and badge paths', () => {
  assert.equal(DEFAULT_USER_LEVEL_RULES.length, 8);
  for (const rule of DEFAULT_USER_LEVEL_RULES) {
    const parsed = UserLevelRuleSchema.safeParse(rule);
    assert.equal(parsed.success, true, `Level ${rule.level} failed validation`);
    assert.equal(rule.badgeImageUrl, getVipBadgeImageSrc(rule.level));
    assert.ok(rule.maxWithdrawal >= rule.minWithdrawal);
  }

  // Exact defaults for VIP 1-8
  assert.equal(DEFAULT_USER_LEVEL_RULES[0].minActiveReferrals, 0);
  assert.equal(DEFAULT_USER_LEVEL_RULES[0].minTotalPurchase, 0);
  assert.equal(DEFAULT_USER_LEVEL_RULES[0].minWithdrawal, 50_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[0].maxWithdrawal, 500_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[0].tierTitle, 'Bronze');
  assert.equal(DEFAULT_USER_LEVEL_RULES[1].minActiveReferrals, 5);
  assert.equal(DEFAULT_USER_LEVEL_RULES[1].minTotalPurchase, 5_000_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[2].minActiveReferrals, 15);
  assert.equal(DEFAULT_USER_LEVEL_RULES[2].minTotalPurchase, 25_000_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[3].minActiveReferrals, 50);
  assert.equal(DEFAULT_USER_LEVEL_RULES[3].minTotalPurchase, 50_000_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[4].minActiveReferrals, 150);
  assert.equal(DEFAULT_USER_LEVEL_RULES[4].minTotalPurchase, 100_000_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[5].minActiveReferrals, 250);
  assert.equal(DEFAULT_USER_LEVEL_RULES[5].minTotalPurchase, 250_000_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[6].minActiveReferrals, 500);
  assert.equal(DEFAULT_USER_LEVEL_RULES[6].minTotalPurchase, 700_000_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[7].minActiveReferrals, 1000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[7].minTotalPurchase, 5_000_000_000);
  assert.equal(DEFAULT_USER_LEVEL_RULES[7].tierTitle, 'Ruby');

  // Dual condition: 10 referrals but only 1M purchase -> stays VIP 1
  const onlyReferralsMet = evaluateUserLevel(10, 1_000_000, DEFAULT_USER_LEVEL_RULES);
  assert.equal(onlyReferralsMet.currentRule.level, 1);
  assert.equal(onlyReferralsMet.nextRule?.level, 2);
  assert.equal(onlyReferralsMet.missingReferrals, 0);
  assert.equal(onlyReferralsMet.missingPurchase, 4_000_000);
  assert.equal(onlyReferralsMet.referralProgressPercent, 100);
  assert.equal(onlyReferralsMet.purchaseProgressPercent, 20);
  assert.equal(onlyReferralsMet.overallProgressPercent, 60);

  // Dual condition: 20M purchase but only 3 referrals -> stays VIP 1
  const onlyPurchaseMet = evaluateUserLevel(3, 20_000_000, DEFAULT_USER_LEVEL_RULES);
  assert.equal(onlyPurchaseMet.currentRule.level, 1);
  assert.equal(onlyPurchaseMet.missingReferrals, 2);
  assert.equal(onlyPurchaseMet.referralProgressPercent, 60);
  assert.equal(onlyPurchaseMet.purchaseProgressPercent, 100);
  assert.equal(onlyPurchaseMet.overallProgressPercent, 80);

  // Meets VIP 3 exactly
  const level3 = evaluateUserLevel(15, 25_000_000, DEFAULT_USER_LEVEL_RULES);
  assert.equal(level3.currentRule.level, 3);
  assert.equal(level3.nextRule?.level, 4);

  // Meets VIP 8
  const level8 = evaluateUserLevel(1200, 6_000_000_000, DEFAULT_USER_LEVEL_RULES);
  assert.equal(level8.currentRule.level, 8);
  assert.equal(level8.nextRule, null);
  assert.equal(level8.overallProgressPercent, 100);

  // Active referral count checks only referrals with investments (status === 'aktif')
  const rizky = ADMIN_USER_RECORDS.find((u) => u.id === 'USR-8812')!;
  assert.equal(countUserActiveReferrals(rizky), 2);

  // Validation rejects non-monotonic decrease (VIP 3 < VIP 2)
  const invalidDecrease = cloneDefaultUserLevelRules();
  invalidDecrease[2].minActiveReferrals = 2;
  const decreasedResult = validateAndSaveUserLevels(invalidDecrease);
  assert.ok(decreasedResult.error);

  // Validation rejects maxWithdrawal < minWithdrawal
  const invalidWdRange = cloneDefaultUserLevelRules();
  invalidWdRange[0].minWithdrawal = 300_000;
  invalidWdRange[0].maxWithdrawal = 100_000;
  assert.ok(validateAndSaveUserLevels(invalidWdRange).error);

  // Validation rejects empty custom column label or value
  const emptyCustomField = cloneDefaultUserLevelRules();
  emptyCustomField[1].extraBenefits = [{ id: 'c1', label: 'Bonus Harian', value: '' }];
  assert.ok(validateAndSaveUserLevels(emptyCustomField).error);

  // Validation saves custom columns, salary periods, and editable VIP 1 values cleanly
  const customRules = cloneDefaultUserLevelRules();
  customRules[0].minWithdrawal = 25_000;
  customRules[0].maxWithdrawal = 400_000;
  customRules[0].salaryAmount = 15_000;
  customRules[0].salaryPeriod = 'hari';
  customRules[1].extraRequirements = [
    { id: 'req-1', label: 'Minimal Produk Aktif', value: '2 paket' },
  ];
  customRules[1].extraBenefits = [
    { id: 'ben-1', label: 'Bonus Naik VIP', value: 'Rp 100.000' },
  ];
  const saved = validateAndSaveUserLevels(customRules);
  assert.equal(saved.error, null);
  assert.equal(saved.rules[0].minWithdrawal, 25_000);
  assert.equal(saved.rules[0].maxWithdrawal, 400_000);
  assert.equal(saved.rules[0].salaryAmount, 15_000);
  assert.equal(formatSalaryPeriodLabel(saved.rules[0].salaryPeriod), 'Hari');
  assert.equal(formatSalaryPeriodLabel(saved.rules[1].salaryPeriod), 'Minggu');
  assert.equal(saved.rules[1].extraRequirements[0].label, 'Minimal Produk Aktif');
  assert.equal(saved.rules[1].extraBenefits[0].value, 'Rp 100.000');

  // Storage serialization round-trip & corrupt payload rejection
  const parsedStored = parseStoredUserLevels(JSON.stringify(saved.rules));
  assert.ok(parsedStored);
  assert.equal(parsedStored[0].maxWithdrawal, 400_000);
  assert.equal(parsedStored[1].extraBenefits[0].label, 'Bonus Naik VIP');
  assert.equal(parseStoredUserLevels('bad-json'), null);
  assert.equal(parseStoredUserLevels('[]'), null);
});

test('Company settings start completely empty and validate optional images plus CS contacts', () => {
  const empty = createEmptyCompanySettings();
  assert.equal(empty.faqImage, null);
  assert.equal(empty.rulesImage, null);
  assert.equal(empty.contractImage, null);
  assert.equal(empty.charityImage, null);
  assert.equal(empty.csPhone, '');
  assert.equal(empty.csEmail, '');
  assert.equal(empty.updatedAt, null);

  assert.equal(validateCompanyCsPhone('0812-0000-1234'), null);
  assert.ok(validateCompanyCsPhone('123'));
  assert.ok(validateCompanyCsPhone('abc12345'));
  assert.equal(formatCompanyImageSize(51200), '50 KB');
  assert.equal(formatCompanyImageSize(2 * 1024 * 1024), '2,00 MB');

  const invalidEmailResult = validateAndSaveCompanySettings({
    ...empty,
    csPhone: '081200001234',
    csEmail: 'bukan-email',
  });
  assert.ok(invalidEmailResult.error);
  assert.equal(invalidEmailResult.settings, null);

  const validResult = validateAndSaveCompanySettings({
    faqImage: {
      dataUrl: 'data:image/png;base64,AAAA',
      fileName: 'faq.png',
      fileSize: 2048,
      updatedAt: '2026-11-14T10:00:00.000Z',
    },
    rulesImage: null,
    contractImage: null,
    charityImage: null,
    csPhone: '+62 812-0000-1234',
    csEmail: 'cs@finvault.example',
  });
  assert.equal(validResult.error, null);
  assert.equal(validResult.settings?.csEmail, 'cs@finvault.example');
  assert.equal(validResult.settings?.faqImage?.fileName, 'faq.png');
  assert.equal(validResult.settings?.rulesImage, null);
});

test('Admin auth verifies login, enforces password rules, and updates active login password', () => {
  const account = createInitialAdminAccount();
  assert.equal(getAdminInitials(account.session.name), 'AA');

  const wrongLogin = verifyAdminLogin(account, {
    email: account.session.email,
    password: 'PasswordSalah123',
  });
  assert.equal(wrongLogin.success, false);

  const validLogin = verifyAdminLogin(account, {
    email: account.session.email.toUpperCase(),
    password: DEMO_ADMIN_PASSWORD,
  });
  assert.equal(validLogin.success, true);

  const mismatchChange = changeAdminPassword(account, {
    currentPassword: DEMO_ADMIN_PASSWORD,
    newPassword: 'NewSecure#Password1',
    confirmPassword: 'Different#Password2',
  });
  assert.equal(mismatchChange.success, false);

  const shortChange = changeAdminPassword(account, {
    currentPassword: DEMO_ADMIN_PASSWORD,
    newPassword: 'short',
    confirmPassword: 'short',
  });
  assert.equal(shortChange.success, false);

  const updated = changeAdminPassword(account, {
    currentPassword: DEMO_ADMIN_PASSWORD,
    newPassword: 'FinVault#Updated2026',
    confirmPassword: 'FinVault#Updated2026',
  });
  assert.equal(updated.success, true);
  if (updated.success) {
    const oldPassCheck = verifyAdminLogin(updated.account, {
      email: account.session.email,
      password: DEMO_ADMIN_PASSWORD,
    });
    assert.equal(oldPassCheck.success, false);

    const newPassCheck = verifyAdminLogin(updated.account, {
      email: account.session.email,
      password: 'FinVault#Updated2026',
    });
    assert.equal(newPassCheck.success, true);
  }
});

test('Bank settings manage manual bank transfer CRUD, DOKU toggle, and QRIS/channel ON-OFF toggles', () => {
  const initial = createInitialBankSettings();
  assert.equal(BankSettingsStateSchema.safeParse(initial).success, true);
  assert.equal(initial.manualBanks.length, 0);
  assert.equal(initial.dokuEnabled, true);
  assert.ok(initial.paymentMethods.some((m) => m.code === 'QRIS' && m.enabled));

  // Invalid numeric format must fail
  const invalidAttempt = addManualBankAccount(initial, {
    bankName: 'Bank Contoh',
    accountNumber: '123',
    accountHolder: 'PT Contoh Nusantara',
    branchOrNote: '',
    isActive: true,
  });
  assert.ok(invalidAttempt.error);
  assert.equal(invalidAttempt.state.manualBanks.length, 0);

  // Valid creation normalizes spaces/dashes and assigns sequential ID
  const created = addManualBankAccount(initial, {
    bankName: 'Bank Contoh',
    accountNumber: '0000-1234-56',
    accountHolder: 'PT Contoh Nusantara',
    branchOrNote: 'Cabang Uji',
    isActive: true,
  });
  assert.equal(created.error, null);
  assert.equal(created.state.manualBanks.length, 1);
  assert.equal(created.state.manualBanks[0].id, 'BNK-01');
  assert.equal(created.state.manualBanks[0].accountNumber, '0000123456');
  assert.equal(formatBankAccountNumber('0000123456'), '0000 1234 56');

  // Duplicate bankName + accountNumber must be rejected
  const duplicate = addManualBankAccount(created.state, {
    bankName: 'bank contoh',
    accountNumber: '0000 1234 56',
    accountHolder: 'PT Contoh Lain',
    branchOrNote: '',
    isActive: true,
  });
  assert.ok(duplicate.error);

  // Update, toggle status, and delete work cleanly
  const updated = updateManualBankAccount(created.state, 'BNK-01', {
    bankName: 'Bank Contoh Syariah',
    accountNumber: '0000987654',
    accountHolder: 'PT Contoh Nusantara',
    branchOrNote: 'Catatan Baru',
    isActive: true,
  });
  assert.equal(updated.error, null);
  assert.equal(updated.state.manualBanks[0].bankName, 'Bank Contoh Syariah');

  const toggledBank = toggleManualBankAccountStatus(updated.state, 'BNK-01');
  assert.equal(toggledBank.manualBanks[0].isActive, false);

  const removedBank = deleteManualBankAccount(toggledBank, 'BNK-01');
  assert.equal(removedBank.manualBanks.length, 0);

  // Toggle QRIS OFF and DOKU Gateway OFF
  const qrisMethod = initial.paymentMethods.find((m) => m.code === 'QRIS')!;
  const qrisToggled = togglePaymentMethodEnabled(removedBank, qrisMethod.id);
  assert.equal(
    qrisToggled.paymentMethods.find((m) => m.code === 'QRIS')?.enabled,
    false
  );

  const dokuToggled = toggleDokuGatewayEnabled(qrisToggled);
  assert.equal(dokuToggled.dokuEnabled, false);

  assert.equal(
    filterPaymentMethods(dokuToggled.paymentMethods, 'manual').every(
      (m) => m.provider === 'manual'
    ),
    true
  );
  assert.equal(
    filterPaymentMethods(dokuToggled.paymentMethods, 'doku').every(
      (m) => m.provider === 'doku'
    ),
    true
  );
});

test('Indonesian bank logo catalog covers banks across Indonesia and resolves channels accurately', () => {
  assert.ok(
    INDONESIAN_BANK_OPTIONS.length >= 100,
    `Expected at least 100 Indonesian bank logos, found ${INDONESIAN_BANK_OPTIONS.length}`
  );

  // Common banks, syariah banks, digital banks, regional BPDs, and clearing codes
  assert.equal(resolveIndonesianBankSlug('Bank BCA'), 'bca');
  assert.equal(resolveIndonesianBankSlug('BCA Virtual Account'), 'bca');
  assert.equal(resolveIndonesianBankSlug('014'), 'bca');
  assert.equal(resolveIndonesianBankSlug('Mandiri Transfer'), 'mandiri');
  assert.equal(resolveIndonesianBankSlug('Bank BRI · 041901002'), 'bri');
  assert.equal(resolveIndonesianBankSlug('BNI Virtual Account'), 'bni');
  assert.equal(resolveIndonesianBankSlug('Bank Syariah Indonesia'), 'bsi');
  assert.equal(resolveIndonesianBankSlug('Bank Danamon'), 'danamon');
  assert.equal(resolveIndonesianBankSlug('SeaBank'), 'seabank');
  assert.equal(resolveIndonesianBankSlug('Bank Jago'), 'jago');
  assert.equal(resolveIndonesianBankSlug('QRIS Instan'), 'qris');
  assert.equal(resolveIndonesianBankSlug('DOKU'), 'doku');

  // Prevents short acronym false positives on unrelated text and returns null for unknown/empty
  assert.equal(resolveIndonesianBankSlug('Bank Perdana Uji'), null);
  assert.equal(resolveIndonesianBankSlug(''), null);
  assert.equal(resolveIndonesianBankSlug('Bank Fiktif Nusantara'), null);

  // Multi-brand payment method channels
  assert.deepEqual(resolvePaymentChannelSlugs('Virtual Account BRI & BNI'), ['bri', 'bni']);
  assert.deepEqual(resolvePaymentChannelSlugs('E-Wallet (OVO, DANA, ShopeePay, LinkAja)'), [
    'ovo',
    'dana',
    'shopee-pay',
    'linkaja',
  ]);
  assert.deepEqual(resolvePaymentChannelSlugs('Kartu Kredit / Debit Online'), ['visa', 'mastercard']);
  assert.deepEqual(resolvePaymentChannelSlugs('Gerai Ritel (Alfamart / Indomaret)'), [
    'alfamart',
    'indomaret',
  ]);
});

test('Ad banners validate with Zod, include Bonus Reward Honda Beat seed, support CRUD/filtering, and resolve member login popups', () => {
  assert.equal(INITIAL_AD_BANNERS.length, 1);
  const seed = INITIAL_AD_BANNERS[0];
  assert.equal(AdBannerRecordSchema.safeParse(seed).success, true);
  assert.equal(seed.title, 'Bonus Reward Honda Beat');
  assert.equal(seed.showTime, '-');
  assert.equal(seed.status, 'Active');
  assert.equal(seed.createdAt, '2026-09-27 22:36');

  // Validation rejects missing image or missing title
  const missingImage = addAdBanner(INITIAL_AD_BANNERS, {
    title: 'Promo Baru',
    imageUrl: '   ',
    imageFileName: '',
    showTime: '',
    status: 'Active',
    showOnMemberLogin: true,
  });
  assert.ok(missingImage.error);
  assert.equal(missingImage.created, null);

  const missingTitle = addAdBanner(INITIAL_AD_BANNERS, {
    title: '   ',
    imageUrl: 'data:image/png;base64,AAAA',
    imageFileName: 'promo.png',
    showTime: '',
    status: 'Active',
    showOnMemberLogin: true,
  });
  assert.ok(missingTitle.error);

  // Valid creation assigns sequential IKL-02 ID and defaults empty showTime to "-"
  const created = addAdBanner(
    INITIAL_AD_BANNERS,
    {
      title: 'Promo Cashback Akhir Tahun',
      imageUrl: 'data:image/png;base64,AAAA',
      imageFileName: 'promo-portrait.png',
      showTime: '   ',
      status: 'Active',
      showOnMemberLogin: true,
    },
    new Date(2026, 10, 15, 10, 5)
  );
  assert.equal(created.error, null);
  assert.equal(created.created?.id, 'IKL-02');
  assert.equal(created.created?.showTime, '-');
  assert.equal(created.created?.createdAt, '2026-11-15 10:05');
  assert.equal(getActiveMemberLoginAds(created.records).length, 2);

  // Filter by title & status
  assert.equal(
    filterAdBanners(created.records, { query: 'Honda Beat', statusFilter: 'all' }).length,
    1
  );

  // Toggle Inactive removes it from active member login popups
  const toggled = toggleAdBannerStatus(created.records, 'IKL-02');
  assert.equal(toggled.find((a) => a.id === 'IKL-02')?.status, 'Inactive');
  assert.equal(getActiveMemberLoginAds(toggled).length, 1);
  assert.equal(
    filterAdBanners(toggled, { query: '', statusFilter: 'Inactive' }).length,
    1
  );

  // Edit title and showTime
  const updated = updateAdBanner(toggled, 'IKL-02', {
    title: 'Promo Cashback VIP',
    imageUrl: 'data:image/png;base64,BBBB',
    imageFileName: 'promo-vip.png',
    showTime: '08:00 - 21:00',
    status: 'Active',
    showOnMemberLogin: true,
  });
  assert.equal(updated.error, null);
  const editedAd = updated.records.find((a) => a.id === 'IKL-02')!;
  assert.equal(editedAd.title, 'Promo Cashback VIP');
  assert.equal(editedAd.showTime, '08:00 - 21:00');
  assert.equal(getActiveMemberLoginAds(updated.records).length, 2);

  // Delete removes target ad cleanly
  const afterDelete = deleteAdBanner(updated.records, 'IKL-02');
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete.some((a) => a.id === 'IKL-02'), false);
});

test('Member marquee announcements validate with Zod, include Pemeliharaan sistem seed, and support CRUD/filtering', () => {
  assert.equal(INITIAL_ANNOUNCEMENTS.length, 1);
  for (const item of INITIAL_ANNOUNCEMENTS) {
    const parsed = AnnouncementRecordSchema.safeParse(item);
    assert.equal(parsed.success, true, `Announcement ${item.id} failed Zod validation`);
  }

  const seed = INITIAL_ANNOUNCEMENTS[0];
  assert.equal(seed.title, 'Pemeliharaan sistem');
  assert.equal(seed.publishedAt, '07 Oct 2026, 10:28');
  assert.equal(seed.status, 'Active');
  assert.equal(seed.showOnMemberMarquee, true);
  assert.ok(seed.message.includes('https://folgers.biz.id/'));
  assert.ok(seed.message.includes('Admin Folgers Coffee'));

  assert.equal(
    formatAnnouncementDate(new Date(2026, 9, 7, 10, 28)),
    '07 Oct 2026, 10:28'
  );

  // Empty title or message is rejected
  const emptyTitle = addAnnouncement(INITIAL_ANNOUNCEMENTS, {
    title: '   ',
    message: 'Isi pengumuman valid',
    status: 'Active',
    showOnMemberMarquee: true,
  });
  assert.ok(emptyTitle.error);
  assert.equal(emptyTitle.created, null);

  const emptyMessage = addAnnouncement(INITIAL_ANNOUNCEMENTS, {
    title: 'Jadwal Maintenance',
    message: '   ',
    status: 'Active',
    showOnMemberMarquee: true,
  });
  assert.ok(emptyMessage.error);

  // Valid creation assigns sequential ANN-02 ID and feeds marquee text
  const created = addAnnouncement(
    INITIAL_ANNOUNCEMENTS,
    {
      title: 'Update Jadwal Pencairan',
      message: 'Penarikan dana diproses normal pukul 08:00 - 21:00 WIB.',
      status: 'Active',
      showOnMemberMarquee: true,
    },
    new Date(2026, 10, 15, 9, 5)
  );
  assert.equal(created.error, null);
  assert.equal(created.created?.id, 'ANN-02');
  assert.equal(created.created?.publishedAt, '15 Nov 2026, 09:05');
  assert.equal(getActiveMemberMarqueeAnnouncements(created.records).length, 2);
  assert.ok(buildMemberMarqueeText(created.records).includes('Update Jadwal Pencairan'));

  // Search & status filtering
  assert.equal(
    filterAnnouncements(created.records, {
      query: 'folgers.biz.id',
      statusFilter: 'all',
    }).length,
    1
  );

  // Toggle status removes item from active member marquee
  const toggled = toggleAnnouncementStatus(created.records, 'ANN-02');
  assert.equal(toggled.find((a) => a.id === 'ANN-02')?.status, 'Inactive');
  assert.equal(getActiveMemberMarqueeAnnouncements(toggled).length, 1);
  assert.equal(
    filterAnnouncements(toggled, { query: '', statusFilter: 'Inactive' }).length,
    1
  );

  // Update edits title, message, and reactivates marquee
  const updated = updateAnnouncement(toggled, 'ANN-02', {
    title: 'Update Layanan Member',
    message: 'Layanan top up & klaim berjalan lancar 24 jam.',
    status: 'Active',
    showOnMemberMarquee: true,
  });
  assert.equal(updated.error, null);
  assert.equal(getActiveMemberMarqueeAnnouncements(updated.records).length, 2);

  // Delete removes target cleanly
  const afterDelete = deleteAnnouncement(updated.records, 'ANN-02');
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete.some((a) => a.id === 'ANN-02'), false);

  // Marquee speed options, CSS class mapping, and validation fallback
  assert.equal(DEFAULT_MARQUEE_DURATION_SECONDS, 32);
  assert.equal(MARQUEE_SPEED_OPTIONS.length, 7);
  assert.equal(getMarqueeSpeedOption(48).label, 'Lambat');
  assert.equal(getMarqueeSpeedOption(18).label, 'Cepat');
  assert.equal(getMarqueeDurationClassName(60), 'marquee-duration-60');
  assert.equal(getMarqueeDurationClassName(8), 'marquee-duration-8');
  assert.equal(parseMarqueeDurationSeconds(18), 18);
  assert.equal(parseMarqueeDurationSeconds(999), DEFAULT_MARQUEE_DURATION_SECONDS);
});

test('Vouchers validate with Zod, match 5N9JK5 seed row, filter by code/status, and support creation & status lifecycle', () => {
  assert.equal(INITIAL_VOUCHERS.length, 1);
  for (const v of INITIAL_VOUCHERS) {
    const parsed = VoucherRecordSchema.safeParse(v);
    assert.equal(parsed.success, true, `Voucher ${v.id} failed Zod validation`);
  }

  const seed = INITIAL_VOUCHERS[0];
  assert.equal(seed.code, '5N9JK5');
  assert.equal(seed.totalAmount, 100_000);
  assert.equal(seed.remainingAmount, 17_000);
  assert.equal(seed.quota, 2);
  assert.equal(seed.claimedCount, 1);
  assert.equal(seed.expiredAt, '2026-11-14 17:01');
  assert.equal(seed.status, 'Expired');
  assert.equal(
    seed.claims.reduce((sum, c) => sum + c.claimedAmount, 0),
    seed.totalAmount - seed.remainingAmount
  );

  assert.equal(
    normalizeVoucherExpiredAt('2026-11-20T18:30'),
    '2026-11-20 18:30'
  );

  const generated = generateVoucherCode(INITIAL_VOUCHERS, 6, () => 0.1);
  assert.equal(generated.length, 6);
  assert.notEqual(generated, '5N9JK5');

  // Duplicate code (case-insensitive) and empty expiry must be rejected
  const duplicate = addVoucher(INITIAL_VOUCHERS, {
    code: '5n9jk5',
    totalAmount: 50_000,
    quota: 5,
    expiredAt: '2026-11-25T23:59',
    status: 'Active',
  });
  assert.ok(duplicate.error);
  assert.equal(duplicate.created, null);

  const missingExpiry = addVoucher(INITIAL_VOUCHERS, {
    code: 'PROMO25',
    totalAmount: 50_000,
    quota: 5,
    expiredAt: '',
    status: 'Active',
  });
  assert.ok(missingExpiry.error);

  // Valid creation assigns sequential VCH-02 ID and initializes remainingAmount = totalAmount
  const created = addVoucher(
    INITIAL_VOUCHERS,
    {
      code: 'hemat50',
      totalAmount: 250_000,
      quota: 5,
      expiredAt: '2026-11-25T23:59',
      status: 'Active',
    },
    new Date(2026, 10, 15, 10, 0)
  );
  assert.equal(created.error, null);
  assert.equal(created.created?.id, 'VCH-02');
  assert.equal(created.created?.code, 'HEMAT50');
  assert.equal(created.created?.remainingAmount, 250_000);
  assert.equal(created.created?.claimedCount, 0);
  assert.equal(created.created?.expiredAt, '2026-11-25 23:59');

  const summary = getVoucherSummary(created.records);
  assert.equal(summary.totalCount, 2);
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.expiredCount, 1);
  assert.equal(summary.totalBudget, 350_000);
  assert.equal(summary.totalRemaining, 267_000);

  // Filter by code and status
  assert.equal(
    filterVouchers(created.records, { query: '5N9', statusFilter: 'all' }).length,
    1
  );
  assert.equal(
    filterVouchers(created.records, { query: '', statusFilter: 'Active' }).length,
    1
  );

  // Expired voucher cannot be toggled directly, Active voucher toggles to Inactive
  const expiredToggle = toggleVoucherStatus(created.records, 'VCH-01');
  assert.ok(expiredToggle.error);
  const validToggle = toggleVoucherStatus(created.records, 'VCH-02');
  assert.equal(validToggle.error, null);
  assert.equal(validToggle.records.find((v) => v.id === 'VCH-02')?.status, 'Inactive');

  // Delete removes target voucher cleanly
  const afterDelete = deleteVoucher(validToggle.records, 'VCH-02');
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete.some((v) => v.id === 'VCH-02'), false);
});

test('Member Android App state validates with Zod and handles login, daily claim, purchase, top up, withdrawal, voucher redeem, and bank addition', () => {
  const initialState = createInitialMemberAppState('USR-8812', true);
  const parsed = MemberAppStateSchema.safeParse(initialState);
  assert.equal(parsed.success, true, 'Initial MemberAppState should pass Zod validation');
  assert.equal(initialState.member.name, 'Rizky Pratama');
  assert.equal(initialState.activeInvestments.length, 2);

  // Login fails cleanly on invalid credentials & succeeds for Siti Nurhaliza
  const badLogin = loginMemberByIdentifier(initialState, 'unknown@mail.id', 'member1234');
  assert.ok(badLogin.error);
  const goodLogin = loginMemberByIdentifier(initialState, 'siti.nur@mail.id', 'member1234');
  assert.equal(goodLogin.error, null);
  assert.equal(goodLogin.state.member.id, 'USR-8804');
  assert.equal(goodLogin.state.isLoggedIn, true);

  // Claim daily investment yield increments withdrawableBalance and blocks duplicate claim today
  const firstInv = initialState.activeInvestments[0];
  const claimRes = claimMemberDailyInvestment(initialState, firstInv.id);
  assert.equal(claimRes.error, null);
  assert.equal(claimRes.claimedAmount, firstInv.dailyClaimIncome);
  assert.equal(
    claimRes.state.member.withdrawableBalance,
    initialState.member.withdrawableBalance + firstInv.dailyClaimIncome
  );
  const dupClaim = claimMemberDailyInvestment(claimRes.state, firstInv.id);
  assert.ok(dupClaim.error);

  // Purchase active product deducts depositBalance and appends portfolio entry
  const umkmProduct = INVESTMENT_PRODUCTS.find((p) => p.id === 'PRD-03')!;
  const purchaseRes = purchaseMemberProduct(claimRes.state, umkmProduct, 2);
  assert.equal(purchaseRes.error, null);
  assert.equal(
    purchaseRes.state.member.depositBalance,
    claimRes.state.member.depositBalance - umkmProduct.minCapital * 2
  );
  assert.equal(
    purchaseRes.state.activeInvestments.length,
    claimRes.state.activeInvestments.length + 1
  );

  // Instant DOKU Top Up increases depositBalance immediately; insufficient below min fails
  const lowTopUp = submitMemberTopUp(purchaseRes.state, {
    amount: 10_000,
    channelLabel: 'QRIS',
    isInstantGateway: true,
  });
  assert.ok(lowTopUp.error);
  const validTopUp = submitMemberTopUp(purchaseRes.state, {
    amount: 500_000,
    channelLabel: 'QRIS',
    isInstantGateway: true,
  });
  assert.equal(validTopUp.error, null);
  assert.equal(
    validTopUp.state.member.depositBalance,
    purchaseRes.state.member.depositBalance + 500_000
  );

  // Expired voucher 5N9JK5 is rejected; active voucher FOLGERS25 credits withdrawableBalance once
  const expiredRedeem = redeemMemberVoucher(validTopUp.state, '5N9JK5');
  assert.ok(expiredRedeem.error);
  const activeRedeem = redeemMemberVoucher(validTopUp.state, 'folgers25');
  assert.equal(activeRedeem.error, null);
  assert.equal(activeRedeem.claimedAmount, 25_000);
  assert.equal(
    activeRedeem.state.member.withdrawableBalance,
    validTopUp.state.member.withdrawableBalance + 25_000
  );
  const doubleRedeem = redeemMemberVoucher(activeRedeem.state, 'FOLGERS25');
  assert.ok(doubleRedeem.error);

  // Add bank & submit withdrawal deducts withdrawableBalance cleanly
  const addBankRes = addMemberBankAccount(activeRedeem.state, {
    bankName: 'Bank Mandiri',
    accountNumber: '1370004921182',
    accountHolder: 'Rizky Pratama',
  });
  assert.equal(addBankRes.error, null);
  assert.equal(addBankRes.state.member.banks.length, initialState.member.banks.length + 1);

  const wdRes = submitMemberWithdrawal(addBankRes.state, {
    amount: 300_000,
    bankId: addBankRes.state.member.banks[0].id,
  });
  assert.equal(wdRes.error, null);
  assert.equal(
    wdRes.state.member.withdrawableBalance,
    addBankRes.state.member.withdrawableBalance - 300_000
  );
});

test('Product allowedLevels validates with Zod, formats access summaries, saves via admin CRUD, and restricts ineligible member levels', () => {
  assert.equal(formatAllowedLevelsLabel(ALL_USER_LEVELS), 'Semua VIP');
  assert.equal(formatAllowedLevelsLabel([2, 3, 4, 5, 6, 7, 8]), 'VIP 2–8');
  assert.equal(formatAllowedLevelsLabel([3]), 'VIP 3');
  assert.equal(formatAllowedLevelsLabel([6, 2, 4, 2]), 'VIP 2, 4, 6');
  assert.deepEqual(normalizeAllowedLevels([8, 2, 2, 99, 0, 3]), [2, 3, 8]);

  assert.equal(canUserLevelPurchaseProduct(1, [2, 3, 4]), false);
  assert.equal(canUserLevelPurchaseProduct(2, [2, 3, 4]), true);
  assert.equal(canUserLevelPurchaseProduct(1, ALL_USER_LEVELS), true);

  // Rejects empty allowedLevels or out-of-range levels
  const emptyLevels = InvestmentProductSchema.safeParse({
    ...INVESTMENT_PRODUCTS[0],
    allowedLevels: [],
  });
  assert.equal(emptyLevels.success, false);

  const invalidLevel = InvestmentProductSchema.safeParse({
    ...INVESTMENT_PRODUCTS[0],
    allowedLevels: [9],
  });
  assert.equal(invalidLevel.success, false);

  // VIP corner badge formatter mirrors Admin allowedLevels configuration without Level/Lvl wording
  assert.equal(formatProductVipLevelBadge(ALL_USER_LEVELS), 'VIP 1–8');
  assert.equal(formatProductVipLevelBadge([2, 3, 4, 5, 6, 7, 8]), 'VIP 2–8');
  assert.equal(formatProductVipLevelBadge([3]), 'VIP 3');
  assert.equal(formatProductVipLevelBadge([6, 2, 4, 2]), 'VIP 2, 4, 6');
  assert.equal(formatProductVipLevelBadge([]), 'VIP -');

  // Admin CRUD persists custom allowedLevels sorted & deduplicated
  const updated = updateInvestmentProduct(INVESTMENT_PRODUCTS, {
    ...INVESTMENT_PRODUCTS[0],
    allowedLevels: [5, 3, 4, 3],
  });
  assert.deepEqual(updated[0].allowedLevels, [3, 4, 5]);
  assert.equal(formatAllowedLevelsLabel(updated[0].allowedLevels), 'VIP 3–5');
  assert.equal(formatProductVipLevelBadge(updated[0].allowedLevels), 'VIP 3–5');

  // Stored product serialization validates Zod schema cleanly and rejects corrupt payloads
  const parsedStored = parseStoredProducts(JSON.stringify(updated));
  assert.ok(parsedStored);
  assert.deepEqual(parsedStored[0].allowedLevels, [3, 4, 5]);
  assert.equal(parseStoredProducts('not-json'), null);
  assert.equal(parseStoredProducts('[]'), null);
  assert.equal(
    parseStoredProducts(JSON.stringify([{ ...INVESTMENT_PRODUCTS[0], allowedLevels: [] }])),
    null
  );

  // VIP 1 member cannot purchase PRD-04 (restricted to VIP 2-8), even with sufficient depositBalance
  const memberState = createInitialMemberAppState('USR-8812', true);
  assert.equal(getMemberCurrentLevel(memberState.member), 1);
  const richLevel1State = {
    ...memberState,
    member: {
      ...memberState.member,
      depositBalance: 10_000_000,
    },
  };
  const restrictedProduct = INVESTMENT_PRODUCTS.find((p) => p.id === 'PRD-04')!;
  const blockedPurchase = purchaseMemberProduct(richLevel1State, restrictedProduct, 1);
  assert.ok(blockedPurchase.error);
  assert.ok(blockedPurchase.error.includes('VIP 2–8'));

  // Member who reaches Level 2 (5 active referrals & >= Rp 5jt total purchase) can purchase PRD-04
  const level2State = {
    ...richLevel1State,
    member: {
      ...richLevel1State.member,
      totalInvestmentModal: 10_000_000,
      referrals: [
        ...richLevel1State.member.referrals,
        { id: 'R3', userName: '#2401 A', joinedAt: '14 Nov 2026', commissionEarned: 50_000, status: 'aktif' as const },
        { id: 'R4', userName: '#2402 B', joinedAt: '14 Nov 2026', commissionEarned: 50_000, status: 'aktif' as const },
        { id: 'R5', userName: '#2403 C', joinedAt: '14 Nov 2026', commissionEarned: 50_000, status: 'aktif' as const },
      ],
    },
  };
  assert.equal(getMemberCurrentLevel(level2State.member), 2);
  const allowedPurchase = purchaseMemberProduct(level2State, restrictedProduct, 1);
  assert.equal(allowedPurchase.error, null);
  assert.equal(
    allowedPurchase.state.member.depositBalance,
    level2State.member.depositBalance - restrictedProduct.minCapital
  );
});

test('Member withdrawal enforces Admin-configured VIP min and max withdrawal bounds per VIP tier', () => {
  const baseState = createInitialMemberAppState('USR-8812', true);
  const richMemberState = {
    ...baseState,
    member: {
      ...baseState.member,
      withdrawableBalance: 5_000_000,
    },
  };
  const bankId = richMemberState.member.banks[0].id;

  const customRules = cloneDefaultUserLevelRules();
  customRules[0].minWithdrawal = 100_000;
  customRules[0].maxWithdrawal = 300_000;

  const tooLow = submitMemberWithdrawal(
    richMemberState,
    { amount: 75_000, bankId },
    new Date(),
    customRules
  );
  assert.ok(tooLow.error?.includes('Minimal penarikan untuk VIP 1'));

  const tooHigh = submitMemberWithdrawal(
    richMemberState,
    { amount: 450_000, bankId },
    new Date(),
    customRules
  );
  assert.ok(tooHigh.error?.includes('Maksimal penarikan untuk VIP 1'));

  const okVip1 = submitMemberWithdrawal(
    richMemberState,
    { amount: 250_000, bankId },
    new Date(),
    customRules
  );
  assert.equal(okVip1.error, null);
  assert.equal(okVip1.state.member.withdrawableBalance, 4_750_000);

  const vip2State = {
    ...richMemberState,
    member: {
      ...richMemberState.member,
      totalInvestmentModal: 10_000_000,
      referrals: [
        ...richMemberState.member.referrals,
        { id: 'R3', userName: '#2401 A', joinedAt: '14 Nov 2026', commissionEarned: 50_000, status: 'aktif' as const },
        { id: 'R4', userName: '#2402 B', joinedAt: '14 Nov 2026', commissionEarned: 50_000, status: 'aktif' as const },
        { id: 'R5', userName: '#2403 C', joinedAt: '14 Nov 2026', commissionEarned: 50_000, status: 'aktif' as const },
      ],
    },
  };
  assert.equal(getMemberCurrentLevel(vip2State.member, customRules), 2);
  const okVip2 = submitMemberWithdrawal(
    vip2State,
    { amount: 1_000_000, bankId },
    new Date(),
    customRules
  );
  assert.equal(okVip2.error, null);
  assert.equal(okVip2.state.member.withdrawableBalance, 4_000_000);
});

test('SMTP configuration validates inputs, masks PII logs, and supports OTP challenge verification', async () => {
  assert.ok(SMTP_PROVIDER_PRESETS.some((p) => p.id === 'gmail' && p.port === 587));
  assert.equal(maskEmailAddress('rizky.pratama@mail.id'), 'ri***@mail.id');

  const invalidEnabled = validateSmtpSavePayload(
    {
      enabled: true,
      preset: 'gmail',
      host: '',
      port: 587,
      encryption: 'starttls',
      username: 'ops@naturerepublic.id',
      password: '',
      fromName: 'Nature Republic',
      fromEmail: '',
      replyTo: '',
    },
    false
  );
  assert.equal(invalidEnabled.success, false);

  resetSmtpConfigurationToEnv();
  const initialStatus = getSmtpPublicStatus();
  assert.equal(initialStatus.configured, false);

  // Disabled config saves cleanly without requiring host/fromEmail yet
  const savedDisabled = saveSmtpConfiguration({
    enabled: false,
    preset: 'brevo',
    host: 'smtp-relay.brevo.com',
    port: 587,
    encryption: 'starttls',
    username: 'relay@naturerepublic.id',
    password: 'SecretAppPassword123',
    fromName: 'Nature Republic Investasi',
    fromEmail: 'noreply@naturerepublic.id',
    replyTo: 'cs@naturerepublic.id',
  });
  assert.equal(savedDisabled.ok, true);
  if (savedDisabled.ok) {
    assert.equal(savedDisabled.status.hasPassword, true);
    assert.equal('password' in savedDisabled.status, false);
  }

  // Send OTP in simulation mode when enabled=false, then verify once
  const otpMail = await sendAuthOtpEmail({
    purpose: 'register_otp',
    email: 'bunga.citra@contoh.id',
    recipientName: 'Bunga Citra',
    roleLabel: 'Member',
  });
  assert.equal(otpMail.ok, true);
  assert.equal(otpMail.mode, 'simulation');
  assert.ok(otpMail.previewCode && /^\d{6}$/.test(otpMail.previewCode));

  const logs = getSmtpEmailLogs();
  assert.ok(logs.some((l) => l.maskedRecipient === 'bu***@contoh.id' && l.status === 'simulasi'));

  const badVerify = verifyAuthOtpChallenge({
    purpose: 'register_otp',
    email: 'bunga.citra@contoh.id',
    code: '000000',
  });
  assert.equal(badVerify.ok, false);

  const okVerify = verifyAuthOtpChallenge({
    purpose: 'register_otp',
    email: 'bunga.citra@contoh.id',
    code: otpMail.previewCode!,
  });
  assert.equal(okVerify.ok, true);

  // Single-use OTP cannot be reused
  const reuseVerify = verifyAuthOtpChallenge({
    purpose: 'register_otp',
    email: 'bunga.citra@contoh.id',
    code: otpMail.previewCode!,
  });
  assert.equal(reuseVerify.ok, false);

  // Email template builder escapes HTML safely
  const tpl = buildAuthEmailContent({
    purpose: 'forgot_password',
    recipientName: '<script>alert(1)</script>',
    roleLabel: 'Admin',
    otpCode: '123456',
    fromName: 'Nature Republic',
  });
  assert.equal(tpl.html.includes('<script>'), false);
  assert.ok(tpl.html.includes('123456'));

  resetSmtpConfigurationToEnv();
});

test('Member registration, duplicate checks, custom password login, and Admin/Member password reset work accurately', () => {
  const initialState = createInitialMemberAppState('USR-8812', false);
  const passwordMap: Record<string, string> = {};

  // Duplicate email fails
  const dupEmailRes = registerMemberAccount(
    initialState,
    ADMIN_USER_RECORDS,
    {
      name: 'Duplikat Rizky',
      email: 'rizky.pratama@mail.id',
      phone: '081988887777',
      password: 'PasswordBaru123',
      confirmPassword: 'PasswordBaru123',
      referralCode: '',
    },
    passwordMap
  );
  assert.ok(dupEmailRes.error?.includes('sudah terdaftar'));

  // Successful registration creates verified member & logs them in
  const regRes = registerMemberAccount(
    initialState,
    ADMIN_USER_RECORDS,
    {
      name: 'Nadia Kusuma',
      email: 'nadia.kusuma@contoh.id',
      phone: '081977665544',
      password: 'NadiaSecret99',
      confirmPassword: 'NadiaSecret99',
      referralCode: 'NRVIP1041',
    },
    passwordMap
  );
  assert.equal(regRes.error, null);
  assert.ok(regRes.createdMember);
  assert.equal(regRes.createdMember.emailVerified, true);
  assert.equal(regRes.state.isLoggedIn, true);
  assert.equal(regRes.users.length, ADMIN_USER_RECORDS.length + 1);

  // New member can log in with their custom password, wrong password is rejected
  const wrongLogin = loginMemberByIdentifier(
    initialState,
    'nadia.kusuma@contoh.id',
    'member1234',
    regRes.users,
    passwordMap
  );
  assert.ok(wrongLogin.error);

  const validLogin = loginMemberByIdentifier(
    initialState,
    'nadia.kusuma@contoh.id',
    'NadiaSecret99',
    regRes.users,
    passwordMap
  );
  assert.equal(validLogin.error, null);
  assert.equal(validLogin.state.member.name, 'Nadia Kusuma');

  // Member forgot password reset updates password cleanly
  const resetMember = resetMemberPassword(
    regRes.users,
    {
      email: 'nadia.kusuma@contoh.id',
      newPassword: 'ResetPassword77',
      confirmPassword: 'ResetPassword77',
    },
    passwordMap
  );
  assert.equal(resetMember.ok, true);

  const loginAfterReset = loginMemberByIdentifier(
    initialState,
    'nadia.kusuma@contoh.id',
    'ResetPassword77',
    regRes.users,
    passwordMap
  );
  assert.equal(loginAfterReset.error, null);

  // Admin forgot password reset rejects unknown email & updates matching admin account
  const adminAccount = createInitialAdminAccount();
  const wrongAdminReset = resetAdminPasswordByEmail(adminAccount, {
    email: 'bukan-admin@contoh.id',
    newPassword: 'AdminReset#2026',
    confirmPassword: 'AdminReset#2026',
  });
  assert.equal(wrongAdminReset.success, false);

  const okAdminReset = resetAdminPasswordByEmail(adminAccount, {
    email: adminAccount.session.email,
    newPassword: 'AdminReset#2026',
    confirmPassword: 'AdminReset#2026',
  });
  assert.equal(okAdminReset.success, true);
  if (okAdminReset.success) {
    assert.equal(
      verifyAdminLogin(okAdminReset.account, {
        email: adminAccount.session.email,
        password: 'AdminReset#2026',
      }).success,
      true
    );
  }
});

test('Unified login, 3-role RBAC, Admin visibility, and per-account Menu Server blocking work accurately', () => {
  const admins = createInitialAdminAccounts();
  let serverControl = createInitialServerControlSettings();

  // Strictly 1 Super Admin seeded
  const superAdmins = admins.filter((a) => a.role === 'Super Admin');
  assert.equal(superAdmins.length, 1);
  assert.equal(canAccessServerMenu('Super Admin'), true);
  assert.equal(canAccessServerMenu('Admin'), false);
  assert.equal(canAccessServerMenu('Member'), false);

  // Regular Admin cannot see Super Admin anywhere
  const visibleToRegularAdmin = getVisibleAdminAccountsForViewer(admins, 'Admin');
  assert.equal(visibleToRegularAdmin.some((a) => a.role === 'Super Admin'), false);
  assert.equal(visibleToRegularAdmin.length, 2);

  // Super Admin sees all admin accounts
  const visibleToSuperAdmin = getVisibleAdminAccountsForViewer(admins, 'Super Admin');
  assert.equal(visibleToSuperAdmin.length, 3);

  // Regular Admin cannot create Admin when allowAdminCreateAdmin=false
  const deniedAdminCreate = createRegularAdminAccount({
    accounts: admins,
    actorRole: 'Admin',
    serverControl,
    input: {
      name: 'Admin Baru',
      email: 'admin.baru@naturerepublic.example',
      password: 'AdminPassword123',
      confirmPassword: 'AdminPassword123',
    },
  });
  assert.ok(deniedAdminCreate.error);
  assert.equal(deniedAdminCreate.created, null);

  // Cannot create second Super Admin even by Super Admin
  const deniedSecondSuper = createRegularAdminAccount({
    accounts: admins,
    actorRole: 'Super Admin',
    serverControl,
    requestedRole: 'Super Admin',
    input: {
      name: 'Super Kedua',
      email: 'super2@naturerepublic.example',
      password: 'AdminPassword123',
      confirmPassword: 'AdminPassword123',
    },
  });
  assert.ok(deniedSecondSuper.error);

  // Super Admin enables allowAdminCreateAdmin -> Admin can now create regular Admin only
  const toggledPermission = toggleAllowAdminCreateAdmin({
    settings: serverControl,
    actorRole: 'Super Admin',
  });
  assert.equal(toggledPermission.error, null);
  serverControl = toggledPermission.settings;
  assert.equal(canViewerCreateAdmin('Admin', serverControl), true);

  const allowedAdminCreate = createRegularAdminAccount({
    accounts: admins,
    actorRole: 'Admin',
    serverControl,
    input: {
      name: 'Nadia Operasional',
      email: 'nadia.ops@naturerepublic.example',
      password: 'AdminPassword123',
      confirmPassword: 'AdminPassword123',
    },
  });
  assert.equal(allowedAdminCreate.error, null);
  assert.equal(allowedAdminCreate.created?.role, 'Admin');
  const nextAdmins = allowedAdminCreate.accounts;

  // Regular Admin cannot block users/admins or toggle permissions in Menu Server
  const deniedBlock = toggleBlockedAdminAccount({
    settings: serverControl,
    accounts: nextAdmins,
    actorRole: 'Admin',
    targetAdminId: 'ADM-002',
  });
  assert.ok(deniedBlock.error);

  // Super Admin cannot be blocked
  const superSelfBlock = toggleBlockedAdminAccount({
    settings: serverControl,
    accounts: nextAdmins,
    actorRole: 'Super Admin',
    targetAdminId: 'ADM-001',
  });
  assert.ok(superSelfBlock.error);

  // Super Admin blocks specific Admin (ADM-002) and specific Member (USR-8812)
  const blockAdminRes = toggleBlockedAdminAccount({
    settings: serverControl,
    accounts: nextAdmins,
    actorRole: 'Super Admin',
    targetAdminId: 'ADM-002',
  });
  assert.equal(blockAdminRes.error, null);
  const blockMemberRes = toggleBlockedMemberAccount({
    settings: blockAdminRes.settings,
    members: ADMIN_USER_RECORDS,
    actorRole: 'Super Admin',
    targetMemberId: 'USR-8812',
  });
  assert.equal(blockMemberRes.error, null);
  serverControl = blockMemberRes.settings;

  // Blocked Admin sees server_blocked; unblocked Admin (ADM-003) and Super Admin log in normally
  const blockedAdminLogin = resolveUnifiedLogin({
    identifier: 'admin.keuangan@naturerepublic.example',
    password: DEMO_REGULAR_ADMIN_PASSWORD,
    adminAccounts: nextAdmins,
    members: ADMIN_USER_RECORDS,
    serverControl,
  });
  assert.equal(blockedAdminLogin.status, 'server_blocked');

  const unblockedAdminLogin = resolveUnifiedLogin({
    identifier: 'admin.ops@naturerepublic.example',
    password: DEMO_REGULAR_ADMIN_PASSWORD,
    adminAccounts: nextAdmins,
    members: ADMIN_USER_RECORDS,
    serverControl,
  });
  assert.equal(unblockedAdminLogin.status, 'admin_authenticated');
  if (unblockedAdminLogin.status === 'admin_authenticated') {
    assert.equal(unblockedAdminLogin.admin.role, 'Admin');
  }

  const superAdminLogin = resolveUnifiedLogin({
    identifier: 'alfaciro05@gmail.com',
    password: DEMO_ADMIN_PASSWORD,
    adminAccounts: nextAdmins,
    members: ADMIN_USER_RECORDS,
    serverControl,
  });
  assert.equal(superAdminLogin.status, 'admin_authenticated');
  if (superAdminLogin.status === 'admin_authenticated') {
    assert.equal(superAdminLogin.admin.role, 'Super Admin');
  }

  // Blocked Member sees server_blocked; unblocked Member (USR-8804) logs in normally
  const emptyPwMap: Record<string, string> = {};
  const blockedMemberLogin = resolveUnifiedLogin({
    identifier: 'rizky.pratama@mail.id',
    password: DEMO_MEMBER_DEFAULT_PASSWORD,
    adminAccounts: nextAdmins,
    members: ADMIN_USER_RECORDS,
    serverControl,
    customMemberPasswords: emptyPwMap,
  });
  assert.equal(blockedMemberLogin.status, 'server_blocked');

  const unblockedMemberLogin = resolveUnifiedLogin({
    identifier: 'dewi.anggraini@mail.id',
    password: DEMO_MEMBER_DEFAULT_PASSWORD,
    adminAccounts: nextAdmins,
    members: ADMIN_USER_RECORDS,
    serverControl,
    customMemberPasswords: emptyPwMap,
  });
  assert.equal(unblockedMemberLogin.status, 'member_authenticated');

  // Super Admin cannot be deleted, regular Admin can be deleted by Super Admin
  const denyDeleteSuper = deleteAdminAccount({
    accounts: nextAdmins,
    serverControl,
    actorRole: 'Super Admin',
    actorAdminId: 'ADM-001',
    targetAdminId: 'ADM-001',
  });
  assert.ok(denyDeleteSuper.error);

  const okDeleteRegular = deleteAdminAccount({
    accounts: nextAdmins,
    serverControl,
    actorRole: 'Super Admin',
    actorAdminId: 'ADM-001',
    targetAdminId: 'ADM-002',
  });
  assert.equal(okDeleteRegular.error, null);
  assert.equal(okDeleteRegular.serverControl.blockedAdminIds.includes('ADM-002'), false);
});

test('E-Wallet options, vector logo resolution, Member E-Wallet add, and Manual E-Wallet settings work accurately', () => {
  assert.ok(INDONESIAN_EWALLET_OPTIONS.length >= 6);
  assert.equal(resolveIndonesianBankSlug('DANA'), 'dana');
  assert.equal(resolveIndonesianBankSlug('OVO'), 'ovo');
  assert.equal(resolveIndonesianBankSlug('GoPay'), 'gopay');
  assert.equal(resolveIndonesianBankSlug('Shopee Pay'), 'shopee-pay');
  assert.equal(resolveIndonesianBankSlug('LinkAja'), 'linkaja');
  assert.equal(resolveIndonesianBankSlug('Astra Pay'), 'astra-pay');

  // Member adds DANA e-wallet account
  const initialMemberState = createInitialMemberAppState('USR-8812', true);
  const addEwalletRes = addMemberBankAccount(initialMemberState, {
    accountType: 'ewallet',
    bankName: 'DANA',
    accountNumber: '0812-3456-7890',
    accountHolder: 'Rizky Pratama',
  });
  assert.equal(addEwalletRes.error, null);
  const addedWallet = addEwalletRes.state.member.banks[addEwalletRes.state.member.banks.length - 1];
  assert.equal(addedWallet.accountType, 'ewallet');
  assert.equal(addedWallet.bankName, 'DANA');
  assert.equal(addedWallet.accountNumber, '081234567890');

  // Admin adds manual E-Wallet destination
  const initialBankSettings = createInitialBankSettings();
  const manualEwalletRes = addManualBankAccount(initialBankSettings, {
    accountType: 'ewallet',
    bankName: 'OVO',
    accountNumber: '081398765432',
    accountHolder: 'Nature Republic Official',
    branchOrNote: 'Transfer instan E-Wallet',
    isActive: true,
  });
  assert.equal(manualEwalletRes.error, null);
  assert.equal(manualEwalletRes.state.manualBanks[0].accountType, 'ewallet');
  assert.equal(manualEwalletRes.state.manualBanks[0].bankName, 'OVO');
});

