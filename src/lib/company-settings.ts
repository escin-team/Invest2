import { z } from 'zod';
import {
  CompanySettingsSchema,
  type CompanyDocumentSlotKey,
  type CompanyImageAsset,
  type CompanySettings,
} from './dashboard-schema';

export interface CompanyDocumentSlotMeta {
  key: CompanyDocumentSlotKey;
  label: string;
  helperText: string;
}

export const COMPANY_DOCUMENT_SLOTS: ReadonlyArray<CompanyDocumentSlotMeta> = [
  {
    key: 'faqImage',
    label: 'Upload Gambar FAQ (Opsional)',
    helperText: 'Banner atau panduan tanya jawab yang ditampilkan kepada user.',
  },
  {
    key: 'rulesImage',
    label: 'Upload Gambar Aturan (Opsional)',
    helperText: 'Infografis syarat, ketentuan, dan tata tertib platform.',
  },
  {
    key: 'contractImage',
    label: 'Upload Gambar Kontrak (Opsional)',
    helperText: 'Ilustrasi atau dokumen visual perjanjian kerja sama investasi.',
  },
  {
    key: 'charityImage',
    label: 'Upload Gambar Donasi Amal (Opsional)',
    helperText: 'Poster atau dokumentasi program donasi sosial perusahaan.',
  },
];

export const EMPTY_COMPANY_SETTINGS: CompanySettings = {
  faqImage: null,
  rulesImage: null,
  contractImage: null,
  charityImage: null,
  csPhone: '',
  csEmail: '',
  updatedAt: null,
};

const csEmailValidator = z.string().trim().email('Format Email CS tidak valid.');

export function createEmptyCompanySettings(): CompanySettings {
  return {
    faqImage: null,
    rulesImage: null,
    contractImage: null,
    charityImage: null,
    csPhone: '',
    csEmail: '',
    updatedAt: null,
  };
}

export function validateCompanyCsPhone(rawPhone: string): string | null {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return null;
  }
  if (/[^0-9+\-\s()]/.test(trimmed)) {
    return 'Nomor CS hanya boleh berisi angka, tanda +, spasi, atau tanda hubung.';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 16) {
    return 'Nomor CS harus terdiri dari 6 sampai 16 digit.';
  }
  return null;
}

export function formatCompanyImageSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export interface SaveCompanySettingsInput {
  faqImage: CompanyImageAsset | null;
  rulesImage: CompanyImageAsset | null;
  contractImage: CompanyImageAsset | null;
  charityImage: CompanyImageAsset | null;
  csPhone: string;
  csEmail: string;
}

export function validateAndSaveCompanySettings(
  input: SaveCompanySettingsInput,
  savedAtIso = new Date().toISOString()
): { settings: CompanySettings | null; error: string | null } {
  const phoneError = validateCompanyCsPhone(input.csPhone);
  if (phoneError) {
    return { settings: null, error: phoneError };
  }

  const trimmedEmail = input.csEmail.trim();
  if (trimmedEmail) {
    const emailResult = csEmailValidator.safeParse(trimmedEmail);
    if (!emailResult.success) {
      return {
        settings: null,
        error: emailResult.error.issues[0]?.message ?? 'Format Email CS tidak valid.',
      };
    }
  }

  const candidate: CompanySettings = {
    faqImage: input.faqImage,
    rulesImage: input.rulesImage,
    contractImage: input.contractImage,
    charityImage: input.charityImage,
    csPhone: input.csPhone.trim(),
    csEmail: trimmedEmail,
    updatedAt: savedAtIso,
  };

  const parsed = CompanySettingsSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      settings: null,
      error: parsed.error.issues[0]?.message ?? 'Data pengaturan perusahaan tidak valid.',
    };
  }

  return { settings: parsed.data, error: null };
}
