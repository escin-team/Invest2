import {
  WithdrawalPublicationSchema,
  type AdminUserRecord,
  type QueueTransaction,
  type WithdrawalPublication,
} from './dashboard-schema';
import { formatRupiah } from './utils';

export type WithdrawalPublicationFilter = 'semua' | 'published' | 'draft' | 'no_proof';

export function buildSampleProofReceiptUrl(params: {
  id: string;
  userName: string;
  bankChannel: string;
  amount: number;
  withdrawalDate: string;
}): string {
  const formattedAmount = formatRupiah(params.amount);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="340" viewBox="0 0 520 340">
  <rect width="520" height="340" rx="14" fill="#f8fafc" />
  <rect x="20" y="20" width="480" height="300" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
  <rect x="20" y="20" width="480" height="58" rx="12" fill="#0f172a" />
  <rect x="20" y="64" width="480" height="14" fill="#0f172a" />
  <text x="42" y="54" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700" fill="#ffffff">Bukti Transfer Withdrawal</text>
  <rect x="372" y="37" width="108" height="24" rx="6" fill="#10b981" />
  <text x="426" y="53" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff">BERHASIL</text>
  <text x="42" y="108" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#64748b">Nominal Transfer</text>
  <text x="42" y="138" font-family="ui-monospace, SFMono-Regular, monospace" font-size="24" font-weight="700" fill="#0f172a">${escapeXml(formattedAmount)}</text>
  <line x1="42" y1="158" x2="478" y2="158" stroke="#e2e8f0" stroke-width="1" />
  <text x="42" y="184" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#64748b">ID Withdrawal</text>
  <text x="478" y="184" text-anchor="end" font-family="ui-monospace, SFMono-Regular, monospace" font-size="12" font-weight="600" fill="#0f172a">${escapeXml(params.id)}</text>
  <text x="42" y="214" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#64748b">Penerima</text>
  <text x="478" y="214" text-anchor="end" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" font-weight="600" fill="#0f172a">${escapeXml(params.userName)}</text>
  <text x="42" y="244" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#64748b">Rekening Tujuan</text>
  <text x="478" y="244" text-anchor="end" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" font-weight="600" fill="#0f172a">${escapeXml(params.bankChannel)}</text>
  <text x="42" y="274" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#64748b">Tanggal Pencairan</text>
  <text x="478" y="274" text-anchor="end" font-family="ui-monospace, SFMono-Regular, monospace" font-size="12" font-weight="600" fill="#0f172a">${escapeXml(params.withdrawalDate)}</text>
  <text x="42" y="302" font-family="ui-sans-serif, system-ui, sans-serif" font-size="10" fill="#94a3b8">Diverifikasi oleh Nature Republic Investasi</text>
</svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const INITIAL_WITHDRAWAL_PUBLICATIONS: WithdrawalPublication[] = [
  {
    id: 'WD-261114-094',
    userId: 'USR-8812',
    userNumber: 2298,
    userName: 'Rizky Pratama',
    userEmail: 'rizky.pratama@mail.id',
    bankChannel: 'Bank BCA · 882104412',
    amount: 2_000_000,
    withdrawalDate: '14 Nov 2026 · 15:20',
    proofUrl: buildSampleProofReceiptUrl({
      id: 'WD-261114-094',
      userName: 'Rizky Pratama',
      bankChannel: 'Bank BCA · 882104412',
      amount: 2_000_000,
      withdrawalDate: '14 Nov 2026 · 15:20',
    }),
    proofFileName: 'struk-bca-wd-094.svg',
    proofUploadedAt: '14 Nov 2026 · 15:24',
    publicationStatus: 'published',
    publishedAt: '14 Nov 2026 · 15:25',
  },
  {
    id: 'WD-261114-091',
    userId: 'USR-8804',
    userNumber: 2295,
    userName: 'Siti Nurhaliza',
    userEmail: 'siti.nur@mail.id',
    bankChannel: 'Bank Mandiri · 137000492',
    amount: 1_500_000,
    withdrawalDate: '14 Nov 2026 · 13:45',
    proofUrl: buildSampleProofReceiptUrl({
      id: 'WD-261114-091',
      userName: 'Siti Nurhaliza',
      bankChannel: 'Bank Mandiri · 137000492',
      amount: 1_500_000,
      withdrawalDate: '14 Nov 2026 · 13:45',
    }),
    proofFileName: 'bukti-mandiri-wd-091.svg',
    proofUploadedAt: '14 Nov 2026 · 13:52',
    publicationStatus: 'published',
    publishedAt: '14 Nov 2026 · 13:55',
  },
  {
    id: 'WD-261114-088',
    userId: 'USR-8791',
    userNumber: 2290,
    userName: 'Adi Kurniawan',
    userEmail: 'adi.kurniawan@mail.id',
    bankChannel: 'Bank BCA · 882104412',
    amount: 4_250_000,
    withdrawalDate: '14 Nov 2026 · 11:18',
    proofUrl: buildSampleProofReceiptUrl({
      id: 'WD-261114-088',
      userName: 'Adi Kurniawan',
      bankChannel: 'Bank BCA · 882104412',
      amount: 4_250_000,
      withdrawalDate: '14 Nov 2026 · 11:18',
    }),
    proofFileName: 'transfer-bca-wd-088.svg',
    proofUploadedAt: '14 Nov 2026 · 11:30',
    publicationStatus: 'draft',
    publishedAt: null,
  },
  {
    id: 'WD-261113-076',
    userId: 'USR-8398',
    userNumber: 2118,
    userName: 'Tania Maharani',
    userEmail: 'tania.maharani@mail.id',
    bankChannel: 'Bank Mandiri · 142009123',
    amount: 2_350_000,
    withdrawalDate: '13 Nov 2026 · 16:05',
    proofUrl: buildSampleProofReceiptUrl({
      id: 'WD-261113-076',
      userName: 'Tania Maharani',
      bankChannel: 'Bank Mandiri · 142009123',
      amount: 2_350_000,
      withdrawalDate: '13 Nov 2026 · 16:05',
    }),
    proofFileName: 'struk-mandiri-wd-076.svg',
    proofUploadedAt: '13 Nov 2026 · 16:12',
    publicationStatus: 'published',
    publishedAt: '13 Nov 2026 · 16:14',
  },
  {
    id: 'WD-261113-072',
    userId: 'USR-8410',
    userNumber: 2140,
    userName: 'Bagus Setiawan',
    userEmail: 'bagus.setiawan@mail.id',
    bankChannel: 'Bank BNI · 092118822',
    amount: 1_950_000,
    withdrawalDate: '13 Nov 2026 · 10:42',
    proofUrl: '',
    proofFileName: '',
    proofUploadedAt: null,
    publicationStatus: 'draft',
    publishedAt: null,
  },
  {
    id: 'WD-261112-065',
    userId: null,
    userNumber: 2284,
    userName: 'Nadia Kusuma',
    userEmail: 'nadia.kusuma@mail.id',
    bankChannel: 'Bank BRI · 041901002',
    amount: 2_850_000,
    withdrawalDate: '12 Nov 2026 · 14:28',
    proofUrl: '',
    proofFileName: '',
    proofUploadedAt: null,
    publicationStatus: 'draft',
    publishedAt: null,
  },
];

export function getWithdrawalPublicationSummary(records: WithdrawalPublication[]): {
  totalCount: number;
  totalAmount: number;
  publishedCount: number;
  publishedAmount: number;
  draftCount: number;
  missingProofCount: number;
} {
  let totalAmount = 0;
  let publishedCount = 0;
  let publishedAmount = 0;
  let draftCount = 0;
  let missingProofCount = 0;

  for (const item of records) {
    totalAmount += item.amount;
    if (item.publicationStatus === 'published') {
      publishedCount += 1;
      publishedAmount += item.amount;
    } else {
      draftCount += 1;
    }
    if (!item.proofUrl) {
      missingProofCount += 1;
    }
  }

  return {
    totalCount: records.length,
    totalAmount,
    publishedCount,
    publishedAmount,
    draftCount,
    missingProofCount,
  };
}

export function filterWithdrawalPublications(
  records: WithdrawalPublication[],
  options: { filter: WithdrawalPublicationFilter; query: string }
): WithdrawalPublication[] {
  const { filter, query } = options;
  return records.filter((item) => {
    if (filter === 'published' && item.publicationStatus !== 'published') return false;
    if (filter === 'draft' && item.publicationStatus !== 'draft') return false;
    if (filter === 'no_proof' && Boolean(item.proofUrl)) return false;

    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.userName.toLowerCase().includes(q) ||
      item.userEmail.toLowerCase().includes(q) ||
      item.bankChannel.toLowerCase().includes(q) ||
      `#${item.userNumber}`.includes(q)
    );
  });
}

