import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dispatchSmtpTestEmail } from '@/src/lib/smtp-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TestEmailRequestSchema = z.object({
  recipientEmail: z.string().trim().email('Masukkan alamat email penerima tes yang valid.'),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Payload JSON permintaan tidak valid.' },
      { status: 400 }
    );
  }

  const parsed = TestEmailRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Alamat email tujuan tes tidak valid.',
      },
      { status: 400 }
    );
  }

  const result = await dispatchSmtpTestEmail(parsed.data.recipientEmail);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
