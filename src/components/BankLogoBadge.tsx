'use client';

import { Logo } from 'idn-finlogos/react';
import {
  CreditCard,
  Landmark,
  QrCode,
  Smartphone,
  Store,
  Wallet,
} from 'lucide-react';
import {
  resolveIndonesianBankSlug,
  resolvePaymentChannelSlugs,
} from '@/src/lib/bank-logos';
import type { PaymentMethodCategory } from '@/src/lib/dashboard-schema';
import { cn } from '@/src/lib/utils';

interface BankLogoBadgeProps {
  bankOrChannelName: string;
  slugsOverride?: ReadonlyArray<string>;
  fallbackCategory?: PaymentMethodCategory;
  size?: 'sm' | 'md';
  className?: string;
}

function CategoryFallbackIcon({
  category,
  className,
}: {
  category?: PaymentMethodCategory;
  className: string;
}) {
  switch (category) {
    case 'qris':
      return <QrCode className={className} aria-hidden="true" />;
    case 'virtual_account':
      return <Wallet className={className} aria-hidden="true" />;
    case 'ewallet':
      return <Smartphone className={className} aria-hidden="true" />;
    case 'credit_card':
      return <CreditCard className={className} aria-hidden="true" />;
    case 'retail_outlet':
      return <Store className={className} aria-hidden="true" />;
    default:
      return <Landmark className={className} aria-hidden="true" />;
  }
}

export function BankLogoBadge({
  bankOrChannelName,
  slugsOverride,
  fallbackCategory,
  size = 'md',
  className,
}: BankLogoBadgeProps) {
  const resolvedSlugs = slugsOverride?.length
    ? [...slugsOverride]
    : resolvePaymentChannelSlugs(bankOrChannelName);

  const singleResolved =
    resolvedSlugs.length > 0
      ? resolvedSlugs
      : (() => {
          const slug = resolveIndonesianBankSlug(bankOrChannelName);
          return slug ? [slug] : [];
        })();

  if (singleResolved.length === 0) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
          size === 'sm' ? 'h-8 w-11' : 'h-10 w-14',
          className
        )}
      >
        <CategoryFallbackIcon
          category={fallbackCategory}
          className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}
        />
      </div>
    );
  }

  if (singleResolved.length > 1) {
    return (
      <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5', className)}>
        {singleResolved.map((slug) => (
          <div
            key={slug}
            className={cn(
              'flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700',
              size === 'sm' ? 'h-7 w-11' : 'h-9 w-12'
            )}
          >
            <Logo
              slug={slug}
              title={slug.toUpperCase()}
              className="flex h-full w-full items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-auto"
            />
          </div>
        ))}
      </div>
    );
  }

  const slug = singleResolved[0];
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700',
        size === 'sm' ? 'h-8 w-12' : 'h-10 w-14',
        className
      )}
    >
      <Logo
        slug={slug}
        title={bankOrChannelName || slug.toUpperCase()}
        className="flex h-full w-full items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-auto"
      />
    </div>
  );
}
