'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  Award,
  BadgePercent,
  BellRing,
  Building2,
  ChevronDown,
  FileCheck2,
  FolderKanban,
  HandCoins,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Moon,
  PackageCheck,
  Server,
  ShieldCheck,
  Sun,
  Ticket,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { AccountSettingsModal } from '@/src/components/AccountSettingsModal';
import { AdminManagementView } from '@/src/components/AdminManagementView';
import { BankSettingsView } from '@/src/components/BankSettingsView';
import { CashbackView } from '@/src/components/CashbackView';
import { CategoryView } from '@/src/components/CategoryView';
import { CompanySettingsView } from '@/src/components/CompanySettingsView';
import { IklanView } from '@/src/components/IklanView';
import { InvestmentView } from '@/src/components/InvestmentView';
import { MemberAdPopupModal } from '@/src/components/MemberAdPopupModal';
import { AntreanView, DataUserView, ProdukView } from '@/src/components/OperationsViews';
import { PengumumanView } from '@/src/components/PengumumanView';
import { ProductCommissionView } from '@/src/components/ProductCommissionView';
import { RingkasanView, type AdminSection } from '@/src/components/RingkasanView';
import { ServerControlView } from '@/src/components/ServerControlView';
import { SmtpSettingsView } from '@/src/components/SmtpSettingsView';
import { UnifiedAuthScreen } from '@/src/components/UnifiedAuthScreen';
import { UserDetailView } from '@/src/components/UserDetailView';
import { UserLevelView } from '@/src/components/UserLevelView';
import { VouchersView } from '@/src/components/VouchersView';
import { WithdrawalPublicationView } from '@/src/components/WithdrawalPublicationView';
import {
  ADMIN_USER_RECORDS,
  INITIAL_QUEUE_TRANSACTIONS,
  addInvestmentProduct,
  deleteInvestmentProduct,
  getDashboardSnapshot,
  getServerProductsSnapshot,
  getServerUsersSnapshot,
  getStoredProductsSnapshot,
  getStoredUsersSnapshot,
  saveStoredProducts,
  saveStoredUsers,
  subscribeStoredProducts,
  subscribeStoredUsers,
  updateInvestmentProduct,
  updateQueueTransactionStatus,
} from '@/src/lib/dashboard-data';
import type {
  AdBannerRecord,
  AdminCreateInput,
  AdminInvestmentRecord,
  AdminInvestmentStatus,
  AdminPasswordChangeInput,
  AdminRoleAccount,
  AdminUserRecord,
  AnnouncementRecord,
  BankSettingsState,
  CashbackRule,
  CompanySettings,
  InvestmentProduct,
  MarqueeDurationSeconds,
  MemberRegisterInput,
  ProductCategory,
  QueueTransaction,
  TimeRange,
  UserLevelRule,
  VoucherRecord,
  WithdrawalPublication,
} from '@/src/lib/dashboard-schema';
import { getAdminInitials } from '@/src/lib/admin-auth';
import {
  createInitialMemberAppState,
  registerMemberAccount,
  resetMemberPassword,
} from '@/src/lib/member-app';
import {
  canAccessServerMenu,
  changeAdminAccountPasswordById,
  createRegularAdminAccount,
  deleteAdminAccount,
  getServerActiveSessionSnapshot,
  getServerAdminAccountsSnapshot,
  getServerServerControlSnapshot,
  getStoredActiveSessionSnapshot,
  getStoredAdminAccountsSnapshot,
  getStoredServerControlSnapshot,
  getVisibleAdminAccountsForViewer,
  resetAnyAdminPasswordByEmail,
  saveStoredActiveSession,
  saveStoredAdminAccounts,
  saveStoredServerControl,
  subscribeStoredActiveSession,
  subscribeStoredAdminAccounts,
  subscribeStoredServerControl,
  toAdminAccountState,
  toggleAdminAccountStatus,
  toggleAllowAdminCreateAdmin,
  toggleBlockedAdminAccount,
  toggleBlockedMemberAccount,
  updateAdminAccountAvatarById,
  updateMaintenanceModalCopy,
} from '@/src/lib/platform-auth';
import {
  addManualBankAccount,
  createInitialBankSettings,
  deleteManualBankAccount,
  toggleDokuGatewayEnabled,
  toggleManualBankAccountStatus,
  togglePaymentMethodEnabled,
  updateManualBankAccount,
  type ManualBankAccountInput,
} from '@/src/lib/bank-settings';
import {
  createEmptyCompanySettings,
  validateAndSaveCompanySettings,
  type SaveCompanySettingsInput,
} from '@/src/lib/company-settings';
import {
  INITIAL_CASHBACK_RULES,
  addCashbackRule,
  deleteCashbackRule,
  updateCashbackRule,
  type CashbackInputPayload,
} from '@/src/lib/cashbacks';
import {
  INITIAL_PRODUCT_CATEGORIES,
  addProductCategory,
  deleteProductCategory,
  updateProductCategory,
} from '@/src/lib/categories';
import {
  INITIAL_ADMIN_INVESTMENTS,
  changeInvestmentStatus,
} from '@/src/lib/investments';
import {
  INITIAL_WITHDRAWAL_PUBLICATIONS,
  clearWithdrawalProof,
  toggleWithdrawalPublication,
  updateWithdrawalProof,
  upsertWithdrawalPublicationFromQueueTx,
} from '@/src/lib/withdrawal-publications';
import { INITIAL_PRODUCT_COMMISSIONS } from '@/src/lib/product-commissions';
import {
  createAdminUser,
  toggleUserAccountStatus,
  type CreateAdminUserInput,
} from '@/src/lib/user-diagnostics';
import {
  getServerUserLevelsSnapshot,
  getStoredUserLevelsSnapshot,
  saveStoredUserLevels,
  subscribeStoredUserLevels,
  validateAndSaveUserLevels,
} from '@/src/lib/user-levels';
import {
  INITIAL_AD_BANNERS,
  addAdBanner,
  deleteAdBanner,
  getActiveMemberLoginAds,
  toggleAdBannerStatus,
  updateAdBanner,
  type AdBannerInput,
} from '@/src/lib/iklan';
import {
  DEFAULT_MARQUEE_DURATION_SECONDS,
  INITIAL_ANNOUNCEMENTS,
  addAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  updateAnnouncement,
  type AnnouncementInput,
} from '@/src/lib/announcements';
import {
  INITIAL_VOUCHERS,
  addVoucher,
  deleteVoucher,
  toggleVoucherStatus,
  type CreateVoucherInput,
} from '@/src/lib/vouchers';
import { cn, formatNumber } from '@/src/lib/utils';

