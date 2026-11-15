import {
  UserLevelRuleSchema,
  type AdminUserRecord,
  type SalaryPeriod,
  type UserLevelCustomField,
  type UserLevelRule,
} from './dashboard-schema';

export interface VipTierAssetMeta {
  level: number;
  tierTitle: string;
  badgeImageUrl: string;
}

export const VIP_TIER_ASSETS: ReadonlyArray<VipTierAssetMeta> = [
  { level: 1, tierTitle: 'Bronze', badgeImageUrl: '/assets/vip/vip-1.png' },
  { level: 2, tierTitle: 'Silver', badgeImageUrl: '/assets/vip/vip-2.png' },
  { level: 3, tierTitle: 'Gold', badgeImageUrl: '/assets/vip/vip-3.png' },
  { level: 4, tierTitle: 'Platinum', badgeImageUrl: '/assets/vip/vip-4.png' },
  { level: 5, tierTitle: 'Emerald', badgeImageUrl: '/assets/vip/vip-5.png' },
  { level: 6, tierTitle: 'Sapphire', badgeImageUrl: '/assets/vip/vip-6.png' },
  { level: 7, tierTitle: 'Diamond', badgeImageUrl: '/assets/vip/vip-7.png' },
  { level: 8, tierTitle: 'Ruby', badgeImageUrl: '/assets/vip/vip-8.png' },
];

export function getVipBadgeImageSrc(level: number): string {
  const found = VIP_TIER_ASSETS.find((item) => item.level === level);
  return found?.badgeImageUrl ?? '/assets/vip/vip-1.png';
}

export function getVipTierTitle(level: number): string {
  const found = VIP_TIER_ASSETS.find((item) => item.level === level);
  return found?.tierTitle ?? `Tier ${level}`;
}

export const DEFAULT_USER_LEVEL_RULES: UserLevelRule[] = [
  {
    level: 1,
    label: 'VIP 1 (awal)',
    tierTitle: 'Bronze',
    badgeImageUrl: '/assets/vip/vip-1.png',
    isStarterLevel: true,
    minActiveReferrals: 0,
    minTotalPurchase: 0,
    extraRequirements: [],
    minWithdrawal: 50_000,
    maxWithdrawal: 500_000,
    salaryAmount: 0,
    salaryPeriod: 'hari',
    extraBenefits: [],
  },
  {
    level: 2,
    label: 'VIP 2',
    tierTitle: 'Silver',
    badgeImageUrl: '/assets/vip/vip-2.png',
    isStarterLevel: false,
    minActiveReferrals: 5,
    minTotalPurchase: 5_000_000,
    extraRequirements: [],
    minWithdrawal: 50_000,
    maxWithdrawal: 1_500_000,
    salaryAmount: 25_000,
    salaryPeriod: 'minggu',
    extraBenefits: [],
  },
  {
    level: 3,
    label: 'VIP 3',
    tierTitle: 'Gold',
    badgeImageUrl: '/assets/vip/vip-3.png',
    isStarterLevel: false,
    minActiveReferrals: 15,
    minTotalPurchase: 25_000_000,
    extraRequirements: [],
    minWithdrawal: 50_000,
    maxWithdrawal: 5_000_000,
    salaryAmount: 75_000,
    salaryPeriod: 'minggu',
    extraBenefits: [],
  },
  {
    level: 4,
    label: 'VIP 4',
    tierTitle: 'Platinum',
    badgeImageUrl: '/assets/vip/vip-4.png',
    isStarterLevel: false,
    minActiveReferrals: 50,
    minTotalPurchase: 50_000_000,
    extraRequirements: [],
    minWithdrawal: 50_000,
    maxWithdrawal: 15_000_000,
    salaryAmount: 200_000,
    salaryPeriod: 'minggu',
    extraBenefits: [],
  },
  {
    level: 5,
    label: 'VIP 5',
    tierTitle: 'Emerald',
    badgeImageUrl: '/assets/vip/vip-5.png',
    isStarterLevel: false,
    minActiveReferrals: 150,
    minTotalPurchase: 100_000_000,
    extraRequirements: [],
    minWithdrawal: 50_000,
    maxWithdrawal: 30_000_000,
    salaryAmount: 500_000,
    salaryPeriod: 'minggu',
    extraBenefits: [],
  },
  {
    level: 6,
    label: 'VIP 6',
    tierTitle: 'Sapphire',
    badgeImageUrl: '/assets/vip/vip-6.png',
    isStarterLevel: false,
    minActiveReferrals: 250,
    minTotalPurchase: 250_000_000,
    extraRequirements: [],
    minWithdrawal: 50_000,
    maxWithdrawal: 50_000_000,
    salaryAmount: 1_000_000,
    salaryPeriod: 'minggu',
    extraBenefits: [],
  },
  {
    level: 7,
    label: 'VIP 7',
    tierTitle: 'Diamond',
    badgeImageUrl: '/assets/vip/vip-7.png',
    isStarterLevel: false,
    minActiveReferrals: 500,
    minTotalPurchase: 700_000_000,
    extraRequirements: [],
    minWithdrawal: 50_000,
    maxWithdrawal: 100_000_000,
    salaryAmount: 2_500_000,
    salaryPeriod: 'minggu',
    extraBenefits: [],
  },
  {
    level: 8,
    label: 'VIP 8',
    tierTitle: 'Ruby',
    badgeImageUrl: '/assets/vip/vip-8.png',
    isStarterLevel: false,
    minActiveReferrals: 1000,
    minTotalPurchase: 5_000_000_000,
    extraRequirements: [],
    minWithdrawal: 50_000,
    maxWithdrawal: 250_000_000,
    salaryAmount: 5_000_000,
    salaryPeriod: 'minggu',
    extraBenefits: [],
  },
];

