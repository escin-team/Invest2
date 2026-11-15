import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuthOtpChallenge } from '@/src/lib/smtp-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VerifyOtpRequestSchema = z.object({
  purpose: z.enum(['register_otp', 'forgot_password']),
  email: z.string().trim().email('Alamat email tidak valid.'),
  code: z.string().trim().regex(/^\d{6}$/, 'Kode OTP harus berupa 6 digit angka.'),
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

  const parsed = VerifyOtpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Kode OTP harus 6 digit angka.',
      },
      { status: 400 }
    );
  }

  const verified = verifyAuthOtpChallenge(parsed.data);
  if (!verified.ok) {
    return NextResponse.json(
      { ok: false, error: verified.error ?? 'Kode OTP tidak cocok.' },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, error: null });
}
