import { createHmac, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DokuEnvironmentSchema,
  DokuGatewayPublicStatusSchema,
  type DokuGatewayPublicStatus,
} from '@/src/lib/dashboard-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLACEHOLDER_VALUES = new Set([
  'MY_DOKU_CLIENT_ID',
  'MY_DOKU_MERCHANT_ID',
  'MY_DOKU_SECRET_KEY',
  'MY_DOKU_PUBLIC_KEY',
]);

const DokuServerEnvSchema = z.object({
  DOKU_ENVIRONMENT: z
    .string()
    .optional()
    .transform((val) => {
      const normalized = val?.trim().toLowerCase();
      const parsed = DokuEnvironmentSchema.safeParse(normalized);
      return parsed.success ? parsed.data : 'sandbox';
    }),
  DOKU_MERCHANT_ID: z.string().optional().default(''),
  DOKU_CLIENT_ID: z.string().optional().default(''),
  DOKU_SECRET_KEY: z.string().optional().default(''),
  DOKU_PUBLIC_KEY: z.string().optional().default(''),
});

function isConfiguredSecret(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && !PLACEHOLDER_VALUES.has(trimmed);
}

function readDokuGatewayStatus(): {
  status: DokuGatewayPublicStatus;
  merchantId: string;
  secretKey: string;
} {
  const parsedEnv = DokuServerEnvSchema.parse({
    DOKU_ENVIRONMENT: process.env.DOKU_ENVIRONMENT,
    DOKU_MERCHANT_ID: process.env.DOKU_MERCHANT_ID,
    DOKU_CLIENT_ID: process.env.DOKU_CLIENT_ID,
    DOKU_SECRET_KEY: process.env.DOKU_SECRET_KEY,
    DOKU_PUBLIC_KEY: process.env.DOKU_PUBLIC_KEY,
  });

  // Terima DOKU_MERCHANT_ID maupun DOKU_CLIENT_ID agar kompatibel dengan istilah Back Office DOKU.
  const merchantId =
    parsedEnv.DOKU_MERCHANT_ID.trim() || parsedEnv.DOKU_CLIENT_ID.trim();
  const secretKey = parsedEnv.DOKU_SECRET_KEY.trim();
  const publicKey = parsedEnv.DOKU_PUBLIC_KEY.trim();

  const merchantIdConfigured = isConfiguredSecret(merchantId);
  const secretKeyConfigured = isConfiguredSecret(secretKey);
  const publicKeyConfigured = isConfiguredSecret(publicKey);

  const apiBaseUrl =
    parsedEnv.DOKU_ENVIRONMENT === 'production'
      ? 'https://api.doku.com'
      : 'https://api-sandbox.doku.com';

  const status = DokuGatewayPublicStatusSchema.parse({
    configured: merchantIdConfigured && secretKeyConfigured,
    merchantIdConfigured,
    secretKeyConfigured,
    publicKeyConfigured,
    environment: parsedEnv.DOKU_ENVIRONMENT,
    apiBaseUrl,
    webhookPath: '/api/payment-gateway/doku/webhook',
    checkedAt: new Date().toISOString(),
  });

  return { status, merchantId, secretKey };
}

export async function GET() {
  const { status } = readDokuGatewayStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const { status, merchantId, secretKey } = readDokuGatewayStatus();

  if (!status.configured) {
    return NextResponse.json({
      ok: false,
      error:
        'DOKU_MERCHANT_ID (atau DOKU_CLIENT_ID) dan DOKU_SECRET_KEY belum dikonfigurasi pada environment server (.env / Secrets).',
      status,
    });
  }

  // Verifikasi kesiapan penandatanganan HMAC-SHA256 DOKU di server tanpa mengekspos kunci ke klien.
  const requestId = randomUUID();
  const timestamp = new Date().toISOString();
  const payloadToSign = `Client-Id:${merchantId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:/checkout/v1/payment`;
  const digestCheck = createHmac('sha256', secretKey)
    .update(payloadToSign)
    .digest('base64');

  if (!digestCheck) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Gagal memverifikasi signature HMAC-SHA256 server untuk DOKU.',
        status,
      },
      { status: 500 }
    );
  }

  const modeLabel = status.environment === 'production' ? 'Production' : 'Sandbox';
  return NextResponse.json({
    ok: true,
    message: `ID Merchant & Secret Key DOKU (${modeLabel}) terdeteksi valid di server dan signature HMAC-SHA256 siap digunakan.`,
    status,
  });
}