export const ALL_USER_LEVELS: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6, 7, 8];

export function normalizeAllowedLevels(levels: ReadonlyArray<number>): number[] {
  const unique = new Set<number>();
  for (const level of levels) {
    if (Number.isInteger(level) && level >= 1 && level <= 8) {
      unique.add(level);
    }
  }
  return Array.from(unique).sort((a, b) => a - b);
}

export function formatAllowedLevelsLabel(
  allowedLevels?: ReadonlyArray<number>
): string {
  const sorted = normalizeAllowedLevels(allowedLevels ?? ALL_USER_LEVELS);
  if (sorted.length === 0) {
    return 'Tidak Ada VIP';
  }
  if (sorted.length === ALL_USER_LEVELS.length) {
    return 'Semua VIP';
  }
  if (sorted.length === 1) {
    return `VIP ${sorted[0]}`;
  }
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const isContiguous = sorted.length === max - min + 1;
  if (isContiguous) {
    return `VIP ${min}–${max}`;
  }
  return `VIP ${sorted.join(', ')}`;
}

export function formatProductVipLevelBadge(
  allowedLevels?: ReadonlyArray<number>
): string {
  const sorted = normalizeAllowedLevels(allowedLevels ?? ALL_USER_LEVELS);
  if (sorted.length === 0) {
    return 'VIP -';
  }
  if (sorted.length === 1) {
    return `VIP ${sorted[0]}`;
  }
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const isContiguous = sorted.length === max - min + 1;
  if (isContiguous) {
    return `VIP ${min}–${max}`;
  }
  return `VIP ${sorted.join(', ')}`;
}

export function canUserLevelPurchaseProduct(
  userLevel: number,
  allowedLevels?: ReadonlyArray<number>
): boolean {
  const sorted = normalizeAllowedLevels(allowedLevels ?? ALL_USER_LEVELS);
  if (sorted.length === 0) return false;
  return sorted.includes(userLevel);
}

