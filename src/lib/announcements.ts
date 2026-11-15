import {
  AnnouncementRecordSchema,
  MarqueeDurationSecondsSchema,
  type AnnouncementRecord,
  type AnnouncementStatus,
  type MarqueeDurationSeconds,
} from './dashboard-schema';

export type AnnouncementStatusFilter = 'all' | AnnouncementStatus;

export interface MarqueeSpeedOption {
  durationSeconds: MarqueeDurationSeconds;
  label: string;
  speedLabel: string;
  presetKey?: 'lambat' | 'normal' | 'cepat';
}

export const DEFAULT_MARQUEE_DURATION_SECONDS: MarqueeDurationSeconds = 32;

export const MARQUEE_SPEED_OPTIONS: ReadonlyArray<MarqueeSpeedOption> = [
  {
    durationSeconds: 60,
    label: 'Sangat Lambat',
    speedLabel: '0.5x',
  },
  {
    durationSeconds: 48,
    label: 'Lambat',
    speedLabel: '0.7x',
    presetKey: 'lambat',
  },
  {
    durationSeconds: 32,
    label: 'Normal',
    speedLabel: '1.0x',
    presetKey: 'normal',
  },
  {
    durationSeconds: 24,
    label: 'Cukup Cepat',
    speedLabel: '1.3x',
  },
  {
    durationSeconds: 18,
    label: 'Cepat',
    speedLabel: '1.8x',
    presetKey: 'cepat',
  },
  {
    durationSeconds: 12,
    label: 'Sangat Cepat',
    speedLabel: '2.5x',
  },
  {
    durationSeconds: 8,
    label: 'Kilat',
    speedLabel: '4.0x',
  },
];

export function getMarqueeSpeedOption(
  durationSeconds: MarqueeDurationSeconds
): MarqueeSpeedOption {
  return (
    MARQUEE_SPEED_OPTIONS.find((opt) => opt.durationSeconds === durationSeconds) ??
    MARQUEE_SPEED_OPTIONS[2]
  );
}

export function getMarqueeDurationClassName(
  durationSeconds: MarqueeDurationSeconds
): string {
  switch (durationSeconds) {
    case 60:
      return 'marquee-duration-60';
    case 48:
      return 'marquee-duration-48';
    case 32:
      return 'marquee-duration-32';
    case 24:
      return 'marquee-duration-24';
    case 18:
      return 'marquee-duration-18';
    case 12:
      return 'marquee-duration-12';
    case 8:
      return 'marquee-duration-8';
  }
}

export function parseMarqueeDurationSeconds(
  rawDuration: number
): MarqueeDurationSeconds {
  const parsed = MarqueeDurationSecondsSchema.safeParse(rawDuration);
  return parsed.success ? parsed.data : DEFAULT_MARQUEE_DURATION_SECONDS;
}

export interface AnnouncementInput {
  title: string;
  message: string;
  status: AnnouncementStatus;
  showOnMemberMarquee: boolean;
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const INITIAL_ANNOUNCEMENTS: ReadonlyArray<AnnouncementRecord> = [
  {
    id: 'ANN-01',
    title: 'Pemeliharaan sistem',
    message:
      '📢 PENGUMUMAN PERUBAHAN DOMAIN Kepada seluruh member Folgers Coffee, Kami informasikan bahwa telah terjadi perubahan domain website dikarenakan adanya beberapa masalah pada domain sebelumnya. 🔴 Domain sebelumnya: https://folgerscoffee.biz.id/register 🟢 Domain terbaru: https://folgers.biz.id/ Mulai saat ini, seluruh aktivitas dan akses website harap menggunakan domain terbaru: 👉 https://folgers.biz.id/ Mohon seluruh member tidak menggunakan atau mengakses link lama untuk menghindari kendala dalam proses login, pendaftaran, maupun aktivitas lainnya. Terima kasih atas perhatian dan kerja samanya. 🙏 Admin Folgers Coffee',
    publishedAt: '07 Oct 2026, 10:28',
    status: 'Active',
    showOnMemberMarquee: true,
  },
];

export function formatAnnouncementDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = SHORT_MONTHS[date.getMonth()] ?? 'Jan';
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function getNextAnnouncementId(
  records: ReadonlyArray<AnnouncementRecord>
): string {
  let maxNumber = 0;
  for (const item of records) {
    const match = /^ANN-(\d+)$/i.exec(item.id);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }
  }
  return `ANN-${String(maxNumber + 1).padStart(2, '0')}`;
}

export function filterAnnouncements(
  records: ReadonlyArray<AnnouncementRecord>,
  options: {
    query: string;
    statusFilter: AnnouncementStatusFilter;
  }
): AnnouncementRecord[] {
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
      item.message.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getActiveMemberMarqueeAnnouncements(
  records: ReadonlyArray<AnnouncementRecord>
): AnnouncementRecord[] {
  return records.filter(
    (item) => item.status === 'Active' && item.showOnMemberMarquee
  );
}

export function buildMemberMarqueeText(
  records: ReadonlyArray<AnnouncementRecord>
): string {
  const active = getActiveMemberMarqueeAnnouncements(records);
  if (active.length === 0) return '';
  return active
    .map((item) => `${item.title} — ${item.message.replace(/\s+/g, ' ').trim()}`)
    .join('   •   ');
}

export function addAnnouncement(
  records: ReadonlyArray<AnnouncementRecord>,
  input: AnnouncementInput,
  now = new Date()
): {
  records: AnnouncementRecord[];
  created: AnnouncementRecord | null;
  error: string | null;
} {
  const candidate: AnnouncementRecord = {
    id: getNextAnnouncementId(records),
    title: input.title.trim(),
    message: input.message.trim(),
    publishedAt: formatAnnouncementDate(now),
    status: input.status,
    showOnMemberMarquee: input.showOnMemberMarquee,
  };

  const parsed = AnnouncementRecordSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      records: [...records],
      created: null,
      error: parsed.error.issues[0]?.message ?? 'Data pengumuman tidak valid.',
    };
  }

  return {
    records: [parsed.data, ...records],
    created: parsed.data,
    error: null,
  };
}

export function updateAnnouncement(
  records: ReadonlyArray<AnnouncementRecord>,
  announcementId: string,
  input: AnnouncementInput
): { records: AnnouncementRecord[]; error: string | null } {
  const existing = records.find((item) => item.id === announcementId);
  if (!existing) {
    return { records: [...records], error: 'Data pengumuman tidak ditemukan.' };
  }

  const candidate: AnnouncementRecord = {
    ...existing,
    title: input.title.trim(),
    message: input.message.trim(),
    status: input.status,
    showOnMemberMarquee: input.showOnMemberMarquee,
  };

  const parsed = AnnouncementRecordSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      records: [...records],
      error: parsed.error.issues[0]?.message ?? 'Data pengumuman tidak valid.',
    };
  }

  return {
    records: records.map((item) =>
      item.id === announcementId ? parsed.data : item
    ),
    error: null,
  };
}

export function toggleAnnouncementStatus(
  records: ReadonlyArray<AnnouncementRecord>,
  announcementId: string
): AnnouncementRecord[] {
  return records.map((item) =>
    item.id === announcementId
      ? {
          ...item,
          status: item.status === 'Active' ? 'Inactive' : 'Active',
        }
      : item
  );
}

export function deleteAnnouncement(
  records: ReadonlyArray<AnnouncementRecord>,
  announcementId: string
): AnnouncementRecord[] {
  return records.filter((item) => item.id !== announcementId);
}
