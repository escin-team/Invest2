'use client';

import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { CashflowChart } from '@/src/components/CashflowChart';
import { TIME_RANGE_OPTIONS } from '@/src/lib/dashboard-data';
import type { DashboardSnapshot, TimeRange } from '@/src/lib/dashboard-schema';
import { cn, formatNumber, formatRupiah, formatSignedRupiah } from '@/src/lib/utils';

export type AdminSection =
  | 'ringkasan'
  | 'antrean'
  | 'withdrawal_publication'
  | 'investment'
  | 'produk'
  | 'category'
  | 'cashback'
  | 'vouchers'
  | 'iklan'
  | 'pengumuman'
  | 'komisi_produk'
  | 'user'
  | 'level_user'
  | 'kelola_admin'
  | 'server_control'
  | 'pengaturan_perusahaan'
  | 'pengaturan_bank'
  | 'pengaturan_smtp';

interface RingkasanViewProps {
  snapshot: DashboardSnapshot;
  selectedRange: TimeRange;
  onSelectRange: (range: TimeRange) => void;
  onNavigateSection: (section: AdminSection, subFilter?: string) => void;
}

export function RingkasanView({
  snapshot,
  selectedRange,
  onSelectRange,
  onNavigateSection,
}: RingkasanViewProps) {
  const [conditionFilter, setConditionFilter] = useState<'semua' | 'inti' | 'tambahan'>('semua');
  const { cashflow, activeBreakdown, operational, lifetime } = snapshot;

  const maxConditionCount = Math.max(
    1,
    ...activeBreakdown.conditions.map((c) => c.count)
  );
  const coreConditions = activeBreakdown.conditions.filter((c) => c.type === 'inti');
  const additionalConditions = activeBreakdown.conditions.filter((c) => c.type === 'tambahan');

  const totalUserSegments = Math.max(
    1,
    activeBreakdown.coreTotal +
      activeBreakdown.passiveCount +
      activeBreakdown.notStartedCount
  );
  const activeSharePct = (activeBreakdown.coreTotal / totalUserSegments) * 100;
  const passiveSharePct = (activeBreakdown.passiveCount / totalUserSegments) * 100;
  const notStartedSharePct = (activeBreakdown.notStartedCount / totalUserSegments) * 100;

  const lifetimeBase = Math.max(1, lifetime.totalApprovedTopUp);
  const withdrawalRatioPct = (lifetime.totalApprovedWithdrawal / lifetimeBase) * 100;
  const claimsRatioPct = (lifetime.totalClaimsPaid / lifetimeBase) * 100;
  const yieldRatioPct = (lifetime.remainingEstimatedYield / lifetimeBase) * 100;
  const lifetimeNetCashflow = lifetime.totalApprovedTopUp - lifetime.totalApprovedWithdrawal;
  const formatPct = (val: number) => `${val.toFixed(1).replace('.', ',')}%`;

  return (
    <div className="space-y-6">
      {/* Header + Time Range Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Ringkasan
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {snapshot.rangeDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Filter By :
          </span>
          <div
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
            role="group"
            aria-label="Filter rentang waktu dashboard"
          >
            {TIME_RANGE_OPTIONS.map((opt) => {
              const active = selectedRange === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectRange(opt.value)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600/40',
                    active
                      ? 'bg-purple-700 text-white dark:bg-purple-600 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              User Aktif
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 xl:text-[24px] whitespace-nowrap"
              data-testid="kpi-active-users"
            >
              {formatNumber(snapshot.activeUsers)}
            </p>
            <p className="mt-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
              <span>{snapshot.rangeLabel} terakhir</span>
              <span aria-hidden="true"> · </span>
              <a
                href="#syarat-user-aktif"
                className="font-medium text-purple-700 underline-offset-2 hover:underline dark:text-purple-400 whitespace-nowrap"
              >
                lihat rinciannya di bawah
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total User
            </p>
            <p
              className="mt-2 font-mono-num text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 xl:text-[24px] whitespace-nowrap"
              data-testid="kpi-total-users"
            >
              {formatNumber(snapshot.totalUsers)}
            </p>
            <p className="mt-2 text-xs leading-snug text-emerald-700 dark:text-emerald-400 font-medium">
              +{formatNumber(snapshot.newUsers30d)} user baru dalam 30 hari
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Saldo Deposit
            </p>
            <p
              className="mt-2 font-mono-num text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 xl:text-[21px] whitespace-nowrap"
              data-testid="kpi-deposit-balance"
            >
              {formatRupiah(snapshot.totalDepositBalance)}
            </p>
            <p className="mt-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
              Uang user yang tersimpan di platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Saldo Bisa Ditarik
            </p>
            <p
              className="mt-2 font-mono-num text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 xl:text-[21px] whitespace-nowrap"
              data-testid="kpi-withdrawable-balance"
            >
              {formatRupiah(snapshot.totalWithdrawableBalance)}
            </p>
            <p className="mt-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
              Kewajiban yang bisa ditarik user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Focal Anchor: Top Up vs Withdrawal Chart */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Top Up vs Withdrawal</CardTitle>
              <CardDescription className="mt-0.5">
                Pemasukan dan pengeluaran harian, hanya transaksi yang sudah disetujui.
              </CardDescription>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Rentang {snapshot.rangeLabel} terakhir
            </span>
          </div>

          {/* 5 Cashflow Summary Metrics inline separated by subtle hairline dividers */}
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800/80 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Top Up</p>
              <p
                className="mt-1 font-mono-num text-base font-semibold text-emerald-700 dark:text-emerald-400"
                data-testid="cashflow-topup-total"
              >
                {formatRupiah(cashflow.topUpTotal)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Withdrawal</p>
              <p
                className="mt-1 font-mono-num text-base font-semibold text-rose-700 dark:text-rose-400"
                data-testid="cashflow-withdrawal-total"
              >
                {formatRupiah(cashflow.withdrawalTotal)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Selisih</p>
              <p
                className={cn(
                  'mt-1 inline-flex items-center gap-1 font-mono-num text-base font-semibold',
                  cashflow.difference >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                )}
                data-testid="cashflow-difference"
              >
                {cashflow.difference >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>{formatSignedRupiah(cashflow.difference)}</span>
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Top up tertinggi</p>
              <p className="mt-1 font-mono-num text-base font-semibold text-slate-900 dark:text-slate-100">
                {formatRupiah(cashflow.peakTopUpAmount)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cashflow.peakTopUpDate}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Withdrawal tertinggi</p>
              <p className="mt-1 font-mono-num text-base font-semibold text-slate-900 dark:text-slate-100">
                {formatRupiah(cashflow.peakWithdrawalAmount)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cashflow.peakWithdrawalDate}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <CashflowChart
            series={cashflow.series}
            peakTopUpDate={cashflow.peakTopUpDate}
            peakWithdrawalDate={cashflow.peakWithdrawalDate}
          />
        </CardContent>
      </Card>

      {/* Analytical Breakdown + Operational Queue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Syarat user aktif */}
        <Card id="syarat-user-aktif" className="lg:col-span-7">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">Syarat user aktif</CardTitle>
                <CardDescription className="leading-relaxed">
                  Seorang user dihitung aktif kalau memenuhi minimal satu syarat inti di bawah. Angka tiap baris adalah jumlah user yang memenuhi syarat itu saja, jadi bisa saling tumpang tindih.
                </CardDescription>
              </div>
              <div
                className="inline-flex items-center self-start rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950 shrink-0"
                role="group"
                aria-label="Filter tipe syarat user aktif"
              >
                {(
                  [
                    { id: 'semua', label: 'Semua' },
                    { id: 'inti', label: 'Inti' },
                    { id: 'tambahan', label: 'Tambahan' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setConditionFilter(tab.id)}
                    aria-pressed={conditionFilter === tab.id}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                      conditionFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {(conditionFilter === 'semua' || conditionFilter === 'inti') && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-2 text-xs font-medium text-slate-600 dark:border-slate-800/80 dark:bg-slate-950/40 dark:text-slate-300 sm:px-6">
                  <span>Syarat inti (penentu user aktif)</span>
                  <span className="font-mono-num text-slate-500 dark:text-slate-400">
                    3 kriteria
                  </span>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {coreConditions.map((cond) => {
                    const widthPct = Math.max(4, Math.round((cond.count / maxConditionCount) * 100));
                    const shareOfTotal = formatPct((cond.count / snapshot.totalUsers) * 100);
                    return (
                      <li key={cond.id} className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-baseline justify-between gap-4">
                          <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {cond.title}
                            </span>
                            <span className="rounded-sm bg-purple-50 px-1.5 py-0.5 text-[11px] font-medium text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">
                              {cond.type}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2.5 shrink-0">
                            <span className="font-mono-num text-xs text-slate-400 dark:text-slate-500">
                              {shareOfTotal}
                            </span>
                            <span className="font-mono-num min-w-[2.75rem] text-right text-base font-bold text-slate-900 dark:text-slate-100">
                              {formatNumber(cond.count)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {cond.description}
                        </p>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-xs bg-purple-600 transition-all duration-300 dark:bg-purple-500"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {(conditionFilter === 'semua' || conditionFilter === 'tambahan') && (
              <div
                className={cn(
                  conditionFilter === 'semua' &&
                    'border-t border-slate-200 dark:border-slate-800'
                )}
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-2 text-xs font-medium text-slate-600 dark:border-slate-800/80 dark:bg-slate-950/40 dark:text-slate-300 sm:px-6">
                  <span>Sinyal tambahan (aktivitas pendukung)</span>
                  <span className="font-mono-num text-slate-500 dark:text-slate-400">
                    3 kriteria
                  </span>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {additionalConditions.map((cond) => {
                    const widthPct = Math.max(4, Math.round((cond.count / maxConditionCount) * 100));
                    const shareOfTotal = formatPct((cond.count / snapshot.totalUsers) * 100);
                    return (
                      <li key={cond.id} className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-baseline justify-between gap-4">
                          <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {cond.title}
                            </span>
                            <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {cond.type}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2.5 shrink-0">
                            <span className="font-mono-num text-xs text-slate-400 dark:text-slate-500">
                              {shareOfTotal}
                            </span>
                            <span className="font-mono-num min-w-[2.75rem] text-right text-base font-bold text-slate-900 dark:text-slate-100">
                              {formatNumber(cond.count)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {cond.description}
                        </p>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-xs bg-teal-600 transition-all duration-300 dark:bg-teal-500"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Core vs Additional Summary Footer */}
            <div className="border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-slate-800 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
                <div className="px-5 py-4 sm:px-6">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    User aktif (inti)
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className="font-mono-num text-2xl font-bold text-purple-700 dark:text-purple-400"
                      data-testid="active-core-total"
                    >
                      {formatNumber(activeBreakdown.coreTotal)}
                    </span>
                    <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      ({formatPct((activeBreakdown.coreTotal / snapshot.totalUsers) * 100)} dari total user)
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4 sm:px-6">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Gabungan dengan sinyal tambahan
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatNumber(activeBreakdown.withAdditionalTotal)}
                    </span>
                    <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      (+{formatNumber(activeBreakdown.withAdditionalTotal - activeBreakdown.coreTotal)} user tambahan)
                    </span>
                  </div>
                </div>
              </div>
              <p className="border-t border-slate-200/80 px-5 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800/80 dark:text-slate-400 sm:px-6">
                Gabungan syarat inti, dihitung unik per user: produk berjalan, beli produk, atau klaim produk dalam {snapshot.rangeLabel} terakhir. Kalau sinyal tambahan ikut dihitung, totalnya{' '}
                <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-200">
                  {formatNumber(activeBreakdown.withAdditionalTotal)} user
                </span>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Di luar kriteria aktif + Operational Cards */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Di luar kriteria aktif</CardTitle>
                <button
                  type="button"
                  onClick={() => onNavigateSection('user')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline dark:text-purple-400 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Lihat user</span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Composition Bar */}
              <div className="space-y-2">
                <div
                  className="flex h-2.5 w-full overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800"
                  role="img"
                  aria-label={`Komposisi user: ${activeBreakdown.coreTotal} aktif, ${activeBreakdown.passiveCount} pasif, ${activeBreakdown.notStartedCount} belum mulai`}
                >
                  <div
                    className="bg-purple-600 dark:bg-purple-500"
                    style={{ width: `${activeSharePct}%` }}
                  />
                  <div
                    className="bg-amber-500 dark:bg-amber-400"
                    style={{ width: `${Math.max(1, passiveSharePct)}%` }}
                  />
                  <div
                    className="bg-slate-300 dark:bg-slate-600"
                    style={{ width: `${notStartedSharePct}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs bg-purple-600" aria-hidden="true" />
                    Aktif ({formatNumber(activeBreakdown.coreTotal)})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs bg-amber-500" aria-hidden="true" />
                    Pasif ({formatNumber(activeBreakdown.passiveCount)})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-xs bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
                    Belum mulai ({formatNumber(activeBreakdown.notStartedCount)})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-4 dark:divide-slate-800 dark:border-slate-800">
                <div className="pr-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Pasif
                  </p>
                  <p
                    className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
                    data-testid="outside-passive-count"
                  >
                    {formatNumber(activeBreakdown.passiveCount)}
                  </p>
                </div>
                <div className="pl-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Belum mulai
                  </p>
                  <p
                    className="mt-1 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
                    data-testid="outside-not-started-count"
                  >
                    {formatNumber(activeBreakdown.notStartedCount)}
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Pasif: pernah top up atau pernah investasi, tapi tidak lagi memenuhi satu pun syarat inti. Belum mulai: belum pernah top up dan belum pernah investasi.
              </p>
            </CardContent>
          </Card>

          {/* 4 Operational Queue & Product Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Top Up Menunggu
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('antrean', 'topup')}
                    className="text-xs font-medium text-purple-700 hover:underline dark:text-purple-400 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Proses
                  </button>
                </div>
                <p
                  className="mt-2 font-mono-num text-2xl font-bold text-amber-700 dark:text-amber-400"
                  data-testid="op-pending-topup-count"
                >
                  {formatNumber(operational.pendingTopUpCount)}
                </p>
                <p className="mt-1 font-mono-num text-xs text-slate-600 dark:text-slate-300">
                  {formatRupiah(operational.pendingTopUpAmount)}{' '}
                  <span className="font-sans text-slate-500 dark:text-slate-400">
                    menunggu persetujuan
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Withdrawal Menunggu
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('antrean', 'withdrawal')}
                    className="text-xs font-medium text-purple-700 hover:underline dark:text-purple-400 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Proses
                  </button>
                </div>
                <p
                  className="mt-2 font-mono-num text-2xl font-bold text-amber-700 dark:text-amber-400"
                  data-testid="op-pending-withdrawal-count"
                >
                  {formatNumber(operational.pendingWithdrawalCount)}
                </p>
                <p className="mt-1 font-mono-num text-xs text-slate-600 dark:text-slate-300">
                  {formatRupiah(operational.pendingWithdrawalAmount)}{' '}
                  <span className="font-sans text-slate-500 dark:text-slate-400">
                    menunggu diproses
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Produk Berjalan
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('produk')}
                    className="text-xs font-medium text-purple-700 hover:underline dark:text-purple-400 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Detail
                  </button>
                </div>
                <p
                  className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
                  data-testid="op-running-products-count"
                >
                  {formatNumber(operational.runningProductsCount)}
                </p>
                <p className="mt-1 font-mono-num text-xs text-slate-600 dark:text-slate-300">
                  {formatRupiah(operational.runningProductsCapital)}{' '}
                  <span className="font-sans text-slate-500 dark:text-slate-400">
                    total modal masuk
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Produk Aktif
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateSection('produk')}
                    className="text-xs font-medium text-purple-700 hover:underline dark:text-purple-400 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Katalog
                  </button>
                </div>
                <p
                  className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100"
                  data-testid="op-active-products-count"
                >
                  {formatNumber(operational.activeProductsCount)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  dari {formatNumber(operational.totalCatalogProducts)} produk di katalog
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Section: Angka seumur hidup */}
      <Card>
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/40">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Angka seumur hidup</CardTitle>
              <CardDescription className="mt-0.5">
                Tidak terpengaruh pilihan rentang di atas.
              </CardDescription>
            </div>
            <div className="flex items-baseline gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Selisih Top Up − Withdrawal:
              </span>
              <span className="font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                {formatSignedRupiah(lifetimeNetCashflow)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800/80 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
            <div className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Total Top Up Disetujui
                  </p>
                  <span className="font-mono-num text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    100%
                  </span>
                </div>
                <p
                  className="mt-2 font-mono-num text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 xl:text-[22px] whitespace-nowrap"
                  data-testid="lifetime-topup"
                >
                  {formatRupiah(lifetime.totalApprovedTopUp)}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-full rounded-xs bg-emerald-600 dark:bg-emerald-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Akumulasi dana masuk platform
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Total Withdrawal Disetujui
                  </p>
                  <span className="font-mono-num text-[11px] font-medium text-rose-700 dark:text-rose-400">
                    {formatPct(withdrawalRatioPct)}
                  </span>
                </div>
                <p
                  className="mt-2 font-mono-num text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 xl:text-[22px] whitespace-nowrap"
                  data-testid="lifetime-withdrawal"
                >
                  {formatRupiah(lifetime.totalApprovedWithdrawal)}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-xs bg-rose-600 dark:bg-rose-500"
                    style={{ width: `${Math.min(100, withdrawalRatioPct)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatPct(withdrawalRatioPct)} dari total top up disetujui
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Total Klaim Dibayarkan
                  </p>
                  <span className="font-mono-num text-[11px] font-medium text-purple-700 dark:text-purple-400">
                    {formatPct(claimsRatioPct)}
                  </span>
                </div>
                <p
                  className="mt-2 font-mono-num text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 xl:text-[22px] whitespace-nowrap"
                  data-testid="lifetime-claims"
                >
                  {formatRupiah(lifetime.totalClaimsPaid)}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-xs bg-purple-600 dark:bg-purple-500"
                    style={{ width: `${Math.min(100, claimsRatioPct)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatPct(claimsRatioPct)} dibanding total top up
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Sisa Estimasi Hasil
                  </p>
                  <span className="font-mono-num text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {formatPct(yieldRatioPct)}
                  </span>
                </div>
                <p
                  className="mt-2 font-mono-num text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 xl:text-[22px] whitespace-nowrap"
                  data-testid="lifetime-yield"
                >
                  {formatRupiah(lifetime.remainingEstimatedYield)}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-xs bg-slate-400 dark:bg-slate-500"
                    style={{ width: `${yieldRatioPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lifetime.remainingEstimatedYield === 0
                    ? 'Seluruh estimasi klaim telah lunas'
                    : 'Sisa kewajiban imbal hasil berjalan'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
