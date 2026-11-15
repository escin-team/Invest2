import {
  SmtpSettingsSaveInputSchema,
  type SmtpEncryption,
  type SmtpProviderPreset,
  type SmtpSettingsPublic,
  type SmtpSettingsSaveInput,
} from './dashboard-schema';

export interface SmtpPresetConfig {
  id: SmtpProviderPreset;
  label: string;
  host: string;
  port: number;
  encryption: SmtpEncryption;
  note: string;
}

export const SMTP_PROVIDER_PRESETS: ReadonlyArray<SmtpPresetConfig> = [
  {
    id: 'gmail',
    label: 'Gmail SMTP',
    host: 'smtp.gmail.com',
    port: 587,
    encryption: 'starttls',
    note: 'Gunakan App Password Google (16 karakter) sebagai password SMTP.',
  },
  {
    id: 'brevo',
    label: 'Brevo (Sendinblue)',
    host: 'smtp-relay.brevo.com',
    port: 587,
    encryption: 'starttls',
    note: 'Gunakan SMTP Key dari dashboard Brevo Anda.',
  },
  {
    id: 'mailgun',
    label: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    encryption: 'starttls',
    note: 'Gunakan SMTP credential domain terverifikasi Mailgun.',
  },
  {
    id: 'resend',
    label: 'Resend SMTP',
    host: 'smtp.resend.com',
    port: 465,
    encryption: 'ssl',
    note: 'Username diisi "resend" dan Password diisi API Key Resend.',
  },
  {
    id: 'mailtrap',
    label: 'Mailtrap Sandbox',
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    encryption: 'starttls',
    note: 'Ideal untuk pengujian pengiriman email staging.',
  },
  {
    id: 'custom',
    label: 'Server SMTP Kustom',
    host: '',
    port: 587,
    encryption: 'starttls',
    note: 'Isi host, port, dan enkripsi sesuai penyedia email domain Anda.',
  },
];

export const DEFAULT_SMTP_PUBLIC_SETTINGS: SmtpSettingsPublic = {
  enabled: false,
  preset: 'custom',
  host: '',
  port: 587,
  encryption: 'starttls',
  username: '',
  hasPassword: false,
  fromName: 'Nature Republic Investasi',
  fromEmail: '',
  replyTo: '',
  configured: false,
  envConfigured: false,
  updatedAt: null,
};

export function maskEmailAddress(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) {
    return '***';
  }
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  const visiblePrefix = local.slice(0, Math.min(2, local.length));
  return `${visiblePrefix}***@${domain}`;
}

export function formatSmtpTimestamp(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function validateSmtpSavePayload(
  input: SmtpSettingsSaveInput,
  alreadyHasPassword: boolean
): { success: true; data: SmtpSettingsSaveInput } | { success: false; error: string } {
  const parsed = SmtpSettingsSaveInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Konfigurasi SMTP tidak valid.',
    };
  }

  const data = parsed.data;
  if (data.enabled) {
    if (!data.host.trim()) {
      return {
        success: false,
        error: 'Host SMTP wajib diisi saat pengiriman email SMTP diaktifkan.',
      };
    }
    if (!data.fromEmail.trim()) {
      return {
        success: false,
        error: 'Email Pengirim (From Email) wajib diisi saat SMTP diaktifkan.',
      };
    }
    const nextPasswordProvided = Boolean(data.password && data.password.trim().length > 0);
    if (data.username.trim().length > 0 && !nextPasswordProvided && (!alreadyHasPassword || data.clearPassword)) {
      return {
        success: false,
        error: 'Password / App Key SMTP wajib diisi jika Username autentikasi digunakan.',
      };
    }
  }

  return { success: true, data };
}

export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}