export function cloneUserLevelRules(
  rules: ReadonlyArray<UserLevelRule>
): UserLevelRule[] {
  return rules.map((rule) => ({
    ...rule,
    extraRequirements: rule.extraRequirements.map((item) => ({ ...item })),
    extraBenefits: rule.extraBenefits.map((item) => ({ ...item })),
  }));
}

export function cloneDefaultUserLevelRules(): UserLevelRule[] {
  return cloneUserLevelRules(DEFAULT_USER_LEVEL_RULES);
}

export function countUserActiveReferrals(
  user: Pick<AdminUserRecord, 'referrals'>
): number {
  return user.referrals.filter((ref) => ref.status === 'aktif').length;
}

export function formatSalaryPeriodLabel(period: SalaryPeriod): string {
  return period === 'minggu' ? 'Minggu' : 'Hari';
}

export function getVipRuleForLevel(
  level: number,
  rules: ReadonlyArray<UserLevelRule> = DEFAULT_USER_LEVEL_RULES
): UserLevelRule {
  return (
    rules.find((rule) => rule.level === level) ??
    rules[0] ??
    DEFAULT_USER_LEVEL_RULES[0]
  );
}

export interface UserLevelEvaluation {
  currentRule: UserLevelRule;
  nextRule: UserLevelRule | null;
  missingReferrals: number;
  missingPurchase: number;
  referralProgressPercent: number;
  purchaseProgressPercent: number;
  overallProgressPercent: number;
}

export function evaluateUserLevel(
  activeReferrals: number,
  totalPurchase: number,
  rules: ReadonlyArray<UserLevelRule>
): UserLevelEvaluation {
  const sorted = [...rules].sort((a, b) => a.level - b.level);
  const safeReferrals = Number.isFinite(activeReferrals) ? Math.max(0, activeReferrals) : 0;
  const safePurchase = Number.isFinite(totalPurchase) ? Math.max(0, totalPurchase) : 0;

  let currentRule = sorted[0] ?? DEFAULT_USER_LEVEL_RULES[0];
  for (const rule of sorted) {
    if (
      safeReferrals >= rule.minActiveReferrals &&
      safePurchase >= rule.minTotalPurchase
    ) {
      currentRule = rule;
    } else {
      break;
    }
  }

  const nextRule =
    sorted.find((rule) => rule.level === currentRule.level + 1) ?? null;

  if (!nextRule) {
    return {
      currentRule,
      nextRule: null,
      missingReferrals: 0,
      missingPurchase: 0,
      referralProgressPercent: 100,
      purchaseProgressPercent: 100,
      overallProgressPercent: 100,
    };
  }

  const referralRatio =
    nextRule.minActiveReferrals <= 0
      ? 1
      : Math.min(1, Math.max(0, safeReferrals / nextRule.minActiveReferrals));
  const purchaseRatio =
    nextRule.minTotalPurchase <= 0
      ? 1
      : Math.min(1, Math.max(0, safePurchase / nextRule.minTotalPurchase));
  const referralProgressPercent = Math.round(referralRatio * 100);
  const purchaseProgressPercent = Math.round(purchaseRatio * 100);
  const overallProgressPercent = Math.min(
    99,
    Math.round(((referralRatio + purchaseRatio) / 2) * 100)
  );

  return {
    currentRule,
    nextRule,
    missingReferrals: Math.max(
      0,
      nextRule.minActiveReferrals - Math.trunc(safeReferrals)
    ),
    missingPurchase: Math.max(
      0,
      Math.round(nextRule.minTotalPurchase - safePurchase)
    ),
    referralProgressPercent,
    purchaseProgressPercent,
    overallProgressPercent,
  };
}

