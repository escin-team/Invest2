import { randomInt, randomUUID } from 'node:crypto';
import net from 'node:net';
import tls from 'node:tls';
import { z } from 'zod';
import {
  SmtpEncryptionSchema,
  SmtpProviderPresetSchema,
  SmtpSettingsPublicSchema,
  type SmtpEmailLog,
  type SmtpEmailPurpose,
  type SmtpEncryption,
  type SmtpProviderPreset,
  type SmtpSettingsPublic,
  type SmtpSettingsSaveInput,
} from './dashboard-schema';
import {
  formatSmtpTimestamp,
  maskEmailAddress,
  sanitizeHeaderValue,
  validateSmtpSavePayload,
} from './smtp-settings';

interface InternalSmtpConfig {
  enabled: boolean;
  preset: SmtpProviderPreset;
  host: string;
  port: number;
  encryption: SmtpEncryption;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  envConfigured: boolean;
  updatedAt: string | null;
}

interface OtpChallengeRecord {
  email: string;
  purpose: 'register_otp' | 'forgot_password';
  code: string;
  expiresAtMs: number;
  attempts: number;
}

interface GlobalSmtpRuntime {
  config: InternalSmtpConfig;
  logs: SmtpEmailLog[];
  otpStore: Map<string, OtpChallengeRecord>;
}

declare global {
  var __natureRepublicSmtpRuntime: GlobalSmtpRuntime | undefined;
}

