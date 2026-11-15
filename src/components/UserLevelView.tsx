'use client';

import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  Info,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import type {
  AdminUserRecord,
  SalaryPeriod,
  UserLevelCustomField,
  UserLevelRule,
} from '@/src/lib/dashboard-schema';
import {
  cloneDefaultUserLevelRules,
  countUserActiveReferrals,
  evaluateUserLevel,
  formatSalaryPeriodLabel,
  getVipBadgeImageSrc,
  getVipTierTitle,
} from '@/src/lib/user-levels';
import { formatCompactRupiah, formatNumber, formatRupiah } from '@/src/lib/utils';

interface UserLevelViewProps {
  rules: UserLevelRule[];
  users: AdminUserRecord[];
  onSaveRules: (nextRules: UserLevelRule[]) => string | null;
}

interface DraftLevelRow {
  level: number;
  label: string;
  tierTitle: string;
  badgeImageUrl: string;
  isStarterLevel: boolean;
  minActiveReferrals: string;
  minTotalPurchase: string;
  extraRequirements: UserLevelCustomField[];
  minWithdrawal: string;
  maxWithdrawal: string;
  salaryAmount: string;
  salaryPeriod: SalaryPeriod;
  extraBenefits: UserLevelCustomField[];
}

function toDraftRows(rules: ReadonlyArray<UserLevelRule>): DraftLevelRow[] {
  return [...rules]
    .sort((a, b) => a.level - b.level)
    .map((rule) => ({
      level: rule.level,
      label: rule.label,
      tierTitle: rule.tierTitle || getVipTierTitle(rule.level),
      badgeImageUrl: rule.badgeImageUrl || getVipBadgeImageSrc(rule.level),
      isStarterLevel: rule.isStarterLevel,
      minActiveReferrals: String(rule.minActiveReferrals),
      minTotalPurchase: String(rule.minTotalPurchase),
      extraRequirements: (rule.extraRequirements ?? []).map((item) => ({ ...item })),
      minWithdrawal: String(rule.minWithdrawal),
      maxWithdrawal: String(rule.maxWithdrawal),
      salaryAmount: String(rule.salaryAmount),
      salaryPeriod: rule.salaryPeriod === 'minggu' ? 'minggu' : 'hari',
      extraBenefits: (rule.extraBenefits ?? []).map((item) => ({ ...item })),
    }));
}

function areCustomFieldsEqual(
  a: ReadonlyArray<UserLevelCustomField>,
  b: ReadonlyArray<UserLevelCustomField>
): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, idx) => item.label === b[idx]?.label && item.value === b[idx]?.value);
}

function parseNonNegativeIntInput(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return -1;
  return Number(trimmed);
}