function normalizeCustomFields(
  fields: ReadonlyArray<UserLevelCustomField>,
  levelLabel: string,
  sectionLabel: 'Syarat' | 'Benefit'
): { fields: UserLevelCustomField[]; error: string | null } {
  const cleaned: UserLevelCustomField[] = [];
  for (let idx = 0; idx < fields.length; idx += 1) {
    const field = fields[idx];
    const label = field.label.trim();
    const value = field.value.trim();
    if (!label || !value) {
      return {
        fields: [],
        error: `Kolom tambahan ${sectionLabel} #${idx + 1} pada ${levelLabel} wajib memiliki nama kolom dan nilai.`,
      };
    }
    cleaned.push({
      id: field.id.trim() || `col-${Date.now()}-${idx}`,
      label,
      value,
    });
  }
  return { fields: cleaned, error: null };
}

export function validateAndSaveUserLevels(
  draftRules: ReadonlyArray<UserLevelRule>
): {
  rules: UserLevelRule[];
  error: string | null;
} {
  if (draftRules.length !== 8) {
    return {
      rules: [],
      error: 'Pengaturan VIP harus terdiri dari tepat 8 tier (VIP 1 sampai VIP 8).',
    };
  }

  const sorted = [...draftRules].sort((a, b) => a.level - b.level);
  const validated: UserLevelRule[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const expectedLevel = i + 1;
    const item = sorted[i];
    const displayVip = `VIP ${expectedLevel}`;

    if (item.level !== expectedLevel) {
      return {
        rules: [],
        error: `Urutan VIP tidak valid. ${displayVip} harus tersedia.`,
      };
    }

    if (
      !Number.isFinite(item.minActiveReferrals) ||
      item.minActiveReferrals < 0 ||
      !Number.isInteger(item.minActiveReferrals)
    ) {
      return {
        rules: [],
        error: `Minimal Referal pada ${displayVip} harus berupa bilangan bulat 0 atau lebih.`,
      };
    }

    if (!Number.isFinite(item.minTotalPurchase) || item.minTotalPurchase < 0) {
      return {
        rules: [],
        error: `Minimal Deposit pada ${displayVip} tidak boleh bernilai negatif.`,
      };
    }

    if (!Number.isFinite(item.minWithdrawal) || item.minWithdrawal < 0) {
      return {
        rules: [],
        error: `Minimal Withdraw pada ${displayVip} tidak boleh bernilai negatif.`,
      };
    }

    if (!Number.isFinite(item.maxWithdrawal) || item.maxWithdrawal < 0) {
      return {
        rules: [],
        error: `Maksimal Withdraw pada ${displayVip} tidak boleh bernilai negatif.`,
      };
    }

    if (item.maxWithdrawal < item.minWithdrawal) {
      return {
        rules: [],
        error: `Maksimal Withdraw pada ${displayVip} tidak boleh lebih kecil dari Minimal Withdraw.`,
      };
    }

    if (!Number.isFinite(item.salaryAmount) || item.salaryAmount < 0) {
      return {
        rules: [],
        error: `Nominal Gaji pada ${displayVip} tidak boleh bernilai negatif.`,
      };
    }

    const reqFieldsResult = normalizeCustomFields(
      item.extraRequirements ?? [],
      displayVip,
      'Syarat'
    );
    if (reqFieldsResult.error) {
      return { rules: [], error: reqFieldsResult.error };
    }

    const benefitFieldsResult = normalizeCustomFields(
      item.extraBenefits ?? [],
      displayVip,
      'Benefit'
    );
    if (benefitFieldsResult.error) {
      return { rules: [], error: benefitFieldsResult.error };
    }

    const normalized: UserLevelRule = {
      level: expectedLevel,
      label: expectedLevel === 1 ? 'VIP 1 (awal)' : `VIP ${expectedLevel}`,
      tierTitle: getVipTierTitle(expectedLevel),
      badgeImageUrl: getVipBadgeImageSrc(expectedLevel),
      isStarterLevel: expectedLevel === 1,
      minActiveReferrals: Math.trunc(item.minActiveReferrals),
      minTotalPurchase: Math.round(item.minTotalPurchase),
      extraRequirements: reqFieldsResult.fields,
      minWithdrawal: Math.round(item.minWithdrawal),
      maxWithdrawal: Math.round(item.maxWithdrawal),
      salaryAmount: Math.round(item.salaryAmount),
      salaryPeriod: item.salaryPeriod === 'minggu' ? 'minggu' : 'hari',
      extraBenefits: benefitFieldsResult.fields,
    };

    const parsed = UserLevelRuleSchema.safeParse(normalized);
    if (!parsed.success) {
      return {
        rules: [],
        error: parsed.error.issues[0]?.message ?? `Data ${displayVip} tidak valid.`,
      };
    }

    if (i > 0) {
      const prev = validated[i - 1];
      if (parsed.data.minActiveReferrals < prev.minActiveReferrals) {
        return {
          rules: [],
          error: `Minimal Referal pada ${displayVip} tidak boleh lebih kecil dari VIP ${expectedLevel - 1}.`,
        };
      }
      if (parsed.data.minTotalPurchase < prev.minTotalPurchase) {
        return {
          rules: [],
          error: `Minimal Deposit pada ${displayVip} tidak boleh lebih kecil dari VIP ${expectedLevel - 1}.`,
        };
      }
    }

    validated.push(parsed.data);
  }

  return {
    rules: validated,
    error: null,
  };
}

