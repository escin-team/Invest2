import { listLogos, type LogoMeta } from 'idn-finlogos';

export interface IndonesianBankOption {
  slug: string;
  name: string;
  aliases: ReadonlyArray<string>;
}

const EXCLUDED_VARIANT_SUFFIXES = ['-old', '-alt', '-alt-2', '-vertical'];

function isPrimaryVariant(slug: string): boolean {
  return !EXCLUDED_VARIANT_SUFFIXES.some((suffix) => slug.endsWith(suffix));
}

function normalizeLookupText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALL_BANK_LOGOS: ReadonlyArray<LogoMeta> = listLogos({ category: 'bank-logo' });
const ALL_EWALLET_LOGOS: ReadonlyArray<LogoMeta> = listLogos({ category: 'e-wallet' });

export const INDONESIAN_BANK_OPTIONS: ReadonlyArray<IndonesianBankOption> =
  ALL_BANK_LOGOS.filter((item) => isPrimaryVariant(item.slug))
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      aliases: item.aliases,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));

const PRIORITY_EWALLET_SLUGS: ReadonlyArray<string> = [
  'dana',
  'ovo',
  'gopay',
  'shopee-pay',
  'linkaja',
  'astra-pay',
  'motion-pay',
  'i-saku',
  'doku',
];

export const INDONESIAN_EWALLET_OPTIONS: ReadonlyArray<IndonesianBankOption> =
  ALL_EWALLET_LOGOS.filter((item) => isPrimaryVariant(item.slug))
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      aliases: item.aliases,
    }))
    .sort((a, b) => {
      const aIdx = PRIORITY_EWALLET_SLUGS.indexOf(a.slug);
      const bIdx = PRIORITY_EWALLET_SLUGS.indexOf(b.slug);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name, 'id');
    });

const ALL_FINANCIAL_CHANNEL_OPTIONS: ReadonlyArray<IndonesianBankOption> = [
  ...INDONESIAN_BANK_OPTIONS,
  ...INDONESIAN_EWALLET_OPTIONS,
];

const KEYWORD_TO_SLUGS: ReadonlyArray<{ keywords: ReadonlyArray<string>; slug: string }> = [
  { keywords: ['qris'], slug: 'qris' },
  { keywords: ['doku'], slug: 'doku' },
  { keywords: ['bca syariah'], slug: 'bca-syariah' },
  { keywords: ['blu', 'bca digital'], slug: 'blu-bca' },
  { keywords: ['bca', 'bank central asia'], slug: 'bca' },
  { keywords: ['mandiri taspen'], slug: 'mandiri-taspen' },
  { keywords: ['mandiri', 'livin'], slug: 'mandiri' },
  { keywords: ['bri', 'rakyat indonesia', 'brimo'], slug: 'bri' },
  { keywords: ['bni', 'negara indonesia'], slug: 'bni' },
  { keywords: ['bsi', 'syariah indonesia'], slug: 'bsi' },
  { keywords: ['btn syariah'], slug: 'btn-syariah' },
  { keywords: ['btn', 'tabungan negara'], slug: 'btn' },
  { keywords: ['cimb niaga syariah'], slug: 'cimb-niaga-syariah' },
  { keywords: ['cimb'], slug: 'cimb-niaga' },
  { keywords: ['permata'], slug: 'permata' },
  { keywords: ['danamon syariah'], slug: 'danamon-syariah' },
  { keywords: ['danamon'], slug: 'danamon' },
  { keywords: ['seabank', 'sea bank'], slug: 'seabank' },
  { keywords: ['jago'], slug: 'jago' },
  { keywords: ['neo commerce', 'bnc', 'neobank'], slug: 'bnc' },
  { keywords: ['allo'], slug: 'allo' },
  { keywords: ['aladin'], slug: 'aladin' },
  { keywords: ['bjb syariah'], slug: 'bank-bjb-syariah' },
  { keywords: ['bjb', 'jabar banten'], slug: 'bank-bjb' },
  { keywords: ['bank dki', 'bank jakarta'], slug: 'bank-jakarta' },
  { keywords: ['ovo'], slug: 'ovo' },
  { keywords: ['dana'], slug: 'dana' },
  { keywords: ['shopeepay', 'shopee pay'], slug: 'shopee-pay' },
  { keywords: ['gopay', 'go pay'], slug: 'gopay' },
  { keywords: ['linkaja', 'link aja'], slug: 'linkaja' },
  { keywords: ['astrapay', 'astra pay'], slug: 'astra-pay' },
  { keywords: ['motionpay', 'motion pay'], slug: 'motion-pay' },
  { keywords: ['isaku', 'i saku'], slug: 'i-saku' },
  { keywords: ['kaspro'], slug: 'kaspro' },
  { keywords: ['ottopay', 'otto pay'], slug: 'otto-pay' },
  { keywords: ['paydia'], slug: 'paydia' },
  { keywords: ['pospay'], slug: 'pospay' },
  { keywords: ['speedcash'], slug: 'speedcash' },
  { keywords: ['truemoney'], slug: 'truemoney' },
  { keywords: ['yukk'], slug: 'yukk' },
  { keywords: ['jakone'], slug: 'jakone-pay' },
  { keywords: ['alfamart'], slug: 'alfamart' },
  { keywords: ['indomaret'], slug: 'indomaret' },
  { keywords: ['mastercard'], slug: 'mastercard' },
  { keywords: ['visa', 'kartu kredit'], slug: 'visa' },
  { keywords: ['bi fast', 'bifast'], slug: 'bi-fast' },
];

