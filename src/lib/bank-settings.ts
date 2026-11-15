import {
  BankSettingsStateSchema,
  ManualBankAccountSchema,
  type AccountChannelType,
  type BankSettingsState,
  type ManualBankAccount,
  type PaymentMethodConfig,
} from './dashboard-schema';

export type PaymentMethodFilter = 'semua' | 'doku' | 'manual';

export const INITIAL_PAYMENT_METHODS: ReadonlyArray<PaymentMethodConfig> = [
  {
    id: 'PM-01',
    code: 'BANK_TRANSFER_MANUAL',
    name: 'Transfer Bank Manual',
    category: 'bank_transfer_manual',
    provider: 'manual',
    description: 'Verifikasi manual oleh admin melalui rekening bank tujuan yang aktif.',
    feeLabel: 'Gratis (Verifikasi Manual)',
    enabled: true,
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'PM-02',
    code: 'QRIS',
    name: 'QRIS',
    category: 'qris',
    provider: 'doku',
    description: 'Pembayaran instan QRIS standar nasional melalui gateway DOKU.',
    feeLabel: 'MDR 0,7%',
    enabled: true,
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'PM-03',
    code: 'VIRTUAL_ACCOUNT_BCA',
    name: 'Virtual Account BCA',
    category: 'virtual_account',
    provider: 'doku',
    description: 'Nomor Virtual Account BCA otomatis dengan konfirmasi real-time DOKU.',
    feeLabel: 'Biaya tetap Rp 4.000',
    enabled: true,
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'PM-04',
    code: 'VIRTUAL_ACCOUNT_MANDIRI',
    name: 'Virtual Account Mandiri',
    category: 'virtual_account',
    provider: 'doku',
    description: 'Pembayaran otomatis via Mandiri Virtual Account (DOKU Checkout).',
    feeLabel: 'Biaya tetap Rp 4.000',
    enabled: true,
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'PM-05',
    code: 'VIRTUAL_ACCOUNT_BRI_BNI',
    name: 'Virtual Account BRI & BNI',
    category: 'virtual_account',
    provider: 'doku',
    description: 'Virtual Account BRI dan BNI terhubung langsung ke DOKU Checkout.',
    feeLabel: 'Biaya tetap Rp 4.000',
    enabled: false,
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'PM-06',
    code: 'EWALLET_DOKU',
    name: 'E-Wallet (OVO, DANA, ShopeePay, LinkAja)',
    category: 'ewallet',
    provider: 'doku',
    description: 'Dompet digital populer dengan otorisasi langsung aplikasi user.',
    feeLabel: 'MDR 1,5% – 2%',
    enabled: false,
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'PM-07',
    code: 'CREDIT_CARD_DOKU',
    name: 'Kartu Kredit / Debit Online',
    category: 'credit_card',
    provider: 'doku',
    description: 'Pembayaran Visa, Mastercard, dan JCB terproteksi 3DS via DOKU.',
    feeLabel: 'MDR 2,9% + Rp 2.000',
    enabled: false,
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
  {
    id: 'PM-08',
    code: 'RETAIL_OUTLET_DOKU',
    name: 'Gerai Ritel (Alfamart / Indomaret)',
    category: 'retail_outlet',
    provider: 'doku',
    description: 'Pembayaran tunai melalui kode bayar kasir gerai ritel mitra DOKU.',
    feeLabel: 'Biaya tetap Rp 5.000',
    enabled: false,
    updatedAt: '2026-11-14T00:00:00.000Z',
  },
];

export function createInitialBankSettings(): BankSettingsState {
  const initial: BankSettingsState = {
    manualBanks: [],
    dokuEnabled: true,
    paymentMethods: INITIAL_PAYMENT_METHODS.map((item) => ({ ...item })),
    updatedAt: null,
  };
  return BankSettingsStateSchema.parse(initial);
}

export interface ManualBankAccountInput {
  accountType?: AccountChannelType;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchOrNote: string;
  isActive: boolean;
}

export function normalizeBankAccountNumber(rawAccountNumber: string): string {
  return rawAccountNumber.replace(/[\s-]+/g, '').trim();
}

export function formatBankAccountNumber(accountNumber: string): string {
  const digits = normalizeBankAccountNumber(accountNumber);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function nextManualBankId(accounts: ReadonlyArray<ManualBankAccount>): string {
  let maxNumber = 0;
  for (const item of accounts) {
    const match = /^BNK-(\d+)$/i.exec(item.id);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  }
  return `BNK-${String(maxNumber + 1).padStart(2, '0')}`;
}

export function addManualBankAccount(
  state: BankSettingsState,
  input: ManualBankAccountInput,
  savedAtIso = new Date().toISOString()
): { state: BankSettingsState; error: string | null } {
  const normalizedNumber = normalizeBankAccountNumber(input.accountNumber);
  const candidate: ManualBankAccount = {
    id: nextManualBankId(state.manualBanks),
    accountType: input.accountType ?? 'bank',
    bankName: input.bankName.trim(),
    accountNumber: normalizedNumber,
    accountHolder: input.accountHolder.trim(),
    branchOrNote: input.branchOrNote.trim(),
    isActive: input.isActive,
    updatedAt: savedAtIso,
  };

  const parsed = ManualBankAccountSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      state,
      error: parsed.error.issues[0]?.message ?? 'Data rekening atau e-wallet manual tidak valid.',
    };
  }

  const normalizedBankName = parsed.data.bankName.toLowerCase();
  const duplicate = state.manualBanks.some(
    (item) =>
      item.bankName.trim().toLowerCase() === normalizedBankName &&
      item.accountNumber === parsed.data.accountNumber
  );
  if (duplicate) {
    return {
      state,
      error: 'Rekening / akun e-wallet dengan kanal dan nomor tersebut sudah terdaftar.',
    };
  }

  return {
    state: {
      ...state,
      manualBanks: [parsed.data, ...state.manualBanks],
      updatedAt: savedAtIso,
    },
    error: null,
  };
}

