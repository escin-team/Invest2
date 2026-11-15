'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import type { DailyCashflowPoint } from '@/src/lib/dashboard-schema';
import { cn, formatCompactRupiah, formatRupiah, formatSignedRupiah } from '@/src/lib/utils';

interface CashflowChartProps {
  series: DailyCashflowPoint[];
  peakTopUpDate: string;
  peakWithdrawalDate: string;
}

type ChartMode = 'bar' | 'line';

export function CashflowChart({
  series,
  peakTopUpDate,
  peakWithdrawalDate,
}: CashflowChartProps) {
  const [mode, setMode] = useState<ChartMode>('bar');
  const [activeIndex, setActiveIndex] = useState<number>(series.length - 1);

  const safeIndex = Math.min(activeIndex, Math.max(0, series.length - 1));
  const activePoint = series[safeIndex];

  const maxVal = Math.max(
    1,
    ...series.flatMap((d) => [d.topUp, d.withdrawal])
  );
  // Round ceiling up to clean step for grid lines
  const stepUnit = maxVal >= 400_000_000 ? 100_000_000 : maxVal >= 100_000_000 ? 35_000_000 : 20_000_000;
  const yMax = Math.ceil(maxVal / stepUnit) * stepUnit;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const width = 760;
  const height = 230;
  const padLeft = 74;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const slotWidth = plotW / Math.max(1, series.length);
  const barWidth = Math.min(24, Math.max(10, slotWidth * 0.28));
  const barGap = 6;

  const getY = (val: number) => padTop + plotH - (val / yMax) * plotH;
  const getCenterX = (idx: number) => padLeft + slotWidth * idx + slotWidth / 2;

  const topUpLinePoints = series
    .map((p, idx) => `${getCenterX(idx).toFixed(1)},${getY(p.topUp).toFixed(1)}`)
    .join(' ');
  const withdrawalLinePoints = series
    .map((p, idx) => `${getCenterX(idx).toFixed(1)},${getY(p.withdrawal).toFixed(1)}`)
    .join(' ');

  const netDiff = activePoint ? activePoint.topUp - activePoint.withdrawal : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" aria-hidden="true" />
            <span>Top Up Disetujui</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-rose-600 dark:bg-rose-500" aria-hidden="true" />
            <span>Withdrawal Disetujui</span>
          </span>
        </div>

        <div
          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950"
          role="group"
          aria-label="Mode tampilan grafik"
        >
          <button
            type="button"
            onClick={() => setMode('bar')}
            aria-pressed={mode === 'bar'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
              mode === 'bar'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Batang</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('line')}
            aria-pressed={mode === 'line'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
              mode === 'line'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tren Garis</span>
          </button>
        </div>
      </div>

      {/* Selected day/period detail strip */}
      {activePoint && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-950/60"
          data-testid="chart-active-tooltip"
        >
          <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {activePoint.fullDate}
            </span>
            {(activePoint.fullDate === peakTopUpDate ||
              activePoint.fullDate === peakWithdrawalDate) && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-purple-700 dark:text-purple-400 font-medium">
                  Volume puncak periode
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Top Up:</span>
              <span className="font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                {formatRupiah(activePoint.topUp)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Withdrawal:</span>
              <span className="font-mono-num font-semibold text-rose-700 dark:text-rose-400">
                {formatRupiah(activePoint.withdrawal)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Selisih:</span>
              <span
                className={cn(
                  'font-mono-num font-semibold',
                  netDiff >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                )}
              >
                {formatSignedRupiah(netDiff)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Visualization */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 min-w-[540px] w-full select-none"
          role="img"
          aria-label="Grafik perbandingan harian Top Up dan Withdrawal yang disetujui"
          data-testid="cashflow-svg-chart"
        >
          {/* Y-Axis grid lines & labels */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray={i === 0 ? undefined : '3 3'}
                  className={
                    i === 0
                      ? 'text-slate-200 dark:text-slate-700'
                      : 'text-slate-200/75 dark:text-slate-800'
                  }
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[11px]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {tick === 0 ? 'Rp 0' : formatCompactRupiah(tick)}
                </text>
              </g>
            );
          })}

          {mode === 'line' && (
            <g>
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={topUpLinePoints}
              />
              <polyline
                fill="none"
                stroke="#E11D48"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={withdrawalLinePoints}
              />
            </g>
          )}

          {series.map((point, idx) => {
            const cx = getCenterX(idx);
            const isSelected = idx === safeIndex;
            const topUpY = getY(point.topUp);
            const topUpH = Math.max(2, padTop + plotH - topUpY);
            const wdY = getY(point.withdrawal);
            const wdH = Math.max(2, padTop + plotH - wdY);

            return (
              <g
                key={point.id}
                tabIndex={0}
                role="button"
                aria-label={`${point.fullDate}: Top Up ${formatRupiah(point.topUp)}, Withdrawal ${formatRupiah(point.withdrawal)}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onFocus={() => setActiveIndex(idx)}
                onClick={() => setActiveIndex(idx)}
                className="cursor-pointer outline-none"
              >
                {/* Hover / active column highlight */}
                <rect
                  x={padLeft + slotWidth * idx + 4}
                  y={padTop}
                  width={Math.max(10, slotWidth - 8)}
                  height={plotH}
                  rx={6}
                  className={cn(
                    'transition-opacity duration-150',
                    isSelected
                      ? 'fill-slate-100/90 dark:fill-slate-800/50 opacity-100'
                      : 'fill-transparent opacity-0 hover:fill-slate-100/50'
                  )}
                />

                {mode === 'bar' ? (
                  <>
                    <rect
                      x={cx - barWidth - barGap / 2}
                      y={topUpY}
                      width={barWidth}
                      height={topUpH}
                      rx={3}
                      className={cn(
                        'transition-opacity duration-150',
                        isSelected
                          ? 'fill-emerald-600 dark:fill-emerald-400'
                          : 'fill-emerald-500/85 dark:fill-emerald-500/75'
                      )}
                    />
                    <rect
                      x={cx + barGap / 2}
                      y={wdY}
                      width={barWidth}
                      height={wdH}
                      rx={3}
                      className={cn(
                        'transition-opacity duration-150',
                        isSelected
                          ? 'fill-rose-600 dark:fill-rose-400'
                          : 'fill-rose-500/85 dark:fill-rose-500/75'
                      )}
                    />
                  </>
                ) : (
                  <>
                    {isSelected && (
                      <line
                        x1={cx}
                        y1={padTop}
                        x2={cx}
                        y2={padTop + plotH}
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        className="text-slate-300 dark:text-slate-700"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={topUpY}
                      r={isSelected ? 5.5 : 4}
                      className="fill-emerald-600 stroke-white dark:stroke-slate-900"
                      strokeWidth={2}
                    />
                    <circle
                      cx={cx}
                      cy={wdY}
                      r={isSelected ? 5.5 : 4}
                      className="fill-rose-600 stroke-white dark:stroke-slate-900"
                      strokeWidth={2}
                    />
                  </>
                )}

                {/* X-axis label */}
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  className={cn(
                    'text-[11px] transition-colors',
                    isSelected
                      ? 'fill-slate-900 dark:fill-slate-100 font-semibold'
                      : 'fill-slate-500 dark:fill-slate-400'
                  )}
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