const SmtpServerEnvSchema = z.object({
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.string().optional().default('587'),
  SMTP_ENCRYPTION: z.string().optional().default('starttls'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM_NAME: z.string().optional().default('Nature Republic Investasi'),
  SMTP_FROM_EMAIL: z.string().optional().default(''),
});

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_EMAIL_LOGS = 20;

function readInitialSmtpConfigFromEnv(): InternalSmtpConfig {
  const parsed = SmtpServerEnvSchema.parse({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_ENCRYPTION: process.env.SMTP_ENCRYPTION,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
  });

  const host = parsed.SMTP_HOST.trim();
  const parsedPort = Number.parseInt(parsed.SMTP_PORT.trim(), 10);
  const port = Number.isFinite(parsedPort) && parsedPort >= 1 && parsedPort <= 65535 ? parsedPort : 587;
  const encParsed = SmtpEncryptionSchema.safeParse(parsed.SMTP_ENCRYPTION.trim().toLowerCase());
  const encryption: SmtpEncryption = encParsed.success ? encParsed.data : 'starttls';
  const username = parsed.SMTP_USER.trim();
  const password = parsed.SMTP_PASS;
  const fromName = parsed.SMTP_FROM_NAME.trim() || 'Nature Republic Investasi';
  const fromEmail = parsed.SMTP_FROM_EMAIL.trim() || username;
  const envConfigured = Boolean(host && fromEmail);

  const guessedPreset: SmtpProviderPreset = host.includes('gmail.com')
    ? 'gmail'
    : host.includes('brevo')
      ? 'brevo'
      : host.includes('mailgun')
        ? 'mailgun'
        : host.includes('resend')
          ? 'resend'
          : host.includes('mailtrap')
            ? 'mailtrap'
            : 'custom';

  return {
    enabled: envConfigured,
    preset: SmtpProviderPresetSchema.parse(guessedPreset),
    host,
    port,
    encryption,
    username,
    password,
    fromName,
    fromEmail,
    replyTo: '',
    envConfigured,
    updatedAt: envConfigured ? formatSmtpTimestamp() : null,
  };
}

function getRuntime(): GlobalSmtpRuntime {
  if (!globalThis.__natureRepublicSmtpRuntime) {
    globalThis.__natureRepublicSmtpRuntime = {
      config: readInitialSmtpConfigFromEnv(),
      logs: [],
      otpStore: new Map<string, OtpChallengeRecord>(),
    };
  }
  return globalThis.__natureRepublicSmtpRuntime;
}

export function isSmtpReady(config: InternalSmtpConfig): boolean {
  if (!config.enabled) return false;
  if (!config.host.trim() || !config.fromEmail.trim()) return false;
  if (config.username.trim().length > 0 && config.password.length === 0) return false;
  return true;
}

export function getSmtpPublicStatus(): SmtpSettingsPublic {
  const { config } = getRuntime();
  return SmtpSettingsPublicSchema.parse({
    enabled: config.enabled,
    preset: config.preset,
    host: config.host,
    port: config.port,
    encryption: config.encryption,
    username: config.username,
    hasPassword: config.password.length > 0,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyTo: config.replyTo,
    configured: isSmtpReady(config),
    envConfigured: config.envConfigured,
    updatedAt: config.updatedAt,
  });
}

export function getSmtpEmailLogs(): SmtpEmailLog[] {
  return [...getRuntime().logs];
}

export function saveSmtpConfiguration(
  input: SmtpSettingsSaveInput
): { ok: true; status: SmtpSettingsPublic } | { ok: false; error: string } {
  const runtime = getRuntime();
  const alreadyHasPassword = runtime.config.password.length > 0;
  const validated = validateSmtpSavePayload(input, alreadyHasPassword);
  if (!validated.success) {
    return { ok: false, error: validated.error };
  }

  const data = validated.data;
  const nextPassword = data.clearPassword
    ? ''
    : data.password && data.password.length > 0
      ? data.password
      : runtime.config.password;

  runtime.config = {
    ...runtime.config,
    enabled: data.enabled,
    preset: data.preset,
    host: data.host.trim(),
    port: data.port,
    encryption: data.encryption,
    username: data.username.trim(),
    password: nextPassword,
    fromName: data.fromName.trim(),
    fromEmail: data.fromEmail.trim(),
    replyTo: data.replyTo.trim(),
    updatedAt: formatSmtpTimestamp(),
  };

  return { ok: true, status: getSmtpPublicStatus() };
}

export function resetSmtpConfigurationToEnv(): SmtpSettingsPublic {
  const runtime = getRuntime();
  runtime.config = readInitialSmtpConfigFromEnv();
  return getSmtpPublicStatus();
}

function appendEmailLog(entry: Omit<SmtpEmailLog, 'id' | 'sentAt'>): SmtpEmailLog {
  const runtime = getRuntime();
  const record: SmtpEmailLog = {
    id: `MAIL-${randomUUID().slice(0, 8).toUpperCase()}`,
    sentAt: formatSmtpTimestamp(),
    ...entry,
  };
  runtime.logs = [record, ...runtime.logs].slice(0, MAX_EMAIL_LOGS);
  return record;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildAuthEmailContent(params: {
  purpose: SmtpEmailPurpose;
  recipientName?: string;
  roleLabel?: string;
  otpCode?: string;
  fromName: string;
}): { subject: string; text: string; html: string } {
  const brand = sanitizeHeaderValue(params.fromName || 'Nature Republic Investasi');
  const displayName = escapeHtml((params.recipientName || 'Pengguna').trim());
  const roleLabel = escapeHtml((params.roleLabel || 'Member').trim());
  const code = params.otpCode ?? '000000';

  if (params.purpose === 'test') {
    const subject = `[${brand}] Uji Koneksi SMTP Berhasil`;
    const text = [
      `Halo ${params.recipientName || 'Admin'},`,
      '',
      `Ini adalah email pengujian dari Pengaturan SMTP ${brand}.`,
      'Jika Anda menerima email ini, konfigurasi SMTP server Anda telah berjalan dengan baik untuk pengiriman kode OTP Daftar & Lupa Password.',
      '',
      `Waktu kirim: ${formatSmtpTimestamp()}`,
    ].join('\n');
    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#faf5ff;border-radius:16px;border:1px solid #e9d5ff;color:#1e1b4b;">
        <div style="background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;padding:20px 24px;border-radius:12px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#fde68a;font-weight:700;">Nature Republic</p>
          <h1 style="margin:6px 0 0;font-size:20px;">Koneksi SMTP Aktif &amp; Siap</h1>
        </div>
        <div style="padding:20px 4px 4px;font-size:14px;line-height:1.6;">
          <p>Halo <strong>${displayName}</strong>,</p>
          <p>Email uji coba ini menandakan server SMTP dashboard admin <strong>${escapeHtml(brand)}</strong> berhasil terhubung dan siap mengirim email verifikasi pendaftaran maupun pemulihan kata sandi.</p>
          <p style="margin-top:16px;font-size:12px;color:#64748b;">Dikirim pada ${escapeHtml(formatSmtpTimestamp())}</p>
        </div>
      </div>
    `.trim();
    return { subject, text, html };
  }

  const isRegister = params.purpose === 'register_otp';
  const subject = isRegister
    ? `[${brand}] Kode Verifikasi Pendaftaran Akun`
    : `[${brand}] Kode Reset Password ${params.roleLabel || 'Akun'}`;

  const introText = isRegister
    ? `Terima kasih telah mendaftar di ${brand}. Gunakan kode OTP berikut untuk memverifikasi alamat email Anda:`
    : `Kami menerima permintaan untuk mengatur ulang kata sandi akun ${params.roleLabel || 'Member'} Anda. Gunakan kode OTP berikut untuk melanjutkan:`;

  const text = [
    `Halo ${params.recipientName || 'Pengguna'},`,
    '',
    introText,
    '',
    `KODE OTP: ${code}`,
    '',
    'Kode ini berlaku selama 10 menit dan bersifat rahasia. Jangan bagikan kepada siapa pun.',
  ].join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#faf5ff;border-radius:16px;border:1px solid #e9d5ff;color:#1e1b4b;">
      <div style="background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;padding:20px 24px;border-radius:12px;">
        <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#fde68a;font-weight:700;">Nature Republic · ${roleLabel}</p>
        <h1 style="margin:6px 0 0;font-size:20px;">${isRegister ? 'Verifikasi Email Pendaftaran' : 'Permintaan Reset Password'}</h1>
      </div>
      <div style="padding:20px 4px 4px;font-size:14px;line-height:1.6;">
        <p>Halo <strong>${displayName}</strong>,</p>
        <p>${escapeHtml(introText)}</p>
        <div style="margin:20px 0;padding:16px;text-align:center;background:#ffffff;border:2px dashed #a855f7;border-radius:12px;">
          <span style="font-family:Consolas,monospace;font-size:30px;font-weight:800;letter-spacing:8px;color:#581c87;">${escapeHtml(code)}</span>
        </div>
        <p style="font-size:12px;color:#64748b;">Kode berlaku 10 menit. Abaikan email ini jika Anda tidak merasa melakukan permintaan tersebut.</p>
      </div>
    </div>
  `.trim();

  return { subject, text, html };
}

function encodeMimeSubject(subject: string): string {
  const clean = sanitizeHeaderValue(subject);
  if (/^[\x20-\x7E]*$/.test(clean)) return clean;
  return `=?UTF-8?B?${Buffer.from(clean, 'utf8').toString('base64')}?=`;
}

function formatMimeMessage(params: {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}): string {
  const boundary = `nr_${randomUUID().replace(/-/g, '')}`;
  const cleanFromName = sanitizeHeaderValue(params.fromName);
  const cleanFromEmail = sanitizeHeaderValue(params.fromEmail);
  const cleanTo = sanitizeHeaderValue(params.toEmail);
  const cleanReplyTo = params.replyTo ? sanitizeHeaderValue(params.replyTo) : '';

  const headers = [
    `From: "${cleanFromName.replace(/"/g, '')}" <${cleanFromEmail}>`,
    `To: <${cleanTo}>`,
    ...(cleanReplyTo ? [`Reply-To: <${cleanReplyTo}>`] : []),
    `Subject: ${encodeMimeSubject(params.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@${cleanFromEmail.split('@')[1] || 'naturerepublic.local'}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  const body = [
    ...headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(params.text, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(params.html, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'),
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return body
    .split(/\r?\n/)
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n');
}

interface SmtpResponse {
  code: number;
  lines: string[];
}

async function sendViaRawSmtpSocket(params: {
  config: InternalSmtpConfig;
  toEmail: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const { config, toEmail, subject, text, html } = params;
  const timeoutMs = 15_000;

  let socket: net.Socket | tls.TLSSocket =
    config.encryption === 'ssl'
      ? tls.connect({
          host: config.host,
          port: config.port,
          servername: config.host,
          timeout: timeoutMs,
        })
      : net.createConnection({
          host: config.host,
          port: config.port,
          timeout: timeoutMs,
        });

  let buffer = '';
  let currentResolve: ((res: SmtpResponse) => void) | null = null;
  let currentReject: ((err: Error) => void) | null = null;

  const attachListeners = (sock: net.Socket | tls.TLSSocket) => {
    sock.setEncoding('utf8');
    sock.setTimeout(timeoutMs);

    const onData = (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      const collected: string[] = [];
      for (const line of lines) {
        if (!line) continue;
        collected.push(line);
        const match = /^(\d{3})([ -])(.*)$/.exec(line);
        if (match && match[2] === ' ') {
          const code = Number.parseInt(match[1], 10);
          const resolver = currentResolve;
          currentResolve = null;
          currentReject = null;
          resolver?.({ code, lines: [...collected] });
          return;
        }
      }
    };

    const onError = (err: Error) => {
      const rejecter = currentReject;
      currentResolve = null;
      currentReject = null;
      rejecter?.(err);
    };

    const onTimeout = () => {
      onError(new Error('Koneksi SMTP timeout saat menunggu respons server.'));
    };

    sock.on('data', onData);
    sock.on('error', onError);
    sock.on('timeout', onTimeout);
  };

  const readResponse = (): Promise<SmtpResponse> =>
    new Promise((resolve, reject) => {
      currentResolve = resolve;
      currentReject = reject;
    });

  const sendCommand = async (cmd: string, expectedCodes: number[]): Promise<SmtpResponse> => {
    const responsePromise = readResponse();
    socket.write(`${cmd}\r\n`);
    const res = await responsePromise;
    if (!expectedCodes.includes(res.code)) {
      throw new Error(`SMTP error (${res.code}): ${res.lines[res.lines.length - 1] ?? 'Unknown'}`);
    }
    return res;
  };

  try {
    attachListeners(socket);
    const greeting = await readResponse();
    if (greeting.code !== 220) {
      throw new Error(`Greeting SMTP tidak valid (${greeting.code}).`);
    }

    const ehloDomain = sanitizeHeaderValue(config.fromEmail.split('@')[1] || 'localhost');
    await sendCommand(`EHLO ${ehloDomain}`, [250]);

    if (config.encryption === 'starttls') {
      await sendCommand('STARTTLS', [220]);
      const plainSocket = socket;
      plainSocket.removeAllListeners('data');
      plainSocket.removeAllListeners('error');
      plainSocket.removeAllListeners('timeout');
      buffer = '';

      socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
        const tlsSock = tls.connect(
          {
            socket: plainSocket,
            servername: config.host,
            timeout: timeoutMs,
          },
          () => resolve(tlsSock)
        );
        tlsSock.once('error', reject);
      });
      attachListeners(socket);
      await sendCommand(`EHLO ${ehloDomain}`, [250]);
    }

    if (config.username.trim().length > 0) {
      await sendCommand('AUTH LOGIN', [334]);
      await sendCommand(Buffer.from(config.username, 'utf8').toString('base64'), [334]);
      await sendCommand(Buffer.from(config.password, 'utf8').toString('base64'), [235]);
    }

    const cleanFrom = sanitizeHeaderValue(config.fromEmail);
    const cleanTo = sanitizeHeaderValue(toEmail);
    await sendCommand(`MAIL FROM:<${cleanFrom}>`, [250]);
    await sendCommand(`RCPT TO:<${cleanTo}>`, [250, 251]);
    await sendCommand('DATA', [354]);

    const mimeBody = formatMimeMessage({
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      toEmail,
      replyTo: config.replyTo || undefined,
      subject,
      text,
      html,
    });
    const dataPromise = readResponse();
    socket.write(`${mimeBody}\r\n.\r\n`);
    const dataRes = await dataPromise;
    if (dataRes.code !== 250) {
      throw new Error(`SMTP menolak isi email (${dataRes.code}).`);
    }

    await sendCommand('QUIT', [221]).catch(() => undefined);
  } finally {
    socket.destroy();
  }
}

export async function dispatchSmtpTestEmail(recipientEmail: string): Promise<{
  ok: boolean;
  message: string;
  status: SmtpSettingsPublic;
  logs: SmtpEmailLog[];
}> {
  const runtime = getRuntime();
  const status = getSmtpPublicStatus();
  const maskedRecipient = maskEmailAddress(recipientEmail);
  const content = buildAuthEmailContent({
    purpose: 'test',
    recipientName: 'Admin Nature Republic',
    fromName: runtime.config.fromName,
  });

  if (!isSmtpReady(runtime.config)) {
    const errMsg = !runtime.config.enabled
      ? 'Aktifkan status SMTP terlebih dahulu sebelum mengirim email tes.'
      : 'Host SMTP, Email Pengirim, atau kredensial autentikasi SMTP belum lengkap.';
    appendEmailLog({
      purpose: 'test',
      maskedRecipient,
      subject: content.subject,
      mode: 'smtp',
      status: 'gagal',
      errorMessage: errMsg,
    });
    return {
      ok: false,
      message: errMsg,
      status,
      logs: getSmtpEmailLogs(),
    };
  }

  try {
    await sendViaRawSmtpSocket({
      config: runtime.config,
      toEmail: recipientEmail,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    appendEmailLog({
      purpose: 'test',
      maskedRecipient,
      subject: content.subject,
      mode: 'smtp',
      status: 'terkirim',
      errorMessage: null,
    });
    return {
      ok: true,
      message: `Email tes berhasil dikirim ke ${maskedRecipient} via ${runtime.config.host}.`,
      status,
      logs: getSmtpEmailLogs(),
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Gagal mengirim email melalui server SMTP.';
    appendEmailLog({
      purpose: 'test',
      maskedRecipient,
      subject: content.subject,
      mode: 'smtp',
      status: 'gagal',
      errorMessage: errMsg,
    });
    return {
      ok: false,
      message: errMsg,
      status,
      logs: getSmtpEmailLogs(),
    };
  }
}

function buildOtpKey(email: string, purpose: 'register_otp' | 'forgot_password'): string {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

export async function sendAuthOtpEmail(params: {
  purpose: 'register_otp' | 'forgot_password';
  email: string;
  recipientName?: string;
  roleLabel?: string;
}): Promise<{
  ok: boolean;
  mode: 'smtp' | 'simulation';
  message: string;
  previewCode?: string;
  expiresInMinutes: number;
}> {
  const runtime = getRuntime();
  const normalizedEmail = params.email.trim().toLowerCase();
  const maskedRecipient = maskEmailAddress(normalizedEmail);
  const otpCode = String(randomInt(100000, 1000000));

  runtime.otpStore.set(buildOtpKey(normalizedEmail, params.purpose), {
    email: normalizedEmail,
    purpose: params.purpose,
    code: otpCode,
    expiresAtMs: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  const content = buildAuthEmailContent({
    purpose: params.purpose,
    recipientName: params.recipientName,
    roleLabel: params.roleLabel,
    otpCode,
    fromName: runtime.config.fromName,
  });

  if (isSmtpReady(runtime.config)) {
    try {
      await sendViaRawSmtpSocket({
        config: runtime.config,
        toEmail: normalizedEmail,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
      appendEmailLog({
        purpose: params.purpose,
        maskedRecipient,
        subject: content.subject,
        mode: 'smtp',
        status: 'terkirim',
        errorMessage: null,
      });
      return {
        ok: true,
        mode: 'smtp',
        message: `Kode OTP 6 digit telah dikirim melalui SMTP ke ${maskedRecipient}.`,
        expiresInMinutes: 10,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'SMTP gagal mengirim email.';
      appendEmailLog({
        purpose: params.purpose,
        maskedRecipient,
        subject: content.subject,
        mode: 'smtp',
        status: 'gagal',
        errorMessage: errMsg,
      });
      return {
        ok: false,
        mode: 'smtp',
        message: `Pengiriman SMTP gagal: ${errMsg}`,
        expiresInMinutes: 10,
      };
    }
  }

  appendEmailLog({
    purpose: params.purpose,
    maskedRecipient,
    subject: content.subject,
    mode: 'simulation',
    status: 'simulasi',
    errorMessage: null,
  });

  return {
    ok: true,
    mode: 'simulation',
    message: `SMTP admin belum aktif — kode verifikasi simulasi dibuat untuk ${maskedRecipient}. Aktifkan SMTP di Dashboard Admin untuk pengiriman email nyata.`,
    previewCode: otpCode,
    expiresInMinutes: 10,
  };
}

export function verifyAuthOtpChallenge(params: {
  purpose: 'register_otp' | 'forgot_password';
  email: string;
  code: string;
}): { ok: boolean; error: string | null } {
  const runtime = getRuntime();
  const key = buildOtpKey(params.email, params.purpose);
  const record = runtime.otpStore.get(key);

  if (!record) {
    return {
      ok: false,
      error: 'Kode OTP belum diminta atau sudah kedaluwarsa. Silakan kirim ulang kode.',
    };
  }

  if (Date.now() > record.expiresAtMs) {
    runtime.otpStore.delete(key);
    return {
      ok: false,
      error: 'Kode OTP telah kedaluwarsa (batas 10 menit). Silakan minta kode baru.',
    };
  }

  const normalizedCode = params.code.trim();
  if (normalizedCode !== record.code) {
    const nextAttempts = record.attempts + 1;
    if (nextAttempts >= MAX_OTP_ATTEMPTS) {
      runtime.otpStore.delete(key);
      return {
        ok: false,
        error: 'Terlalu banyak percobaan OTP salah. Silakan kirim ulang kode baru.',
      };
    }
    runtime.otpStore.set(key, { ...record, attempts: nextAttempts });
    return {
      ok: false,
      error: `Kode OTP tidak sesuai (sisa ${MAX_OTP_ATTEMPTS - nextAttempts} percobaan).`,
    };
  }

  runtime.otpStore.delete(key);
  return { ok: true, error: null };
}
