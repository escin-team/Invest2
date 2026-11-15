import {
  CashbackRuleSchema,
  type CashbackRule,
  type CashbackTargetType,
  type InvestmentProduct,
} from './dashboard-schema';

export type CashbackStatusFilter = 'semua' | 'aktif' | 'nonaktif';

export const INITIAL_CASHBACK_RULES: CashbackRule[] = [
  {
    id: 'CB-01',
    name: 'Investment Growth',
    targetType: 'produk_tertentu',
    targetProduct: 'V - 50',
    applicableLabel: 'Pembelian produk: V - 50',
    minTransaction: 17_600_000,
    cashbackAmount: 1_600_000,
    status: 'aktif',
    createdAt: '2026-11-10',
  },
  {
    id: 'CB-02',
    name: 'Reksa Surya Booster',
    targetType: 'produk_tertentu',
    targetProduct: 'Reksa Energi Surya Nusantara',
    applicableLabel: 'Pembelian produk: Reksa Energi Surya Nusantara',
    minTransaction: 5_000_000,
    cashbackAmount: 250_000,
    status: 'aktif',
    createdAt: '2026-11-05',
  },
  {
    id: 'CB-03',
    name: 'Cashback Top Up Perdana',
    targetType: 'top_up',
    targetProduct: '',
    applicableLabel: 'Top up saldo deposit',
    minTransaction: 1_000_000,
    cashbackAmount: 50_000,
    status: 'nonaktif',
    createdAt: '2026-10-20',
  },
];

export function formatCashbackApplicableLabel(
  targetType: CashbackTargetType,
  targetProduct: string
): string {
  const cleanProduct = targetProduct.trim();
  if (targetType === 'produk_tertentu') {
    return cleanProduct ? `Pembelian produk: ${cleanProduct}` : '';
  }
  if (targetType === 'semua_produk') {
    return 'Semua produk investasi';
  }
  return 'Top up saldo deposit';
}

export interface CashbackProductOption {
  value: string;
  label: string;
  productId: string | null;
  minCapital: number | null;
  imageUrl: string;
  status: 'aktif' | 'nonaktif' | null;
  isCustomLegacy: boolean;
}

export function getCashbackProductOptions(
  products: InvestmentProduct[],
  currentTargetProduct?: string
): CashbackProductOption[] {
  const options: CashbackProductOption[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    const cleanName = product.name.trim();
    if (!cleanName) continue;
    const normalized = cleanName.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    options.push({
      value: cleanName,
      label:
        product.status === 'nonaktif'
          ? `${product.id} · ${cleanName} (Nonaktif)`
          : `${product.id} · ${cleanName}`,
      productId: product.id,
      minCapital: product.minCapital,
      imageUrl: product.imageUrl,
      status: product.status,
      isCustomLegacy: false,
    });
  }

  const currentClean = (currentTargetProduct ?? '').trim();
  if (currentClean && !seen.has(currentClean.toLowerCase())) {
    options.unshift({
      value: currentClean,
      label: `${currentClean} (Produk tersimpan)`,
      productId: null,
      minCapital: null,
      imageUrl: '',
      status: null,
      isCustomLegacy: true,
    });
  }

  return options;
}

export function findProductForCashback(
  products: InvestmentProduct[],
  rule: Pick<CashbackRule, 'targetType' | 'targetProduct'>
): InvestmentProduct | null {
  if (rule.targetType !== 'produk_tertentu') return null;
  const target = rule.targetProduct.trim().toLowerCase();
  if (!target) return null;
  return (
    products.find((p) => p.name.trim().toLowerCase() === target) ?? null
  );
}