export function updateManualBankAccount(
  state: BankSettingsState,
  bankId: string,
  input: ManualBankAccountInput,
  savedAtIso = new Date().toISOString()
): { state: BankSettingsState; error: string | null } {
  const existing = state.manualBanks.find((item) => item.id === bankId);
  if (!existing) {
    return { state, error: 'Rekening atau e-wallet manual tidak ditemukan.' };
  }

  const normalizedNumber = normalizeBankAccountNumber(input.accountNumber);
  const candidate: ManualBankAccount = {
    id: existing.id,
    accountType: input.accountType ?? existing.accountType ?? 'bank',
    bankName: input.bankName.trim(),
    accountNumber: normalizedNumber,
    accountHolder: input.accountHolder.trim(),
    branchOrNote: input.branchOrNote.trim(),
    isActive: input.isActive,
    updatedAt: savedAtIso,
  };

  const parsed = ManualBankAccountSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      state,
      error: parsed.error.issues[0]?.message ?? 'Data rekening atau e-wallet manual tidak valid.',
    };
  }

  const normalizedBankName = parsed.data.bankName.toLowerCase();
  const duplicate = state.manualBanks.some(
    (item) =>
      item.id !== bankId &&
      item.bankName.trim().toLowerCase() === normalizedBankName &&
      item.accountNumber === parsed.data.accountNumber
  );
  if (duplicate) {
    return {
      state,
      error: 'Nomor rekening / akun tersebut sudah digunakan oleh entri lain.',
    };
  }

  return {
    state: {
      ...state,
      manualBanks: state.manualBanks.map((item) => (item.id === bankId ? parsed.data : item)),
      updatedAt: savedAtIso,
    },
    error: null,
  };
}

export function toggleManualBankAccountStatus(
  state: BankSettingsState,
  bankId: string,
  savedAtIso = new Date().toISOString()
): BankSettingsState {
  return {
    ...state,
    manualBanks: state.manualBanks.map((item) =>
      item.id === bankId ? { ...item, isActive: !item.isActive, updatedAt: savedAtIso } : item
    ),
    updatedAt: savedAtIso,
  };
}

export function deleteManualBankAccount(
  state: BankSettingsState,
  bankId: string,
  savedAtIso = new Date().toISOString()
): BankSettingsState {
  return {
    ...state,
    manualBanks: state.manualBanks.filter((item) => item.id !== bankId),
    updatedAt: savedAtIso,
  };
}

export function toggleDokuGatewayEnabled(
  state: BankSettingsState,
  savedAtIso = new Date().toISOString()
): BankSettingsState {
  return {
    ...state,
    dokuEnabled: !state.dokuEnabled,
    updatedAt: savedAtIso,
  };
}

export function togglePaymentMethodEnabled(
  state: BankSettingsState,
  methodId: string,
  savedAtIso = new Date().toISOString()
): BankSettingsState {
  return {
    ...state,
    paymentMethods: state.paymentMethods.map((method) =>
      method.id === methodId
        ? { ...method, enabled: !method.enabled, updatedAt: savedAtIso }
        : method
    ),
    updatedAt: savedAtIso,
  };
}

export function filterPaymentMethods(
  methods: ReadonlyArray<PaymentMethodConfig>,
  filter: PaymentMethodFilter
): PaymentMethodConfig[] {
  if (filter === 'semua') {
    return [...methods];
  }
  return methods.filter((method) => method.provider === filter);
}
