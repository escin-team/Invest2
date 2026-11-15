import { NextRequest, NextResponse } from 'next/server';
import {
  getSmtpEmailLogs,
  getSmtpPublicStatus,
  resetSmtpConfigurationToEnv,
  saveSmtpConfiguration,
} from '@/src/lib/smtp-server';
import { SmtpSettingsSaveInputSchema } from '@/src/lib/dashboard-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: getSmtpPublicStatus(),
    logs: getSmtpEmailLogs(),
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Body JSON permintaan tidak valid.' },
      { status: 400 }
    );
  }

  const parsed = SmtpSettingsSaveInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Payload konfigurasi SMTP tidak valid.',
      },
      { status: 400 }
    );
  }

  const saved = saveSmtpConfiguration(parsed.data);
  if (!saved.ok) {
    return NextResponse.json({ ok: false, error: saved.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    status: saved.status,
    logs: getSmtpEmailLogs(),
    message: 'Pengaturan SMTP berhasil disimpan di server.',
  });
}

export async function DELETE() {
  const status = resetSmtpConfigurationToEnv();
  return NextResponse.json({
    ok: true,
    status,
    logs: getSmtpEmailLogs(),
    message: 'Pengaturan SMTP dikembalikan ke default environment server.',
  });
}