export function getNextCashbackId(rules: CashbackRule[]): string {
  let maxNum = 0;
  for (const rule of rules) {
    const match = /^CB-(\d+)$/i.exec(rule.id);
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `CB-${String(maxNum + 1).padStart(2, '0')}`;
}

export function getCashbackSummary(rules: CashbackRule[]): {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  maxCashbackAmount: number;
} {
  let activeCount = 0;
  let inactiveCount = 0;
  let maxCashbackAmount = 0;

  for (const rule of rules) {
    if (rule.status === 'aktif') {
      activeCount += 1;
      if (rule.cashbackAmount > maxCashbackAmount) {
        maxCashbackAmount = rule.cashbackAmount;
      }
    } else {
      inactiveCount += 1;
    }
  }

  return {
    totalCount: rules.length,
    activeCount,
    inactiveCount,
    maxCashbackAmount,
  };
}

export function filterCashbackRules(
  rules: CashbackRule[],
  options: { statusFilter: CashbackStatusFilter; query: string }
): CashbackRule[] {
  const { statusFilter, query } = options;
  const q = query.trim().toLowerCase();

  return rules.filter((rule) => {
    if (statusFilter !== 'semua' && rule.status !== statusFilter) {
      return false;
    }
    if (!q) return true;
    return (
      rule.id.toLowerCase().includes(q) ||
      rule.name.toLowerCase().includes(q) ||
      rule.applicableLabel.toLowerCase().includes(q) ||
      rule.targetProduct.toLowerCase().includes(q)
    );
  });
}

export interface CashbackInputPayload {
  name: string;
  targetType: CashbackTargetType;
  targetProduct: string;
  minTransaction: number;
  cashbackAmount: number;
  status: 'aktif' | 'nonaktif';
  createdAt?: string;
}

export function addCashbackRule(
  rules: CashbackRule[],
  input: CashbackInputPayload
): { rules: CashbackRule[]; error: string | null } {
  const name = input.name.trim();
  if (!name) {
    return { rules, error: 'Nama cashback wajib diisi.' };
  }

  const targetProduct =
    input.targetType === 'produk_tertentu' ? input.targetProduct.trim() : '';
  if (input.targetType === 'produk_tertentu' && !targetProduct) {
    return { rules, error: 'Nama atau kode produk wajib diisi.' };
  }

  if (!Number.isFinite(input.minTransaction) || input.minTransaction < 0) {
    return { rules, error: 'Minimum transaksi tidak boleh negatif.' };
  }

  if (!Number.isFinite(input.cashbackAmount) || input.cashbackAmount <= 0) {
    return { rules, error: 'Nominal cashback harus lebih dari 0.' };
  }

  const duplicate = rules.some(
    (r) => r.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    return { rules, error: `Program cashback "${name}" sudah ada.` };
  }

  const applicableLabel = formatCashbackApplicableLabel(
    input.targetType,
    targetProduct
  );

  const candidate = CashbackRuleSchema.safeParse({
    id: getNextCashbackId(rules),
    name,
    targetType: input.targetType,
    targetProduct,
    applicableLabel,
    minTransaction: Math.round(input.minTransaction),
    cashbackAmount: Math.round(input.cashbackAmount),
    status: input.status,
    createdAt: input.createdAt ?? new Date().toISOString().slice(0, 10),
  });

  if (!candidate.success) {
    return {
      rules,
      error: candidate.error.issues[0]?.message ?? 'Data cashback tidak valid.',
    };
  }

  return {
    rules: [candidate.data, ...rules],
    error: null,
  };
}

export function updateCashbackRule(
  rules: CashbackRule[],
  input: CashbackInputPayload & { id: string }
): { rules: CashbackRule[]; error: string | null } {
  const existing = rules.find((r) => r.id === input.id);
  if (!existing) {
    return { rules, error: `Program cashback ${input.id} tidak ditemukan.` };
  }

  const name = input.name.trim();
  if (!name) {
    return { rules, error: 'Nama cashback wajib diisi.' };
  }

  const targetProduct =
    input.targetType === 'produk_tertentu' ? input.targetProduct.trim() : '';
  if (input.targetType === 'produk_tertentu' && !targetProduct) {
    return { rules, error: 'Nama atau kode produk wajib diisi.' };
  }

  if (!Number.isFinite(input.minTransaction) || input.minTransaction < 0) {
    return { rules, error: 'Minimum transaksi tidak boleh negatif.' };
  }

  if (!Number.isFinite(input.cashbackAmount) || input.cashbackAmount <= 0) {
    return { rules, error: 'Nominal cashback harus lebih dari 0.' };
  }

  const duplicate = rules.some(
    (r) => r.id !== input.id && r.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    return { rules, error: `Program cashback "${name}" sudah digunakan.` };
  }

  const applicableLabel = formatCashbackApplicableLabel(
    input.targetType,
    targetProduct
  );

  const candidate = CashbackRuleSchema.safeParse({
    ...existing,
    name,
    targetType: input.targetType,
    targetProduct,
    applicableLabel,
    minTransaction: Math.round(input.minTransaction),
    cashbackAmount: Math.round(input.cashbackAmount),
    status: input.status,
  });

  if (!candidate.success) {
    return {
      rules,
      error: candidate.error.issues[0]?.message ?? 'Data cashback tidak valid.',
    };
  }

  return {
    rules: rules.map((r) => (r.id === input.id ? candidate.data : r)),
    error: null,
  };
}

export function deleteCashbackRule(
  rules: CashbackRule[],
  cashbackId: string
): CashbackRule[] {
  return rules.filter((r) => r.id !== cashbackId);
}