export function updateWithdrawalProof(
  records: WithdrawalPublication[],
  withdrawalId: string,
  payload: { proofUrl: string; proofFileName: string; uploadedAt?: string }
): WithdrawalPublication[] {
  const uploadedAt = payload.uploadedAt ?? '15 Nov 2026 · 08:20';
  return records.map((item) => {
    if (item.id !== withdrawalId) return item;
    return WithdrawalPublicationSchema.parse({
      ...item,
      proofUrl: payload.proofUrl,
      proofFileName: payload.proofFileName.trim() || 'bukti-transfer.jpg',
      proofUploadedAt: uploadedAt,
    });
  });
}

export function clearWithdrawalProof(
  records: WithdrawalPublication[],
  withdrawalId: string
): WithdrawalPublication[] {
  return records.map((item) => {
    if (item.id !== withdrawalId) return item;
    return WithdrawalPublicationSchema.parse({
      ...item,
      proofUrl: '',
      proofFileName: '',
      proofUploadedAt: null,
    });
  });
}

export function toggleWithdrawalPublication(
  records: WithdrawalPublication[],
  withdrawalId: string,
  options?: { timestamp?: string }
): {
  records: WithdrawalPublication[];
  error: string | null;
} {
  const timestamp = options?.timestamp ?? '15 Nov 2026 · 08:22';
  const target = records.find((item) => item.id === withdrawalId);
  if (!target) {
    return { records, error: 'Data withdrawal tidak ditemukan.' };
  }

  const nextStatus: 'published' | 'draft' =
    target.publicationStatus === 'published' ? 'draft' : 'published';

  const updated = records.map((item) => {
    if (item.id !== withdrawalId) return item;
    return WithdrawalPublicationSchema.parse({
      ...item,
      publicationStatus: nextStatus,
      publishedAt: nextStatus === 'published' ? timestamp : null,
    });
  });

  return { records: updated, error: null };
}

