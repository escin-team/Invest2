'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  Briefcase,
  CheckCircle2,
  Home,
  LayoutGrid,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { MemberAdPopupModal } from '@/src/components/MemberAdPopupModal';
import {
  AddBankBottomSheet,
  AnnouncementDetailBottomSheet,
  BuyProductBottomSheet,
  TopUpBottomSheet,
  VoucherBottomSheet,
  WithdrawBottomSheet,
} from '@/src/components/member/MemberActionSheets';
import {
  AkunTab,
  AsetTab,
  BerandaTab,
  ProdukTab,
} from '@/src/components/member/MemberTabContent';
import { UnifiedAuthScreen } from '@/src/components/UnifiedAuthScreen';
import {
  DEFAULT_MARQUEE_DURATION_SECONDS,
  INITIAL_ANNOUNCEMENTS,
  getActiveMemberMarqueeAnnouncements,
} from '@/src/lib/announcements';
import { createInitialBankSettings } from '@/src/lib/bank-settings';
import { INITIAL_PRODUCT_CATEGORIES } from '@/src/lib/categories';
import {
  getServerProductsSnapshot,
  getServerUsersSnapshot,
  getStoredProductsSnapshot,
  getStoredUsersSnapshot,
  saveStoredUsers,
  subscribeStoredProducts,
  subscribeStoredUsers,
} from '@/src/lib/dashboard-data';
import type {
  AccountChannelType,
  AdminUserRecord,
  InvestmentProduct,
  MemberRegisterInput,
} from '@/src/lib/dashboard-schema';
import { INITIAL_AD_BANNERS, getActiveMemberLoginAds } from '@/src/lib/iklan';
import {
  addMemberBankAccount,
  claimMemberDailyInvestment,
  createInitialMemberAppState,
  createInitialMemberAppStateFromRecord,
  getMemberCurrentLevelEvaluation,
  purchaseMemberProduct,
  redeemMemberVoucher,
  registerMemberAccount,
  resetMemberPassword,
  submitMemberTopUp,
  submitMemberWithdrawal,
  type MemberTabId,
} from '@/src/lib/member-app';
import {
  getServerActiveSessionSnapshot,
  getServerAdminAccountsSnapshot,
  getServerServerControlSnapshot,
  getStoredActiveSessionSnapshot,
  getStoredAdminAccountsSnapshot,
  getStoredServerControlSnapshot,
  resetAnyAdminPasswordByEmail,
  saveStoredActiveSession,
  saveStoredAdminAccounts,
  subscribeStoredActiveSession,
  subscribeStoredAdminAccounts,
  subscribeStoredServerControl,
} from '@/src/lib/platform-auth';
import {
  getServerUserLevelsSnapshot,
  getStoredUserLevelsSnapshot,
  subscribeStoredUserLevels,
} from '@/src/lib/user-levels';
import { cn, formatRupiah } from '@/src/lib/utils';
import { INITIAL_WITHDRAWAL_PUBLICATIONS } from '@/src/lib/withdrawal-publications';

interface BottomNavTabConfig {
  id: MemberTabId;
  label: string;
  icon: typeof Home;
}

const MEMBER_NAV_TABS: ReadonlyArray<BottomNavTabConfig> = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'produk', label: 'Produk', icon: LayoutGrid },
  { id: 'aset', label: 'Aset', icon: Briefcase },
  { id: 'akun', label: 'Akun', icon: User },
];