function hasKeywordMatch(normalizedText: string, keyword: string): boolean {
  if (keyword.length <= 4 && !keyword.includes(' ')) {
    const tokens = normalizedText.split(' ');
    return tokens.includes(keyword);
  }
  return normalizedText.includes(keyword);
}

export function resolveIndonesianBankSlug(rawName: string): string | null {
  const normalized = normalizeLookupText(rawName);
  if (!normalized) {
    return null;
  }

  // 1. Exact slug or exact name match across primary Indonesian banks & e-wallets
  for (const bank of ALL_FINANCIAL_CHANNEL_OPTIONS) {
    const cleanName = normalizeLookupText(bank.name);
    const cleanSlug = normalizeLookupText(bank.slug);
    if (normalized === cleanName || normalized === cleanSlug) {
      return bank.slug;
    }
    if (bank.aliases.some((alias) => normalizeLookupText(alias) === normalized)) {
      return bank.slug;
    }
  }

  // 2. Match without common Indonesian "bank" prefix (e.g., "Bank Mandiri" -> "mandiri")
  const withoutBankPrefix = normalized.replace(/^bank\s+/, '').trim();
  if (withoutBankPrefix && withoutBankPrefix !== normalized) {
    for (const bank of INDONESIAN_BANK_OPTIONS) {
      const cleanName = normalizeLookupText(bank.name).replace(/^bank\s+/, '').trim();
      const cleanSlug = normalizeLookupText(bank.slug).replace(/^bank\s+/, '').trim();
      if (withoutBankPrefix === cleanName || withoutBankPrefix === cleanSlug) {
        return bank.slug;
      }
    }
  }

  // 3. Domain channel & popular bank/e-wallet keyword match
  for (const rule of KEYWORD_TO_SLUGS) {
    if (rule.keywords.some((kw) => hasKeywordMatch(normalized, kw))) {
      return rule.slug;
    }
  }

  // 4. Partial match against all Indonesian banks & e-wallets (longest name first)
  const sortedByLength = [...ALL_FINANCIAL_CHANNEL_OPTIONS].sort(
    (a, b) => b.name.length - a.name.length
  );
  for (const bank of sortedByLength) {
    const cleanName = normalizeLookupText(bank.name);
    if (cleanName.length >= 4 && normalized.includes(cleanName)) {
      return bank.slug;
    }
  }

  return null;
}

export function resolvePaymentChannelSlugs(codeOrChannel: string): string[] {
  const normalized = normalizeLookupText(codeOrChannel);
  if (!normalized) {
    return [];
  }

  if (normalized.includes('bri') && normalized.includes('bni')) {
    return ['bri', 'bni'];
  }
  if (normalized.includes('ewallet') || normalized.includes('e wallet')) {
    return ['ovo', 'dana', 'shopee-pay', 'linkaja'];
  }
  if (normalized.includes('credit card') || normalized.includes('kartu kredit')) {
    return ['visa', 'mastercard'];
  }
  if (normalized.includes('retail') || normalized.includes('gerai ritel')) {
    return ['alfamart', 'indomaret'];
  }

  const single = resolveIndonesianBankSlug(codeOrChannel);
  return single ? [single] : [];
}