export const USER_LEVELS_STORAGE_KEY = 'finvault_user_levels_v1';
const USER_LEVELS_UPDATED_EVENT = 'finvault:user-levels-updated';

let cachedRawUserLevelsJson: string | null = null;
let cachedUserLevelsSnapshot: UserLevelRule[] = DEFAULT_USER_LEVEL_RULES;

export function parseStoredUserLevels(raw: string | null): UserLevelRule[] | null {
  if (!raw) return null;
  try {
    const parsedJson: unknown = JSON.parse(raw);
    if (!Array.isArray(parsedJson) || parsedJson.length !== 8) {
      return null;
    }
    const validated: UserLevelRule[] = [];
    for (const item of parsedJson) {
      const res = UserLevelRuleSchema.safeParse(item);
      if (!res.success) return null;
      validated.push(res.data);
    }
    const check = validateAndSaveUserLevels(validated);
    if (check.error || check.rules.length !== 8) {
      return null;
    }
    return check.rules;
  } catch {
    return null;
  }
}

export function getStoredUserLevelsSnapshot(): UserLevelRule[] {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_LEVEL_RULES;
  }
  try {
    const raw = window.localStorage.getItem(USER_LEVELS_STORAGE_KEY);
    if (raw === cachedRawUserLevelsJson) {
      return cachedUserLevelsSnapshot;
    }
    const parsed = parseStoredUserLevels(raw);
    cachedRawUserLevelsJson = raw;
    cachedUserLevelsSnapshot = parsed ?? DEFAULT_USER_LEVEL_RULES;
    return cachedUserLevelsSnapshot;
  } catch {
    return DEFAULT_USER_LEVEL_RULES;
  }
}

export function getServerUserLevelsSnapshot(): UserLevelRule[] {
  return DEFAULT_USER_LEVEL_RULES;
}

export function subscribeStoredUserLevels(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === USER_LEVELS_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustom = () => {
    onStoreChange();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(USER_LEVELS_UPDATED_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(USER_LEVELS_UPDATED_EVENT, handleCustom);
  };
}

export function saveStoredUserLevels(rules: ReadonlyArray<UserLevelRule>): void {
  if (typeof window === 'undefined') return;
  try {
    const validated = rules.map((item) => UserLevelRuleSchema.parse(item));
    const json = JSON.stringify(validated);
    cachedRawUserLevelsJson = json;
    cachedUserLevelsSnapshot = validated;
    window.localStorage.setItem(USER_LEVELS_STORAGE_KEY, json);
    window.dispatchEvent(new Event(USER_LEVELS_UPDATED_EVENT));
  } catch {
    // Ignore storage quota or serialization errors
  }
}