interface NavItemConfig {
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroupConfig {
  id: string;
  label: string;
  items: ReadonlyArray<NavItemConfig>;
}

const BASE_NAV_GROUPS: ReadonlyArray<NavGroupConfig> = [
  {
    id: 'utama',
    label: 'Utama',
    items: [
      { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
    ],
  },
  {
    id: 'keuangan',
    label: 'Keuangan',
    items: [
      { id: 'antrean', label: 'Antrean Transaksi', icon: ArrowLeftRight },
      { id: 'withdrawal_publication', label: 'Publikasi Withdrawal', icon: FileCheck2 },
      { id: 'investment', label: 'Investment', icon: TrendingUp },
      { id: 'komisi_produk', label: 'Komisi Produk', icon: HandCoins },
    ],
  },
  {
    id: 'produk_promo',
    label: 'Produk & Promo',
    items: [
      { id: 'produk', label: 'Produk Investasi', icon: PackageCheck },
      { id: 'category', label: 'Category', icon: FolderKanban },
      { id: 'cashback', label: 'Cashback', icon: BadgePercent },
      { id: 'vouchers', label: 'Vouchers', icon: Ticket },
    ],
  },
  {
    id: 'konten',
    label: 'Konten',
    items: [
      { id: 'iklan', label: 'Iklan', icon: Megaphone },
      { id: 'pengumuman', label: 'Pengumuman', icon: BellRing },
    ],
  },
  {
    id: 'pengguna',
    label: 'Pengguna',
    items: [
      { id: 'user', label: 'Data User', icon: Users },
      { id: 'level_user', label: 'VIP User', icon: Award },
    ],
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    items: [
      { id: 'pengaturan_perusahaan', label: 'Pengaturan Perusahaan', icon: Building2 },
      { id: 'pengaturan_bank', label: 'Pengaturan Bank', icon: Landmark },
      { id: 'pengaturan_smtp', label: 'Pengaturan SMTP', icon: Mail },
    ],
  },
];

function buildNavGroupsForRole(
  role: string | undefined,
  allowAdminCreateAdmin: boolean
): ReadonlyArray<NavGroupConfig> {
  const groups = BASE_NAV_GROUPS.map((group) => {
    if (
      group.id === 'pengguna' &&
      role === 'Admin' &&
      allowAdminCreateAdmin
    ) {
      return {
        ...group,
        items: [
          ...group.items,
          { id: 'kelola_admin' as const, label: 'Kelola Admin', icon: ShieldCheck },
        ],
      };
    }
    return group;
  });

  if (role && canAccessServerMenu(role)) {
    groups.push({
      id: 'server',
      label: 'Server',
      items: [{ id: 'server_control', label: 'Menu Server', icon: Server }],
    });
  }

  return groups;
}

function findNavGroupId(
  groups: ReadonlyArray<NavGroupConfig>,
  section: AdminSection
): string | null {
  const found = groups.find((group) =>
    group.items.some((item) => item.id === section)
  )?.id;
  return found && found !== 'utama' ? found : null;
}

export default function App() {
  const router = useRouter();
  const adminAccounts = useSyncExternalStore(
    subscribeStoredAdminAccounts,
    getStoredAdminAccountsSnapshot,
    getServerAdminAccountsSnapshot
  );
  const serverControl = useSyncExternalStore(
    subscribeStoredServerControl,
    getStoredServerControlSnapshot,
    getServerServerControlSnapshot
  );
  const activeSession = useSyncExternalStore(
    subscribeStoredActiveSession,
    getStoredActiveSessionSnapshot,
    getServerActiveSessionSnapshot
  );
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() =>
    createEmptyCompanySettings()
  );
  const [bankSettings, setBankSettings] = useState<BankSettingsState>(() =>
    createInitialBankSettings()
  );
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');
  const [activeSection, setActiveSection] = useState<AdminSection>('ringkasan');
  const [openNavGroupId, setOpenNavGroupId] = useState<string | null>('keuangan');
  const [queueFilter, setQueueFilter] = useState<'semua' | 'topup' | 'withdrawal'>('semua');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [transactions, setTransactions] = useState<QueueTransaction[]>(
    INITIAL_QUEUE_TRANSACTIONS
  );
  const products = useSyncExternalStore(
    subscribeStoredProducts,
    getStoredProductsSnapshot,
    getServerProductsSnapshot
  );
  const [categories, setCategories] = useState<ProductCategory[]>(
    INITIAL_PRODUCT_CATEGORIES
  );
  const [cashbacks, setCashbacks] = useState<CashbackRule[]>(
    INITIAL_CASHBACK_RULES
  );
  const users = useSyncExternalStore(
    subscribeStoredUsers,
    getStoredUsersSnapshot,
    getServerUsersSnapshot
  );
  const [withdrawalPublications, setWithdrawalPublications] = useState<WithdrawalPublication[]>(
    INITIAL_WITHDRAWAL_PUBLICATIONS
  );
  const [investments, setInvestments] = useState<AdminInvestmentRecord[]>(
    INITIAL_ADMIN_INVESTMENTS
  );
  const userLevels = useSyncExternalStore(
    subscribeStoredUserLevels,
    getStoredUserLevelsSnapshot,
    getServerUserLevelsSnapshot
  );
  const [ads, setAds] = useState<AdBannerRecord[]>(() => [...INITIAL_AD_BANNERS]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>(() => [
    ...INITIAL_ANNOUNCEMENTS,
  ]);
  const [marqueeDurationSeconds, setMarqueeDurationSeconds] =
    useState<MarqueeDurationSeconds>(DEFAULT_MARQUEE_DURATION_SECONDS);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>(() => [
    ...INITIAL_VOUCHERS,
  ]);
  const [popupAds, setPopupAds] = useState<AdBannerRecord[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pendingDeltas, setPendingDeltas] = useState({
    topUpCount: 0,
    topUpAmount: 0,
    withdrawalCount: 0,
    withdrawalAmount: 0,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (activeSession.kind === 'member') {
      router.replace('/member');
    }
  }, [activeSession.kind, router]);

  const currentAdmin = useMemo(() => {
    if (activeSession.kind !== 'admin') return null;
    const found = adminAccounts.find((a) => a.id === activeSession.adminId) ?? null;
    if (!found || !found.isActive) return null;
    if (
      found.role !== 'Super Admin' &&
      serverControl.blockedAdminIds.includes(found.id)
    ) {
      return null;
    }
    return found;
  }, [activeSession, adminAccounts, serverControl.blockedAdminIds]);

  const visibleNavGroups = useMemo(
    () => buildNavGroupsForRole(currentAdmin?.role, serverControl.allowAdminCreateAdmin),
    [currentAdmin?.role, serverControl.allowAdminCreateAdmin]
  );

  const visibleNavItems = useMemo(
    () => visibleNavGroups.flatMap((group) => group.items),
    [visibleNavGroups]
  );

  const effectiveSection: AdminSection = useMemo(() => {
    if (activeSection === 'server_control' && !canAccessServerMenu(currentAdmin?.role ?? '')) {
      return 'ringkasan';
    }
    if (
      activeSection === 'kelola_admin' &&
      !(currentAdmin?.role === 'Admin' && serverControl.allowAdminCreateAdmin)
    ) {
      return 'ringkasan';
    }
    return activeSection;
  }, [activeSection, currentAdmin?.role, serverControl.allowAdminCreateAdmin]);

  const snapshot = useMemo(() => {
    const base = getDashboardSnapshot(selectedRange);
    return {
      ...base,
      operational: {
        ...base.operational,
        pendingTopUpCount: Math.max(
          0,
          base.operational.pendingTopUpCount + pendingDeltas.topUpCount
        ),
        pendingTopUpAmount: Math.max(
          0,
          base.operational.pendingTopUpAmount + pendingDeltas.topUpAmount
        ),
        pendingWithdrawalCount: Math.max(
          0,
          base.operational.pendingWithdrawalCount + pendingDeltas.withdrawalCount
        ),
        pendingWithdrawalAmount: Math.max(
          0,
          base.operational.pendingWithdrawalAmount + pendingDeltas.withdrawalAmount
        ),
      },
    };
  }, [selectedRange, pendingDeltas]);

  const totalPendingCount =
    snapshot.operational.pendingTopUpCount +
    snapshot.operational.pendingWithdrawalCount;

  const handleToggleNavGroup = (groupId: string) => {
    setOpenNavGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const handleNavigate = (section: AdminSection, subFilter?: string) => {
    if (section === 'server_control' && !canAccessServerMenu(currentAdmin?.role ?? '')) {
      return;
    }
    if (
      section === 'kelola_admin' &&
      !(currentAdmin?.role === 'Admin' && serverControl.allowAdminCreateAdmin)
    ) {
      return;
    }
    if (
      section === 'antrean' &&
      (subFilter === 'topup' || subFilter === 'withdrawal')
    ) {
      setQueueFilter(subFilter);
    } else if (section === 'antrean') {
      setQueueFilter('semua');
    }
    const targetGroupId = findNavGroupId(visibleNavGroups, section);
    if (targetGroupId) {
      setOpenNavGroupId(targetGroupId);
    }
    setActiveSection(section);
    setSelectedUserId(null);
    setMobileMenuOpen(false);
  };

  const handleProcessTransaction = (
    txId: string,
    action: 'disetujui' | 'ditolak'
  ) => {
    const result = updateQueueTransactionStatus(transactions, txId, action);
    setTransactions(result.transactions);
    setPendingDeltas((prev) => ({
      topUpCount: prev.topUpCount + result.deltaPendingTopUpCount,
      topUpAmount: prev.topUpAmount + result.deltaPendingTopUpAmount,
      withdrawalCount: prev.withdrawalCount + result.deltaPendingWithdrawalCount,
      withdrawalAmount: prev.withdrawalAmount + result.deltaPendingWithdrawalAmount,
    }));
  };

  const handleAddProduct = (created: InvestmentProduct) => {
    const next = addInvestmentProduct(products, created);
    saveStoredProducts(next);
  };

  const handleUpdateProduct = (updated: InvestmentProduct) => {
    const next = updateInvestmentProduct(products, updated);
    saveStoredProducts(next);
  };

  const handleDeleteProduct = (productId: string) => {
    const next = deleteInvestmentProduct(products, productId);
    saveStoredProducts(next);
  };

  const handleAddCategory = (input: {
    name: string;
    slug: string;
    description: string;
    status: 'aktif' | 'nonaktif';
  }): string | null => {
    const result = addProductCategory(categories, input);
    if (!result.error) {
      setCategories(result.categories);
    }
    return result.error;
  };

  const handleUpdateCategory = (input: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: 'aktif' | 'nonaktif';
  }): string | null => {
    const result = updateProductCategory(categories, input);
    if (!result.error) {
      setCategories(result.categories);
      if (
        result.previousName &&
        result.nextName &&
        result.previousName !== result.nextName
      ) {
        const prevNormalized = result.previousName.trim().toLowerCase();
        const nextName = result.nextName;
        const next = products.map((p) =>
          p.category.trim().toLowerCase() === prevNormalized
            ? { ...p, category: nextName }
            : p
        );
        saveStoredProducts(next);
      }
    }
    return result.error;
  };

  const handleDeleteCategory = (
    categoryId: string,
    replacementCategoryName: string
  ) => {
    const result = deleteProductCategory(categories, categoryId);
    setCategories(result.categories);
    if (result.deletedCategory) {
      const deletedNormalized = result.deletedCategory.name.trim().toLowerCase();
      const next = products.map((p) =>
        p.category.trim().toLowerCase() === deletedNormalized
          ? { ...p, category: replacementCategoryName }
          : p
      );
      saveStoredProducts(next);
    }
  };

  const handleAddCashback = (input: CashbackInputPayload): string | null => {
    const result = addCashbackRule(cashbacks, input);
    if (!result.error) {
      setCashbacks(result.rules);
    }
    return result.error;
  };

  const handleUpdateCashback = (
    input: CashbackInputPayload & { id: string }
  ): string | null => {
    const result = updateCashbackRule(cashbacks, input);
    if (!result.error) {
      setCashbacks(result.rules);
    }
    return result.error;
  };

  const handleDeleteCashback = (cashbackId: string) => {
    setCashbacks((prev) => deleteCashbackRule(prev, cashbackId));
  };

  const handleToggleUserStatus = (userId: string, reason?: string) => {
    saveStoredUsers(
      toggleUserAccountStatus(users, userId, {
        reason,
        actor: currentAdmin?.name ?? 'Admin',
      })
    );
  };

  const handleAddUser = (input: CreateAdminUserInput): string | null => {
    const result = createAdminUser(users, {
      ...input,
      actor: currentAdmin?.name ?? 'Admin',
    });
    if (!result.error) {
      saveStoredUsers(result.users);
    }
    return result.error;
  };

  const handleSaveUserLevels = (nextRules: UserLevelRule[]): string | null => {
    const result = validateAndSaveUserLevels(nextRules);
    if (!result.error) {
      saveStoredUserLevels(result.rules);
    }
    return result.error;
  };

  const handleUploadWithdrawalProof = (
    withdrawalId: string,
    proofUrl: string,
    proofFileName: string
  ) => {
    setWithdrawalPublications((prev) =>
      updateWithdrawalProof(prev, withdrawalId, { proofUrl, proofFileName })
    );
  };

  const handleClearWithdrawalProof = (withdrawalId: string) => {
    setWithdrawalPublications((prev) => clearWithdrawalProof(prev, withdrawalId));
  };

  const handleToggleWithdrawalPublication = (withdrawalId: string): string | null => {
    const result = toggleWithdrawalPublication(withdrawalPublications, withdrawalId);
    if (!result.error) {
      setWithdrawalPublications(result.records);
    }
    return result.error;
  };

  const handleChangeInvestmentStatus = (
    investmentId: string,
    nextStatus: Extract<AdminInvestmentStatus, 'Active' | 'Nonaktif'>,
    reason: string
  ): string | null => {
    const result = changeInvestmentStatus(investments, investmentId, {
      nextStatus,
      reason,
      actor: currentAdmin?.name ?? 'Admin',
    });
    if (!result.error) {
      setInvestments(result.records);
    }
    return result.error;
  };

  const handleApproveWithdrawalWithProof = (
    txId: string,
    payload: { proofUrl: string; proofFileName: string; publishImmediately: boolean }
  ) => {
    const targetTx = transactions.find((tx) => tx.id === txId);
    handleProcessTransaction(txId, 'disetujui');
    if (targetTx && targetTx.type === 'withdrawal') {
      setWithdrawalPublications((prev) =>
        upsertWithdrawalPublicationFromQueueTx(prev, targetTx, users, payload)
      );
    }
  };

  const handleResetQueue = () => {
    const queueIds = new Set(INITIAL_QUEUE_TRANSACTIONS.map((tx) => tx.id));
    setTransactions(INITIAL_QUEUE_TRANSACTIONS);
    setWithdrawalPublications((prev) => prev.filter((item) => !queueIds.has(item.id)));
    setPendingDeltas({
      topUpCount: 0,
      topUpAmount: 0,
      withdrawalCount: 0,
      withdrawalAmount: 0,
    });
  };

  const handleSaveCompanySettings = (input: SaveCompanySettingsInput): string | null => {
    const result = validateAndSaveCompanySettings(input);
    if (result.error || !result.settings) {
      return result.error ?? 'Gagal menyimpan pengaturan perusahaan.';
    }
    setCompanySettings(result.settings);
    return null;
  };

  const handleResetCompanySettings = () => {
    setCompanySettings(createEmptyCompanySettings());
  };

  const handleAddManualBank = (input: ManualBankAccountInput): string | null => {
    const result = addManualBankAccount(bankSettings, input);
    if (!result.error) {
      setBankSettings(result.state);
    }
    return result.error;
  };

  const handleUpdateManualBank = (
    bankId: string,
    input: ManualBankAccountInput
  ): string | null => {
    const result = updateManualBankAccount(bankSettings, bankId, input);
    if (!result.error) {
      setBankSettings(result.state);
    }
    return result.error;
  };

  const handleToggleManualBankStatus = (bankId: string) => {
    setBankSettings((prev) => toggleManualBankAccountStatus(prev, bankId));
  };

  const handleDeleteManualBank = (bankId: string) => {
    setBankSettings((prev) => deleteManualBankAccount(prev, bankId));
  };

  const handleToggleDokuGateway = () => {
    setBankSettings((prev) => toggleDokuGatewayEnabled(prev));
  };

  const handleTogglePaymentMethod = (methodId: string) => {
    setBankSettings((prev) => togglePaymentMethodEnabled(prev, methodId));
  };

  const handleAddAd = (input: AdBannerInput): string | null => {
    const result = addAdBanner(ads, input);
    if (!result.error) {
      setAds(result.records);
    }
    return result.error;
  };

  const handleUpdateAd = (adId: string, input: AdBannerInput): string | null => {
    const result = updateAdBanner(ads, adId, input);
    if (!result.error) {
      setAds(result.records);
    }
    return result.error;
  };

  const handleToggleAdStatus = (adId: string) => {
    setAds((prev) => toggleAdBannerStatus(prev, adId));
  };

  const handleDeleteAd = (adId: string) => {
    setAds((prev) => deleteAdBanner(prev, adId));
  };

  const handlePreviewAdPopup = (targetAds: AdBannerRecord[]) => {
    if (targetAds.length === 0) return;
    setPopupAds(targetAds);
    setPopupOpen(true);
  };

  const handleAddAnnouncement = (input: AnnouncementInput): string | null => {
    const result = addAnnouncement(announcements, input);
    if (!result.error) {
      setAnnouncements(result.records);
    }
    return result.error;
  };

  const handleUpdateAnnouncement = (
    announcementId: string,
    input: AnnouncementInput
  ): string | null => {
    const result = updateAnnouncement(announcements, announcementId, input);
    if (!result.error) {
      setAnnouncements(result.records);
    }
    return result.error;
  };

  const handleToggleAnnouncementStatus = (announcementId: string) => {
    setAnnouncements((prev) => toggleAnnouncementStatus(prev, announcementId));
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => deleteAnnouncement(prev, announcementId));
  };

  const handleCreateVoucher = (input: CreateVoucherInput): string | null => {
    const result = addVoucher(vouchers, input);
    if (!result.error) {
      setVouchers(result.records);
    }
    return result.error;
  };

  const handleToggleVoucherStatus = (voucherId: string): string | null => {
    const result = toggleVoucherStatus(vouchers, voucherId);
    if (!result.error) {
      setVouchers(result.records);
    }
    return result.error;
  };

  const handleDeleteVoucher = (voucherId: string) => {
    setVouchers((prev) => deleteVoucher(prev, voucherId));
  };

  const handleChangePassword = (input: AdminPasswordChangeInput): string | null => {
    if (!currentAdmin) return 'Sesi admin tidak valid.';
    const result = changeAdminAccountPasswordById(adminAccounts, currentAdmin.id, input);
    if (result.error) {
      return result.error;
    }
    saveStoredAdminAccounts(result.accounts);
    return null;
  };

  const handleUpdateAvatar = (avatarUrl: string | null) => {
    if (!currentAdmin) return;
    saveStoredAdminAccounts(
      updateAdminAccountAvatarById(adminAccounts, currentAdmin.id, avatarUrl)
    );
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setAccountModalOpen(false);
    setMobileMenuOpen(false);
    setPopupOpen(false);
    saveStoredActiveSession({ kind: 'logged_out' });
  };

  const handleAuthenticatedAdmin = (admin: AdminRoleAccount) => {
    saveStoredActiveSession({ kind: 'admin', adminId: admin.id });
    setActiveSection('ringkasan');
    setOpenNavGroupId('keuangan');
    setSelectedUserId(null);
    const activeLoginAds = getActiveMemberLoginAds(ads);
    if (activeLoginAds.length > 0) {
      setPopupAds(activeLoginAds);
      setPopupOpen(true);
    }
  };

  const handleAuthenticatedMember = (member: AdminUserRecord) => {
    saveStoredActiveSession({ kind: 'member', memberId: member.id });
    router.push('/member');
  };

  const handleRegisterMember = (input: MemberRegisterInput) => {
    const emptyState = createInitialMemberAppState('USR-8812', false);
    const res = registerMemberAccount(emptyState, users, input);
    if (res.error || !res.createdMember) {
      return { error: res.error ?? 'Gagal mendaftarkan akun member baru.' };
    }
    saveStoredUsers(res.users);
    saveStoredActiveSession({ kind: 'member', memberId: res.createdMember.id });
    router.push('/member');
    return { error: null };
  };

  const handleResetMemberPassword = (
    email: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const res = resetMemberPassword(users, {
      email,
      newPassword,
      confirmPassword,
    });
    if (!res.ok) {
      return { error: res.error };
    }
    return { error: null };
  };

  const handleResetAdminPassword = (
    email: string,
    newPassword: string,
    confirmPassword: string
  ): string | null => {
    const result = resetAnyAdminPasswordByEmail(adminAccounts, {
      email,
      newPassword,
      confirmPassword,
    });
    if (result.error) {
      return result.error;
    }
    saveStoredAdminAccounts(result.accounts);
    return null;
  };

  const handleToggleBlockedAdmin = (targetAdminId: string): string | null => {
    if (!currentAdmin) return 'Sesi admin tidak valid.';
    const res = toggleBlockedAdminAccount({
      settings: serverControl,
      accounts: adminAccounts,
      actorRole: currentAdmin.role,
      targetAdminId,
    });
    if (!res.error) {
      saveStoredServerControl(res.settings);
    }
    return res.error;
  };

  const handleToggleBlockedMember = (targetMemberId: string): string | null => {
    if (!currentAdmin) return 'Sesi admin tidak valid.';
    const res = toggleBlockedMemberAccount({
      settings: serverControl,
      members: users,
      actorRole: currentAdmin.role,
      targetMemberId,
    });
    if (!res.error) {
      saveStoredServerControl(res.settings);
    }
    return res.error;
  };

  const handleToggleAllowAdminCreateAdmin = (): string | null => {
    if (!currentAdmin) return 'Sesi admin tidak valid.';
    const res = toggleAllowAdminCreateAdmin({
      settings: serverControl,
      actorRole: currentAdmin.role,
    });
    if (!res.error) {
      saveStoredServerControl(res.settings);
    }
    return res.error;
  };

  const handleSaveMaintenanceCopy = (payload: {
    title: string;
    message: string;
    eta: string;
  }): string | null => {
    if (!currentAdmin) return 'Sesi admin tidak valid.';
    const res = updateMaintenanceModalCopy({
      settings: serverControl,
      actorRole: currentAdmin.role,
      title: payload.title,
      message: payload.message,
      eta: payload.eta,
    });
    if (!res.error) {
      saveStoredServerControl(res.settings);
    }
    return res.error;
  };

  const handleCreateRegularAdmin = (input: AdminCreateInput): string | null => {
    if (!currentAdmin) return 'Sesi admin tidak valid.';
    const res = createRegularAdminAccount({
      accounts: adminAccounts,
      actorRole: currentAdmin.role,
      serverControl,
      input,
      existingMembers: users,
    });
    if (!res.error) {
      saveStoredAdminAccounts(res.accounts);
    }
    return res.error;
  };

  const handleToggleRegularAdminStatus = (targetAdminId: string): string | null => {
    if (!currentAdmin) return 'Sesi admin tidak valid.';
    const res = toggleAdminAccountStatus({
      accounts: adminAccounts,
      actorRole: currentAdmin.role,
      serverControl,
      targetAdminId,
    });
    if (!res.error) {
      saveStoredAdminAccounts(res.accounts);
    }
    return res.error;
  };

  const handleDeleteRegularAdmin = (targetAdminId: string): string | null => {
    if (!currentAdmin) return 'Sesi admin tidak valid.';
    const res = deleteAdminAccount({
      accounts: adminAccounts,
      serverControl,
      actorRole: currentAdmin.role,
      actorAdminId: currentAdmin.id,
      targetAdminId,
    });
    if (!res.error) {
      saveStoredAdminAccounts(res.accounts);
      saveStoredServerControl(res.serverControl);
    }
    return res.error;
  };

  if (!currentAdmin) {
    return (
      <UnifiedAuthScreen
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        adminAccounts={adminAccounts}
        members={users}
        serverControl={serverControl}
        onAuthenticatedAdmin={handleAuthenticatedAdmin}
        onAuthenticatedMember={handleAuthenticatedMember}
        onRegisterMember={handleRegisterMember}
        onResetMemberPassword={handleResetMemberPassword}
        onResetAdminPassword={handleResetAdminPassword}
      />
    );
  }

  const activeNavLabel =
    visibleNavItems.find((item) => item.id === effectiveSection)?.label ?? 'Ringkasan';
  const selectedUser =
    effectiveSection === 'user' && selectedUserId
      ? (users.find((u) => u.id === selectedUserId) ?? null)
      : null;
  const adminAccountState = toAdminAccountState(currentAdmin);
  const adminInitials = getAdminInitials(currentAdmin.name);
  const visibleAdminsForViewer = getVisibleAdminAccountsForViewer(
    adminAccounts,
    currentAdmin.role
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navigasi Admin"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('ringkasan');
            }}
            className="flex items-center gap-2.5 min-w-0"
          >
            <img
              src="/assets/brand/nature-republic-logo.png"
              alt="Logo Nature Republic"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-sm font-bold tracking-normal text-purple-950 dark:text-amber-300">
                Nature Republic
              </p>
              <p className="truncate text-[11px] font-medium text-purple-700 dark:text-purple-300">
                Admin Investasi
              </p>
            </div>
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Tutup menu navigasi"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 lg:space-y-2" aria-label="Menu Utama">
          {visibleNavGroups.map((group) => {
            const isCollapsibleOnDesktop = group.id !== 'utama';
            const isOpen = !isCollapsibleOnDesktop || openNavGroupId === group.id;
            const hasActiveItem = group.items.some((item) => item.id === effectiveSection);
            return (
              <div
                key={group.id}
                role="group"
                aria-label={group.label}
                className="space-y-1"
              >
                <p
                  className={cn(
                    'px-3 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400',
                    isCollapsibleOnDesktop && 'lg:hidden'
                  )}
                >
                  {group.label}
                </p>

                {isCollapsibleOnDesktop && (
                  <button
                    id={`nav-group-${group.id}`}
                    type="button"
                    onClick={() => handleToggleNavGroup(group.id)}
                    aria-expanded={isOpen}
                    aria-controls={`nav-group-panel-${group.id}`}
                    className={cn(
                      'hidden min-h-[38px] w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold tracking-wide transition-colors cursor-pointer lg:flex',
                      isOpen
                        ? 'bg-purple-50 text-purple-950 dark:bg-purple-950/60 dark:text-amber-300'
                        : hasActiveItem
                          ? 'text-purple-700 hover:bg-purple-50/70 dark:text-purple-400 dark:hover:bg-slate-800/60'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span>{group.label}</span>
                      {!isOpen && hasActiveItem && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-purple-600 dark:bg-amber-400"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200',
                        isOpen ? 'rotate-0' : '-rotate-90'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                )}

                <div
                  id={`nav-group-panel-${group.id}`}
                  className={cn(
                    'space-y-1',
                    isCollapsibleOnDesktop && (isOpen ? 'lg:pl-1 lg:pt-0.5' : 'lg:hidden')
                  )}
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = effectiveSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
                          isActive
                            ? 'bg-purple-800 text-white dark:bg-purple-600 dark:text-white'
                            : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                        )}
                      >
                        <span className="inline-flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </span>
                        {item.id === 'antrean' && (
                          <span
                            className={cn(
                              'font-mono-num text-xs',
                              isActive
                                ? 'text-amber-300 font-semibold'
                                : 'text-amber-700 dark:text-amber-400 font-semibold'
                            )}
                          >
                            {formatNumber(totalPendingCount)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        <header
          id="top"
          className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 lg:px-8"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden cursor-pointer shrink-0"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Dashboard Admin
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
                /
              </span>
              <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {activeNavLabel}
              </span>
              {selectedUser && (
                <>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                    /
                  </span>
                  <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                    Detail User
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                aria-label="Menu profil admin"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-purple-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                {currentAdmin.avatarUrl ? (
                  <img
                    src={currentAdmin.avatarUrl}
                    alt={`Foto profil ${currentAdmin.name}`}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                  />
                ) : (
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-800 text-xs font-semibold text-white dark:bg-purple-600"
                    aria-hidden="true"
                  >
                    {adminInitials}
                  </span>
                )}
                <span className="hidden sm:inline max-w-[140px] truncate">
                  {currentAdmin.name}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-500 transition-transform duration-150 dark:text-slate-400',
                    profileMenuOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Opsi akun admin"
                  className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-40"
                >
                  <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-800">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {currentAdmin.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {currentAdmin.role} · {currentAdmin.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setAccountModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <span>Pengaturan Akun &amp; Password</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleNavigate('pengaturan_perusahaan');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <span>Pengaturan Perusahaan</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleNavigate('pengaturan_bank');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Landmark className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <span>Pengaturan Bank</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleNavigate('pengaturan_smtp');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <span>Pengaturan SMTP</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-200 pt-1 dark:border-slate-800">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {effectiveSection === 'ringkasan' && (
            <RingkasanView
              snapshot={snapshot}
              selectedRange={selectedRange}
              onSelectRange={setSelectedRange}
              onNavigateSection={handleNavigate}
            />
          )}

          {effectiveSection === 'antrean' && (
            <AntreanView
              key={queueFilter}
              transactions={transactions}
              operational={snapshot.operational}
              initialTypeFilter={queueFilter}
              onProcessTransaction={handleProcessTransaction}
              onApproveWithdrawalWithProof={handleApproveWithdrawalWithProof}
              onOpenWithdrawalPublication={() => handleNavigate('withdrawal_publication')}
              onResetQueue={handleResetQueue}
            />
          )}

          {effectiveSection === 'withdrawal_publication' && (
            <WithdrawalPublicationView
              records={withdrawalPublications}
              onUploadProof={handleUploadWithdrawalProof}
              onClearProof={handleClearWithdrawalProof}
              onTogglePublication={handleToggleWithdrawalPublication}
              onSelectUser={(userId) => {
                setActiveSection('user');
                setSelectedUserId(userId);
              }}
            />
          )}

          {effectiveSection === 'investment' && (
            <InvestmentView
              investments={investments}
              onChangeStatus={handleChangeInvestmentStatus}
              onSelectUser={(userId) => {
                setActiveSection('user');
                setSelectedUserId(userId);
              }}
            />
          )}

          {effectiveSection === 'produk' && (
            <ProdukView
              products={products}
              categories={categories}
              operational={snapshot.operational}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {effectiveSection === 'category' && (
            <CategoryView
              categories={categories}
              products={products}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {effectiveSection === 'cashback' && (
            <CashbackView
              cashbacks={cashbacks}
              products={products}
              onAddCashback={handleAddCashback}
              onUpdateCashback={handleUpdateCashback}
              onDeleteCashback={handleDeleteCashback}
            />
          )}

          {effectiveSection === 'vouchers' && (
            <VouchersView
              vouchers={vouchers}
              onCreateVoucher={handleCreateVoucher}
              onToggleVoucherStatus={handleToggleVoucherStatus}
              onDeleteVoucher={handleDeleteVoucher}
            />
          )}

          {effectiveSection === 'iklan' && (
            <IklanView
              ads={ads}
              onAddAd={handleAddAd}
              onUpdateAd={handleUpdateAd}
              onToggleAdStatus={handleToggleAdStatus}
              onDeleteAd={handleDeleteAd}
              onPreviewPopup={handlePreviewAdPopup}
            />
          )}

          {effectiveSection === 'pengumuman' && (
            <PengumumanView
              announcements={announcements}
              marqueeDurationSeconds={marqueeDurationSeconds}
              onChangeMarqueeDuration={setMarqueeDurationSeconds}
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onToggleAnnouncementStatus={handleToggleAnnouncementStatus}
              onDeleteAnnouncement={handleDeleteAnnouncement}
            />
          )}

          {effectiveSection === 'komisi_produk' && (
            <ProductCommissionView
              entries={INITIAL_PRODUCT_COMMISSIONS}
              products={products}
              onSelectUser={(userId) => {
                setActiveSection('user');
                setSelectedUserId(userId);
              }}
            />
          )}

          {effectiveSection === 'user' &&
            (selectedUser ? (
              <UserDetailView
                key={selectedUser.id}
                user={selectedUser}
                allUsers={users}
                productCommissions={INITIAL_PRODUCT_COMMISSIONS}
                products={products}
                onBack={() => setSelectedUserId(null)}
                onToggleAccountStatus={handleToggleUserStatus}
              />
            ) : (
              <DataUserView
                users={users}
                snapshot={{
                  ...snapshot,
                  totalUsers:
                    snapshot.totalUsers + Math.max(0, users.length - ADMIN_USER_RECORDS.length),
                  newUsers30d:
                    snapshot.newUsers30d + Math.max(0, users.length - ADMIN_USER_RECORDS.length),
                  activeBreakdown: {
                    ...snapshot.activeBreakdown,
                    notStartedCount:
                      snapshot.activeBreakdown.notStartedCount +
                      Math.max(0, users.length - ADMIN_USER_RECORDS.length),
                  },
                }}
                onSelectUser={setSelectedUserId}
                onAddUser={handleAddUser}
              />
            ))}

          {effectiveSection === 'level_user' && (
            <UserLevelView
              rules={userLevels}
              users={users}
              onSaveRules={handleSaveUserLevels}
            />
          )}

          {effectiveSection === 'kelola_admin' &&
            currentAdmin.role === 'Admin' &&
            serverControl.allowAdminCreateAdmin && (
              <AdminManagementView
                currentAdminId={currentAdmin.id}
                visibleAdmins={visibleAdminsForViewer}
                onCreateRegularAdmin={handleCreateRegularAdmin}
                onToggleAdminStatus={handleToggleRegularAdminStatus}
              />
            )}

          {effectiveSection === 'server_control' &&
            canAccessServerMenu(currentAdmin.role) && (
              <ServerControlView
                currentAdminId={currentAdmin.id}
                adminAccounts={adminAccounts}
                members={users}
                serverControl={serverControl}
                onToggleBlockedAdmin={handleToggleBlockedAdmin}
                onToggleBlockedMember={handleToggleBlockedMember}
                onToggleAllowAdminCreateAdmin={handleToggleAllowAdminCreateAdmin}
                onSaveMaintenanceCopy={handleSaveMaintenanceCopy}
                onCreateRegularAdmin={handleCreateRegularAdmin}
                onToggleAdminStatus={handleToggleRegularAdminStatus}
                onDeleteRegularAdmin={handleDeleteRegularAdmin}
              />
            )}

          {effectiveSection === 'pengaturan_perusahaan' && (
            <CompanySettingsView
              settings={companySettings}
              onSaveSettings={handleSaveCompanySettings}
              onResetSettings={handleResetCompanySettings}
            />
          )}

          {effectiveSection === 'pengaturan_bank' && (
            <BankSettingsView
              settings={bankSettings}
              onAddManualBank={handleAddManualBank}
              onUpdateManualBank={handleUpdateManualBank}
              onToggleManualBankStatus={handleToggleManualBankStatus}
              onDeleteManualBank={handleDeleteManualBank}
              onToggleDokuGateway={handleToggleDokuGateway}
              onTogglePaymentMethod={handleTogglePaymentMethod}
            />
          )}

          {effectiveSection === 'pengaturan_smtp' && <SmtpSettingsView />}
        </main>
      </div>

      <AccountSettingsModal
        open={accountModalOpen}
        account={adminAccountState}
        onClose={() => setAccountModalOpen(false)}
        onChangePassword={handleChangePassword}
        onUpdateAvatar={handleUpdateAvatar}
      />

      <MemberAdPopupModal
        open={popupOpen}
        ads={popupAds}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  );
}
