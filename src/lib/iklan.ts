import {
  AdBannerRecordSchema,
  type AdBannerRecord,
  type AdBannerStatus,
} from './dashboard-schema';

export type AdStatusFilter = 'all' | AdBannerStatus;

export interface AdBannerInput {
  title: string;
  imageUrl: string;
  imageFileName: string;
  showTime: string;
  status: AdBannerStatus;
  showOnMemberLogin: boolean;
}

export const INITIAL_AD_BANNERS: ReadonlyArray<AdBannerRecord> = [
  {
    id: 'IKL-01',
    title: 'Bonus Reward Honda Beat',
    imageUrl: '/assets/images/iklan_honda_beat_1794727448331.jpg',
    imageFileName: 'iklan_honda_beat_1794727448331.jpg',
    showTime: '-',
    status: 'Active',
    showOnMemberLogin: true,
    createdAt: '2026-09-27 22:36',
  },
];

export function formatAdTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function getNextAdBannerId(records: ReadonlyArray<AdBannerRecord>): string {
  let maxNumber = 0;
  for (const item of records) {
    const match = /^IKL-(\d+)$/i.exec(item.id);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  }
  return `IKL-${String(maxNumber + 1).padStart(2, '0')}`;
}

export function filterAdBanners(
  records: ReadonlyArray<AdBannerRecord>,
  options: {
    query: string;
    statusFilter: AdStatusFilter;
  }
): AdBannerRecord[] {
  const normalizedQuery = options.query.trim().toLowerCase();
  return records.filter((item) => {
    if (options.statusFilter !== 'all' && item.status !== options.statusFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return (
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.showTime.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getActiveMemberLoginAds(
  records: ReadonlyArray<AdBannerRecord>
): AdBannerRecord[] {
  return records.filter(
    (item) => item.status === 'Active' && item.showOnMemberLogin
  );
}

export function addAdBanner(
  records: ReadonlyArray<AdBannerRecord>,
  input: AdBannerInput,
  now = new Date()
): { records: AdBannerRecord[]; created: AdBannerRecord | null; error: string | null } {
  const candidate: AdBannerRecord = {
    id: getNextAdBannerId(records),
    title: input.title.trim(),
    imageUrl: input.imageUrl.trim(),
    imageFileName: input.imageFileName.trim(),
    showTime: input.showTime.trim() || '-',
    status: input.status,
    showOnMemberLogin: input.showOnMemberLogin,
    createdAt: formatAdTimestamp(now),
  };

  const parsed = AdBannerRecordSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      records: [...records],
      created: null,
      error: parsed.error.issues[0]?.message ?? 'Data iklan tidak valid.',
    };
  }

  return {
    records: [parsed.data, ...records],
    created: parsed.data,
    error: null,
  };
}

export function updateAdBanner(
  records: ReadonlyArray<AdBannerRecord>,
  adId: string,
  input: AdBannerInput
): { records: AdBannerRecord[]; error: string | null } {
  const existing = records.find((item) => item.id === adId);
  if (!existing) {
    return { records: [...records], error: 'Data iklan tidak ditemukan.' };
  }

  const candidate: AdBannerRecord = {
    ...existing,
    title: input.title.trim(),
    imageUrl: input.imageUrl.trim(),
    imageFileName: input.imageFileName.trim(),
    showTime: input.showTime.trim() || '-',
    status: input.status,
    showOnMemberLogin: input.showOnMemberLogin,
  };

  const parsed = AdBannerRecordSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      records: [...records],
      error: parsed.error.issues[0]?.message ?? 'Data iklan tidak valid.',
    };
  }

  return {
    records: records.map((item) => (item.id === adId ? parsed.data : item)),
    error: null,
  };
}

export function toggleAdBannerStatus(
  records: ReadonlyArray<AdBannerRecord>,
  adId: string
): AdBannerRecord[] {
  return records.map((item) =>
    item.id === adId
      ? {
          ...item,
          status: item.status === 'Active' ? 'Inactive' : 'Active',
        }
      : item
  );
}

export function deleteAdBanner(
  records: ReadonlyArray<AdBannerRecord>,
  adId: string
): AdBannerRecord[] {
  return records.filter((item) => item.id !== adId);
}