interface MemberAuthenticatedShellProps {
  initialMember: AdminUserRecord;
  allUsers: ReadonlyArray<AdminUserRecord>;
  products: ReadonlyArray<InvestmentProduct>;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

function MemberAuthenticatedShell({
  initialMember,
  allUsers,
  products,
  darkMode,
  onToggleDarkMode,
  onLogout,
}: MemberAuthenticatedShellProps) {
  const [activeTab, setActiveTab] = useState<MemberTabId>('beranda');
  const [state, setState] = useState(() =>
    createInitialMemberAppStateFromRecord(initialMember, true)
  );
  const [bankSettings] = useState(() => createInitialBankSettings());
  const [adPopupOpen, setAdPopupOpen] = useState(() =>
    getActiveMemberLoginAds(INITIAL_AD_BANNERS).length > 0
  );

  // Android Bottom Sheet states
  const [topUpSheetOpen, setTopUpSheetOpen] = useState(false);
  const [withdrawSheetOpen, setWithdrawSheetOpen] = useState(false);
  const [voucherSheetOpen, setVoucherSheetOpen] = useState(false);
  const [addBankSheetOpen, setAddBankSheetOpen] = useState(false);
  const [announcementSheetOpen, setAnnouncementSheetOpen] = useState(false);
  const [selectedProductForBuy, setSelectedProductForBuy] =
    useState<InvestmentProduct | null>(null);

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const userLevels = useSyncExternalStore(
    subscribeStoredUserLevels,
    getStoredUserLevelsSnapshot,
    getServerUserLevelsSnapshot
  );
  const activeAnnouncements = useMemo(
    () => getActiveMemberMarqueeAnnouncements(INITIAL_ANNOUNCEMENTS),
    []
  );
  const vipEvaluation = useMemo(
    () => getMemberCurrentLevelEvaluation(state.member, userLevels),
    [state.member, userLevels]
  );
  const activeVipRule = vipEvaluation.currentRule;
  const memberLevel = activeVipRule.level;
  const activeLoginAds = useMemo(
    () => getActiveMemberLoginAds(INITIAL_AD_BANNERS),
    []
  );

  useEffect(() => {
    if (!snackbarMessage) return;
    const timer = window.setTimeout(() => setSnackbarMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [snackbarMessage]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
  };

  const syncUpdatedMemberToStore = (updatedMember: AdminUserRecord) => {
    saveStoredUsers(
      allUsers.map((u) => (u.id === updatedMember.id ? updatedMember : u))
    );
  };

  const handleClaimDaily = (investmentId: string) => {
    const res = claimMemberDailyInvestment(state, investmentId);
    if (res.error) {
      showSnackbar(res.error);
      return;
    }
    setState(res.state);
    syncUpdatedMemberToStore(res.state.member);
    showSnackbar(`Klaim berhasil! +${formatRupiah(res.claimedAmount)} masuk ke Saldo Tarik`);
  };

  const handleConfirmPurchase = (product: InvestmentProduct, units: number) => {
    const res = purchaseMemberProduct(state, product, units, new Date(), userLevels);
    if (res.error) {
      return { error: res.error };
    }
    setState(res.state);
    syncUpdatedMemberToStore(res.state.member);
    showSnackbar(`Investasi ${product.name} (${units} unit) aktif`);
    setActiveTab('aset');
    return { error: null };
  };

  const handleSubmitTopUp = (payload: {
    amount: number;
    channelLabel: string;
    isInstantGateway: boolean;
  }) => {
    const res = submitMemberTopUp(state, payload);
    if (res.error) {
      return { error: res.error };
    }
    setState(res.state);
    syncUpdatedMemberToStore(res.state.member);
    showSnackbar(
      payload.isInstantGateway
        ? `Top Up ${formatRupiah(payload.amount)} berhasil masuk ke Saldo Deposit`
        : `Permintaan Top Up ${formatRupiah(payload.amount)} menunggu verifikasi admin`
    );
    return { error: null };
  };

  const handleSubmitWithdrawal = (payload: { amount: number; bankId: string }) => {
    const res = submitMemberWithdrawal(state, payload, new Date(), userLevels);
    if (res.error) {
      return { error: res.error };
    }
    setState(res.state);
    syncUpdatedMemberToStore(res.state.member);
    showSnackbar(`Penarikan ${formatRupiah(payload.amount)} sedang diproses admin`);
    return { error: null };
  };

  const handleRedeemVoucher = (code: string) => {
    const res = redeemMemberVoucher(state, code);
    if (res.error) {
      return { claimedAmount: 0, error: res.error };
    }
    setState(res.state);
    syncUpdatedMemberToStore(res.state.member);
    showSnackbar(`Voucher berhasil! +${formatRupiah(res.claimedAmount)} ditambahkan`);
    return { claimedAmount: res.claimedAmount, error: null };
  };

  const handleAddBank = (payload: {
    accountType: AccountChannelType;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }) => {
    const res = addMemberBankAccount(state, payload);
    if (res.error) {
      return { error: res.error };
    }
    setState(res.state);
    syncUpdatedMemberToStore(res.state.member);
    showSnackbar(
      `${payload.accountType === 'ewallet' ? 'E-Wallet' : 'Rekening'} ${payload.bankName} berhasil disimpan`
    );
    return { error: null };
  };

  const activeTabTitle =
    MEMBER_NAV_TABS.find((t) => t.id === activeTab)?.label ?? 'Beranda';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop / Tablet Android Large-Screen Navigation Rail */}
      <aside
        aria-label="Navigasi Aplikasi Member"
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 pt-1">
            <img
              src="/assets/brand/nature-republic-logo.png"
              alt="Logo Nature Republic"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-purple-950 dark:text-amber-300">
                Nature Republic
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                #{state.member.userNumber} {state.member.name}
              </p>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Menu Utama Member">
            {MEMBER_NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 text-sm font-semibold transition-colors cursor-pointer',
                    isActive
                      ? 'bg-purple-700/12 text-purple-800 dark:bg-purple-500/20 dark:text-amber-300'
                      : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{darkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="md:pl-64">
        {/* Compact Android Top App Bar (56px / h-14 strictly) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/assets/brand/nature-republic-logo.png"
              alt="Logo Nature Republic"
              className="h-8 w-8 shrink-0 object-contain md:hidden"
            />
            <div className="min-w-0">
              <h1 className="truncate font-display text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
                <span className="md:hidden">Nature Republic · {activeTabTitle}</span>
                <span className="hidden md:inline">{activeTabTitle} Member</span>
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setAnnouncementSheetOpen(true)}
              aria-label="Buka pengumuman member"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <BellRing className="h-5 w-5" aria-hidden="true" />
              {activeAnnouncements.length > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500"
                />
              )}
            </button>
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden cursor-pointer"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-amber-500" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pt-4 pb-24 md:px-6 md:py-6">
          {activeTab === 'beranda' && (
            <BerandaTab
              state={state}
              announcements={INITIAL_ANNOUNCEMENTS}
              marqueeDuration={DEFAULT_MARQUEE_DURATION_SECONDS}
              products={products}
              memberLevel={memberLevel}
              activeVipRule={activeVipRule}
              vipEvaluation={vipEvaluation}
              onOpenTopUp={() => setTopUpSheetOpen(true)}
              onOpenWithdraw={() => setWithdrawSheetOpen(true)}
              onOpenVoucher={() => setVoucherSheetOpen(true)}
              onOpenAnnouncements={() => setAnnouncementSheetOpen(true)}
              onOpenAdPopup={() => setAdPopupOpen(true)}
              onClaimDaily={handleClaimDaily}
              onSelectProduct={(product) => setSelectedProductForBuy(product)}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'produk' && (
            <ProdukTab
              products={products}
              categories={INITIAL_PRODUCT_CATEGORIES}
              depositBalance={state.member.depositBalance}
              memberLevel={memberLevel}
              onSelectProduct={(product) => setSelectedProductForBuy(product)}
              onOpenTopUp={() => setTopUpSheetOpen(true)}
            />
          )}

          {activeTab === 'aset' && (
            <AsetTab
              investments={state.activeInvestments}
              transactions={state.transactions}
              publications={INITIAL_WITHDRAWAL_PUBLICATIONS}
              onClaimDaily={handleClaimDaily}
              onGoToProducts={() => setActiveTab('produk')}
            />
          )}

          {activeTab === 'akun' && (
            <AkunTab
              state={state}
              userLevels={userLevels}
              darkMode={darkMode}
              onToggleDarkMode={onToggleDarkMode}
              onOpenAddBank={() => setAddBankSheetOpen(true)}
              onLogout={() => {
                setAdPopupOpen(false);
                onLogout();
              }}
            />
          )}
        </main>
      </div>

      {/* Android Material 3 Bottom Navigation Bar (64px / h-16 strictly on Mobile) */}
      <nav
        aria-label="Navigasi Bawah Aplikasi Member"
        className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
      >
        {MEMBER_NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex h-full flex-col items-center justify-center gap-0.5 text-center active:scale-95 cursor-pointer"
            >
              <span
                className={cn(
                  'inline-flex h-7 w-14 items-center justify-center rounded-full transition-colors',
                  isActive
                    ? 'bg-purple-700/15 text-purple-700 dark:bg-purple-500/25 dark:text-amber-300'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold leading-tight',
                  isActive
                    ? 'text-purple-800 dark:text-amber-300'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Android Snackbar Notification */}
      {snackbarMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-md items-center gap-2.5 rounded-2xl bg-purple-950 px-4 py-3 text-xs font-medium text-white shadow-xl dark:border dark:border-purple-700/60 dark:bg-purple-900 md:bottom-6"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span className="flex-1">{snackbarMessage}</span>
        </div>
      )}

      {/* Auto Member Login Ad Popup (Closeable with X) */}
      <MemberAdPopupModal
        open={adPopupOpen}
        ads={activeLoginAds}
        onClose={() => setAdPopupOpen(false)}
      />

      {/* Interactive Android Bottom Sheets */}
      <TopUpBottomSheet
        open={topUpSheetOpen}
        paymentMethods={bankSettings.paymentMethods}
        onClose={() => setTopUpSheetOpen(false)}
        onSubmit={handleSubmitTopUp}
      />

      <WithdrawBottomSheet
        open={withdrawSheetOpen}
        withdrawableBalance={state.member.withdrawableBalance}
        vipRule={activeVipRule}
        banks={state.member.banks}
        onClose={() => setWithdrawSheetOpen(false)}
        onOpenAddBank={() => setAddBankSheetOpen(true)}
        onSubmit={handleSubmitWithdrawal}
      />

      <VoucherBottomSheet
        open={voucherSheetOpen}
        onClose={() => setVoucherSheetOpen(false)}
        onRedeem={handleRedeemVoucher}
      />

      <BuyProductBottomSheet
        product={selectedProductForBuy}
        depositBalance={state.member.depositBalance}
        memberLevel={memberLevel}
        onClose={() => setSelectedProductForBuy(null)}
        onOpenTopUp={() => setTopUpSheetOpen(true)}
        onOpenAccountLevel={() => setActiveTab('akun')}
        onConfirmPurchase={handleConfirmPurchase}
      />

      <AddBankBottomSheet
        open={addBankSheetOpen}
        defaultHolderName={state.member.name}
        onClose={() => setAddBankSheetOpen(false)}
        onSubmit={handleAddBank}
      />

      <AnnouncementDetailBottomSheet
        open={announcementSheetOpen}
        announcements={activeAnnouncements}
        onClose={() => setAnnouncementSheetOpen(false)}
      />
    </div>
  );
}

export function MemberAppView() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  const products = useSyncExternalStore(
    subscribeStoredProducts,
    getStoredProductsSnapshot,
    getServerProductsSnapshot
  );
  const users = useSyncExternalStore(
    subscribeStoredUsers,
    getStoredUsersSnapshot,
    getServerUsersSnapshot
  );
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

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return () => {
      root.classList.remove('dark');
    };
  }, [darkMode]);

  useEffect(() => {
    if (activeSession.kind === 'admin') {
      router.replace('/');
    }
  }, [activeSession.kind, router]);

  const activeMemberRecord = useMemo(() => {
    if (activeSession.kind !== 'member') return null;
    const found = users.find((u) => u.id === activeSession.memberId) ?? null;
    if (!found || found.accountStatus !== 'aktif') return null;
    if (serverControl.blockedMemberIds.includes(found.id)) return null;
    return found;
  }, [activeSession, serverControl.blockedMemberIds, users]);

  const handleRegisterMember = (input: MemberRegisterInput) => {
    const emptyState = createInitialMemberAppState('USR-8812', false);
    const res = registerMemberAccount(emptyState, users, input);
    if (res.error || !res.createdMember) {
      return { error: res.error ?? 'Gagal mendaftarkan akun member baru.' };
    }
    saveStoredUsers(res.users);
    saveStoredActiveSession({ kind: 'member', memberId: res.createdMember.id });
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
    const res = resetAnyAdminPasswordByEmail(adminAccounts, {
      email,
      newPassword,
      confirmPassword,
    });
    if (res.error) {
      return res.error;
    }
    saveStoredAdminAccounts(res.accounts);
    return null;
  };

  if (!activeMemberRecord) {
    return (
      <UnifiedAuthScreen
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        adminAccounts={adminAccounts}
        members={users}
        serverControl={serverControl}
        onAuthenticatedAdmin={(admin) => {
          saveStoredActiveSession({ kind: 'admin', adminId: admin.id });
          router.push('/');
        }}
        onAuthenticatedMember={(member) => {
          saveStoredActiveSession({ kind: 'member', memberId: member.id });
        }}
        onRegisterMember={handleRegisterMember}
        onResetMemberPassword={handleResetMemberPassword}
        onResetAdminPassword={handleResetAdminPassword}
      />
    );
  }

  return (
    <MemberAuthenticatedShell
      key={activeMemberRecord.id}
      initialMember={activeMemberRecord}
      allUsers={users}
      products={products}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      onLogout={() => saveStoredActiveSession({ kind: 'logged_out' })}
    />
  );
}
