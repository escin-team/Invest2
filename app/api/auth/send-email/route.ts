import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendAuthOtpEmail } from '@/src/lib/smtp-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SendAuthEmailRequestSchema = z.object({
  purpose: z.enum(['register_otp', 'forgot_password']),
  email: z.string().trim().email('Masukkan alamat email yang valid.'),
  recipientName: z.string().trim().max(100).optional(),
  roleLabel: z.enum(['Member', 'Admin']).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Payload JSON tidak valid.' },
      { status: 400 }
    );
  }

  const parsed = SendAuthEmailRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Permintaan pengiriman email tidak valid.',
      },
      { status: 400 }
    );
  }

  const result = await sendAuthOtpEmail(parsed.data);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