export function upsertWithdrawalPublicationFromQueueTx(
  records: WithdrawalPublication[],
  tx: QueueTransaction,
  users: ReadonlyArray<Pick<AdminUserRecord, 'id' | 'userNumber' | 'email'>>,
  options?: {
    proofUrl?: string;
    proofFileName?: string;
    publishImmediately?: boolean;
    timestamp?: string;
  }
): WithdrawalPublication[] {
  if (tx.type !== 'withdrawal') return records;

  const timestamp = options?.timestamp ?? '15 Nov 2026 · 08:30';
  const proofUrl = options?.proofUrl?.trim() ?? '';
  const proofFileName = proofUrl ? options?.proofFileName?.trim() || 'bukti-transfer.jpg' : '';
  const publishImmediately = Boolean(options?.publishImmediately);

  const matchedUser = users.find(
    (u) => u.email.trim().toLowerCase() === tx.userEmail.trim().toLowerCase()
  );

  const entry = WithdrawalPublicationSchema.parse({
    id: tx.id,
    userId: matchedUser?.id ?? null,
    userNumber: matchedUser?.userNumber ?? 2280,
    userName: tx.userName,
    userEmail: tx.userEmail,
    bankChannel: tx.channel,
    amount: tx.amount,
    withdrawalDate: tx.submittedAt,
    proofUrl,
    proofFileName,
    proofUploadedAt: proofUrl ? timestamp : null,
    publicationStatus: publishImmediately ? 'published' : 'draft',
    publishedAt: publishImmediately ? timestamp : null,
  });

  const exists = records.some((item) => item.id === entry.id);
  if (exists) {
    return records.map((item) => (item.id === entry.id ? entry : item));
  }
  return [entry, ...records];
}

