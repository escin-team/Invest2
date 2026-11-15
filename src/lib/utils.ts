import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  const abs = Math.abs(Math.round(value));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return value < 0 ? `−${formatted}` : formatted;
}

export function formatRupiah(value: number): string {
  const abs = Math.abs(Math.round(value));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return value < 0 ? `−Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatSignedRupiah(value: number): string {
  if (value > 0) {
    return `+${formatRupiah(value)}`;
  }
  return formatRupiah(value);
}

export function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${Math.round(abs / 1_000_000)} Jt`;
  }
  return formatRupiah(value);
}

export function formatProductCommission(value: number, type: 'percent' | 'idr'): string {
  if (type === 'idr') {
    return formatRupiah(value);
  }
  return value % 1 === 0 ? `${value}%` : `${value.toFixed(1)}%`;
}

export function formatProductStock(value: number, mode: 'limited' | 'unlimited'): string {
  if (mode === 'unlimited') {
    return 'Unlimited';
  }
  return formatNumber(value);
}

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateProductImageFile(file: {
  type: string;
  size: number;
}): { valid: true } | { valid: false; error: string } {
  if (!file.type || !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Format file harus berupa gambar dari galeri (JPG, PNG, WebP, atau GIF).',
    };
  }
  if (file.size <= 0) {
    return {
      valid: false,
      error: 'File gambar kosong atau tidak valid.',
    };
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran foto maksimal 5 MB.',
    };
  }
  return { valid: true };
}