export function UserLevelView({
  rules,
  users,
  onSaveRules,
}: UserLevelViewProps) {
  const [drafts, setDrafts] = useState<DraftLevelRow[]>(() => toDraftRows(rules));
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [nextColumnCounter, setNextColumnCounter] = useState(1);

  const [simUserId, setSimUserId] = useState<string>(users[1]?.id ?? users[0]?.id ?? 'custom');
  const [simReferralsInput, setSimReferralsInput] = useState<string>(() => {
    const sample = users[1] ?? users[0];
    return sample ? String(countUserActiveReferrals(sample)) : '5';
  });
  const [simPurchaseInput, setSimPurchaseInput] = useState<string>(() => {
    const sample = users[1] ?? users[0];
    return sample ? String(sample.totalInvestmentModal) : '5000000';
  });

  const hasUnsavedChanges = drafts.some((draft, index) => {
    const saved = rules[index];
    if (!saved) return true;
    return (
      Number(draft.minActiveReferrals) !== saved.minActiveReferrals ||
      Number(draft.minTotalPurchase) !== saved.minTotalPurchase ||
      Number(draft.minWithdrawal) !== saved.minWithdrawal ||
      Number(draft.maxWithdrawal) !== saved.maxWithdrawal ||
      Number(draft.salaryAmount) !== saved.salaryAmount ||
      draft.salaryPeriod !== saved.salaryPeriod ||
      !areCustomFieldsEqual(draft.extraRequirements, saved.extraRequirements) ||
      !areCustomFieldsEqual(draft.extraBenefits, saved.extraBenefits)
    );
  });

  const clearFeedback = () => {
    if (formError) setFormError(null);
    if (saveSuccess) setSaveSuccess(null);
  };

  const handleScalarChange = (
    level: number,
    field:
      | 'minActiveReferrals'
      | 'minTotalPurchase'
      | 'minWithdrawal'
      | 'maxWithdrawal'
      | 'salaryAmount',
    value: string
  ) => {
    setDrafts((prev) =>
      prev.map((row) => (row.level === level ? { ...row, [field]: value } : row))
    );
    clearFeedback();
  };

  const handleSalaryPeriodChange = (level: number, period: SalaryPeriod) => {
    setDrafts((prev) =>
      prev.map((row) => (row.level === level ? { ...row, salaryPeriod: period } : row))
    );
    clearFeedback();
  };

  const handleAddCustomField = (
    level: number,
    target: 'extraRequirements' | 'extraBenefits'
  ) => {
    const colId = `vip${level}-${target === 'extraRequirements' ? 'req' : 'ben'}-${nextColumnCounter}`;
    setNextColumnCounter((c) => c + 1);
    setDrafts((prev) =>
      prev.map((row) =>
        row.level === level
          ? {
              ...row,
              [target]: [
                ...row[target],
                {
                  id: colId,
                  label: '',
                  value: '',
                },
              ],
            }
          : row
      )
    );
    clearFeedback();
  };

  const handleUpdateCustomField = (
    level: number,
    target: 'extraRequirements' | 'extraBenefits',
    fieldId: string,
    key: 'label' | 'value',
    nextValue: string
  ) => {
    setDrafts((prev) =>
      prev.map((row) =>
        row.level === level
          ? {
              ...row,
              [target]: row[target].map((item) =>
                item.id === fieldId ? { ...item, [key]: nextValue } : item
              ),
            }
          : row
      )
    );
    clearFeedback();
  };

  const handleRemoveCustomField = (
    level: number,
    target: 'extraRequirements' | 'extraBenefits',
    fieldId: string
  ) => {
    setDrafts((prev) =>
      prev.map((row) =>
        row.level === level
          ? {
              ...row,
              [target]: row[target].filter((item) => item.id !== fieldId),
            }
          : row
      )
    );
    clearFeedback();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedPayload: UserLevelRule[] = drafts.map((row) => ({
      level: row.level,
      label: row.label,
      tierTitle: row.tierTitle,
      badgeImageUrl: row.badgeImageUrl,
      isStarterLevel: row.isStarterLevel,
      minActiveReferrals: parseNonNegativeIntInput(row.minActiveReferrals),
      minTotalPurchase: parseNonNegativeIntInput(row.minTotalPurchase),
      extraRequirements: row.extraRequirements.map((item) => ({ ...item })),
      minWithdrawal: parseNonNegativeIntInput(row.minWithdrawal),
      maxWithdrawal: parseNonNegativeIntInput(row.maxWithdrawal),
      salaryAmount: parseNonNegativeIntInput(row.salaryAmount),
      salaryPeriod: row.salaryPeriod,
      extraBenefits: row.extraBenefits.map((item) => ({ ...item })),
    }));

    const err = onSaveRules(parsedPayload);
    if (err) {
      setFormError(err);
      setSaveSuccess(null);
      return;
    }

    setFormError(null);
    setSaveSuccess(
      'Pengaturan VIP User (VIP 1–8), batas akses withdraw, gaji, dan kolom tambahan berhasil disimpan.'
    );
  };

  const handleResetToDefault = () => {
    const defaults = cloneDefaultUserLevelRules();
    setDrafts(toDraftRows(defaults));
    const err = onSaveRules(defaults);
    setFormError(err);
    setSaveSuccess(err ? null : 'Pengaturan dikembalikan ke standar default VIP 1–8.');
  };

  const handleSelectSimUser = (userId: string) => {
    setSimUserId(userId);
    if (userId === 'custom') return;
    const found = users.find((u) => u.id === userId);
    if (found) {
      setSimReferralsInput(String(countUserActiveReferrals(found)));
      setSimPurchaseInput(String(found.totalInvestmentModal));
    }
  };

  const simEvaluation = evaluateUserLevel(
    Number(simReferralsInput) || 0,
    Number(simPurchaseInput) || 0,
    rules
  );

  const firstRule = rules[0];
  const highestRule = rules[rules.length - 1];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pengaturan VIP User
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Atur syarat kenaikan, batas minimal–maksimal withdraw, gaji rutin, serta kolom tambahan untuk VIP 1 sampai VIP 8.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Default</span>
          </Button>
          <Button
            type="submit"
            form="user-level-settings-form"
            variant="primary"
            size="sm"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Simpan Pengaturan</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Jenjang VIP Aktif
            </p>
            <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900 dark:text-slate-100">
              VIP 1 – {formatNumber(rules.length)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Membatasi akses withdraw &amp; produk di Member App
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Akses Withdraw VIP 1 ({firstRule?.tierTitle ?? 'Bronze'})
            </p>
            <p className="mt-2 font-mono-num text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCompactRupiah(firstRule?.minWithdrawal ?? 50_000)} –{' '}
              {formatCompactRupiah(firstRule?.maxWithdrawal ?? 500_000)}
            </p>
            <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
              Gaji: {formatRupiah(firstRule?.salaryAmount ?? 0)} /{' '}
              {formatSalaryPeriodLabel(firstRule?.salaryPeriod ?? 'hari')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Akses Withdraw VIP 8 ({highestRule?.tierTitle ?? 'Ruby'})
            </p>
            <p className="mt-2 font-mono-num text-xl font-bold text-purple-700 dark:text-purple-400">
              {formatCompactRupiah(highestRule?.minWithdrawal ?? 50_000)} –{' '}
              {formatCompactRupiah(highestRule?.maxWithdrawal ?? 250_000_000)}
            </p>
            <p className="mt-1 font-mono-num text-xs text-slate-500 dark:text-slate-400">
              Gaji: {formatRupiah(highestRule?.salaryAmount ?? 5_000_000)} /{' '}
              {formatSalaryPeriodLabel(highestRule?.salaryPeriod ?? 'minggu')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main VIP 1-8 Configuration Form */}
      <form id="user-level-settings-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {saveSuccess && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {drafts.map((row) => {
            const numericDeposit = Math.max(0, Number(row.minTotalPurchase) || 0);
            const numericMinWd = Math.max(0, Number(row.minWithdrawal) || 0);
            const numericMaxWd = Math.max(0, Number(row.maxWithdrawal) || 0);
            const numericSalary = Math.max(0, Number(row.salaryAmount) || 0);

            return (
              <Card key={row.level} data-testid={`vip-card-${row.level}`}>
                <CardHeader className="border-b border-slate-100 py-4 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={row.badgeImageUrl}
                        alt={`Logo VIP ${row.level} ${row.tierTitle}`}
                        className="h-14 w-14 shrink-0 object-contain"
                      />
                      <div className="min-w-0">
                        <CardTitle className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                          VIP {row.level}{' '}
                          <span className="font-normal text-slate-400" aria-hidden="true">
                            ·
                          </span>{' '}
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {row.tierTitle}
                          </span>
                        </CardTitle>
                        <CardDescription className="mt-0.5 font-mono-num text-xs">
                          WD: {formatCompactRupiah(numericMinWd)} – {formatCompactRupiah(numericMaxWd)}
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          Gaji: {formatCompactRupiah(numericSalary)}/{formatSalaryPeriodLabel(row.salaryPeriod)}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 p-5">
                  {/* Syarat VIP Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                        Syarat VIP {row.level}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleAddCustomField(row.level, 'extraRequirements')}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tambah Kolom</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`vip-${row.level}-min-referral`}
                          className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          Minimal Referal
                        </label>
                        <Input
                          id={`vip-${row.level}-min-referral`}
                          type="number"
                          min={0}
                          step={1}
                          placeholder="Masukan Jumlah"
                          value={row.minActiveReferrals}
                          onChange={(e) =>
                            handleScalarChange(row.level, 'minActiveReferrals', e.target.value)
                          }
                          className="mt-1.5 h-10 font-mono-num"
                        />
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {formatNumber(Math.max(0, Number(row.minActiveReferrals) || 0))} referral aktif
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor={`vip-${row.level}-min-deposit`}
                          className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          Minimal Deposit (Rp)
                        </label>
                        <Input
                          id={`vip-${row.level}-min-deposit`}
                          type="number"
                          min={0}
                          step={100000}
                          placeholder="Masukan Jumlah"
                          value={row.minTotalPurchase}
                          onChange={(e) =>
                            handleScalarChange(row.level, 'minTotalPurchase', e.target.value)
                          }
                          className="mt-1.5 h-10 font-mono-num"
                        />
                        <p className="mt-1 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                          {formatRupiah(numericDeposit)}
                        </p>
                      </div>
                    </div>

                    {row.extraRequirements.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {row.extraRequirements.map((field, idx) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                          >
                            <div>
                              <label
                                htmlFor={`${field.id}-label`}
                                className="block text-[11px] font-medium text-slate-600 dark:text-slate-400"
                              >
                                Kolom Syarat #{idx + 1}
                              </label>
                              <Input
                                id={`${field.id}-label`}
                                type="text"
                                placeholder="Nama syarat (mis. Minimal Produk)"
                                value={field.label}
                                onChange={(e) =>
                                  handleUpdateCustomField(
                                    row.level,
                                    'extraRequirements',
                                    field.id,
                                    'label',
                                    e.target.value
                                  )
                                }
                                className="mt-1 h-9 text-xs"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`${field.id}-value`}
                                className="block text-[11px] font-medium text-slate-600 dark:text-slate-400"
                              >
                                Nilai / Jumlah
                              </label>
                              <Input
                                id={`${field.id}-value`}
                                type="text"
                                placeholder="Masukan jumlah / nilai"
                                value={field.value}
                                onChange={(e) =>
                                  handleUpdateCustomField(
                                    row.level,
                                    'extraRequirements',
                                    field.id,
                                    'value',
                                    e.target.value
                                  )
                                }
                                className="mt-1 h-9 font-mono-num text-xs"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveCustomField(row.level, 'extraRequirements', field.id)
                              }
                              aria-label={`Hapus kolom syarat ${idx + 1} VIP ${row.level}`}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Benefit jika Sudah VIP X Section */}
                  <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold tracking-wide text-purple-700 dark:text-purple-400">
                        Benefit jika Sudah VIP {row.level}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleAddCustomField(row.level, 'extraBenefits')}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tambah Kolom</span>
                      </button>
                    </div>

                    {/* Withdraw: Minimal - Maksimal */}
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Withdraw (Minimal – Maksimal)
                      </p>
                      <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`vip-${row.level}-min-wd`}
                            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400"
                          >
                            Minimal Withdraw (Rp)
                          </label>
                          <Input
                            id={`vip-${row.level}-min-wd`}
                            type="number"
                            min={0}
                            step={10000}
                            placeholder="Masukan Minimal"
                            value={row.minWithdrawal}
                            onChange={(e) =>
                              handleScalarChange(row.level, 'minWithdrawal', e.target.value)
                            }
                            className="mt-1 h-10 font-mono-num"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`vip-${row.level}-max-wd`}
                            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400"
                          >
                            Maksimal Withdraw (Rp)
                          </label>
                          <Input
                            id={`vip-${row.level}-max-wd`}
                            type="number"
                            min={0}
                            step={50000}
                            placeholder="Maksimal"
                            value={row.maxWithdrawal}
                            onChange={(e) =>
                              handleScalarChange(row.level, 'maxWithdrawal', e.target.value)
                            }
                            className="mt-1 h-10 font-mono-num"
                          />
                        </div>
                      </div>
                      <p className="mt-1 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                        Batas penarikan aktif: {formatRupiah(numericMinWd)} – {formatRupiah(numericMaxWd)}
                      </p>
                    </div>

                    {/* Gaji: Nominal / Minggu / Hari */}
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Gaji VIP {row.level}
                      </p>
                      <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
                        <div>
                          <label
                            htmlFor={`vip-${row.level}-salary-amount`}
                            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400"
                          >
                            Nominal Gaji (Rp)
                          </label>
                          <Input
                            id={`vip-${row.level}-salary-amount`}
                            type="number"
                            min={0}
                            step={10000}
                            placeholder="Nominal"
                            value={row.salaryAmount}
                            onChange={(e) =>
                              handleScalarChange(row.level, 'salaryAmount', e.target.value)
                            }
                            className="mt-1 h-10 font-mono-num"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`vip-${row.level}-salary-period`}
                            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400"
                          >
                            Periode
                          </label>
                          <select
                            id={`vip-${row.level}-salary-period`}
                            value={row.salaryPeriod}
                            onChange={(e) =>
                              handleSalaryPeriodChange(
                                row.level,
                                e.target.value === 'minggu' ? 'minggu' : 'hari'
                              )
                            }
                            className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                          >
                            <option value="hari">/ Hari</option>
                            <option value="minggu">/ Minggu</option>
                          </select>
                        </div>
                      </div>
                      <p className="mt-1 font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                        {formatRupiah(numericSalary)} / {formatSalaryPeriodLabel(row.salaryPeriod)}
                      </p>
                    </div>

                    {row.extraBenefits.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {row.extraBenefits.map((field, idx) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                          >
                            <div>
                              <label
                                htmlFor={`${field.id}-label`}
                                className="block text-[11px] font-medium text-slate-600 dark:text-slate-400"
                              >
                                Kolom Benefit #{idx + 1}
                              </label>
                              <Input
                                id={`${field.id}-label`}
                                type="text"
                                placeholder="Nama benefit (mis. Bonus Upgrade)"
                                value={field.label}
                                onChange={(e) =>
                                  handleUpdateCustomField(
                                    row.level,
                                    'extraBenefits',
                                    field.id,
                                    'label',
                                    e.target.value
                                  )
                                }
                                className="mt-1 h-9 text-xs"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`${field.id}-value`}
                                className="block text-[11px] font-medium text-slate-600 dark:text-slate-400"
                              >
                                Nilai / Detail Benefit
                              </label>
                              <Input
                                id={`${field.id}-value`}
                                type="text"
                                placeholder="Masukan nominal / keterangan"
                                value={field.value}
                                onChange={(e) =>
                                  handleUpdateCustomField(
                                    row.level,
                                    'extraBenefits',
                                    field.id,
                                    'value',
                                    e.target.value
                                  )
                                }
                                className="mt-1 h-9 font-mono-num text-xs"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveCustomField(row.level, 'extraBenefits', field.id)
                              }
                              aria-label={`Hapus kolom benefit ${idx + 1} VIP ${row.level}`}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sticky / Bottom Action Footer */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400"
                aria-hidden="true"
              />
              <p>
                Batas minimal–maksimal withdraw serta benefit VIP langsung diterapkan pada halaman Member App. Pastikan syarat kenaikan tetap berurutan dari VIP 1 sampai VIP 8.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              {hasUnsavedChanges && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDrafts(toDraftRows(rules));
                    setFormError(null);
                    setSaveSuccess(null);
                  }}
                >
                  Batal
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm">
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Simpan Pengaturan</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Level Evaluation Simulator */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
          <CardTitle className="text-base">Simulasi Cek VIP User</CardTitle>
          <CardDescription>
            Uji pencapaian VIP user, batas akses withdraw, dan gaji berdasarkan pengaturan aktif saat ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-4">
              <label
                htmlFor="sim-user-select"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                Pilih Sampel User (atau Input Manual)
              </label>
              <select
                id="sim-user-select"
                value={simUserId}
                onChange={(e) => handleSelectSimUser(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.userNumber} · {u.name} ({countUserActiveReferrals(u)} ref aktif)
                  </option>
                ))}
                <option value="custom">Input Angka Simulasi Manual</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="sim-referrals-input"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                Referral Aktif
              </label>
              <Input
                id="sim-referrals-input"
                type="number"
                min={0}
                value={simReferralsInput}
                onChange={(e) => {
                  setSimUserId('custom');
                  setSimReferralsInput(e.target.value);
                }}
                className="mt-1.5 font-mono-num"
              />
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="sim-purchase-input"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                Deposit / Pembelian (Rp)
              </label>
              <Input
                id="sim-purchase-input"
                type="number"
                min={0}
                step={500000}
                value={simPurchaseInput}
                onChange={(e) => {
                  setSimUserId('custom');
                  setSimPurchaseInput(e.target.value);
                }}
                className="mt-1.5 font-mono-num"
              />
            </div>

            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                <img
                  src={simEvaluation.currentRule.badgeImageUrl}
                  alt={`Logo ${simEvaluation.currentRule.label}`}
                  className="h-12 w-12 shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Hasil Evaluasi VIP
                  </p>
                  <p
                    className="font-display text-sm font-bold text-purple-700 dark:text-purple-400"
                    data-testid="sim-level-result"
                  >
                    VIP {simEvaluation.currentRule.level} · {simEvaluation.currentRule.tierTitle}
                  </p>
                  <p className="mt-0.5 font-mono-num text-[11px] text-slate-600 dark:text-slate-300">
                    WD {formatCompactRupiah(simEvaluation.currentRule.minWithdrawal)}–
                    {formatCompactRupiah(simEvaluation.currentRule.maxWithdrawal)} · Gaji{' '}
                    {formatCompactRupiah(simEvaluation.currentRule.salaryAmount)}/
                    {formatSalaryPeriodLabel(simEvaluation.currentRule.salaryPeriod)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
