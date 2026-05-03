import { tr, type Lang } from './i18n';
import { SLIDERS, type FieldKey } from './constants';

export function parseNum(value: string): number {
  const n = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function formatAxis(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function sliderVal(str: string, cfg: { min: number; max: number }): number {
  return clamp(parseNum(str), cfg.min, cfg.max);
}

export function isValidAgeInput(s: string): boolean {
  if (s.trim() === '') return false;
  const n = parseNum(s);
  if (!Number.isFinite(n)) return false;
  if (n !== Math.floor(n)) return false;
  return n >= 0 && n <= 120;
}

export function parseAgeYears(s: string): number | null {
  if (!isValidAgeInput(s)) return null;
  return Math.floor(parseNum(s));
}

export type MCFieldKey = 'mcReturnStdDev' | 'mcInflationStdDev';

export function getErrors(
  vals: Record<FieldKey, string>,
  currentAge: string,
  lang: Lang,
  mcVals?: { mcReturnStdDev: string; mcInflationStdDev: string },
  histMode?: boolean,
): Partial<Record<FieldKey | 'currentAge' | MCFieldKey, string>> {
  const errors: Partial<Record<FieldKey | 'currentAge' | MCFieldKey, string>> = {};

  function check(key: FieldKey | MCFieldKey, val: string, opts: { min?: number; max?: number; nonNeg?: boolean } = {}) {
    const n = parseNum(val);
    if (val.trim() === '' || !Number.isFinite(parseFloat(val.replace(',', '.')))) {
      errors[key] = tr(lang, 'errors.notNumber');
      return;
    }
    if (opts.nonNeg && n < 0) {
      errors[key] = tr(lang, 'errors.nonNegative');
      return;
    }
    if (opts.min !== undefined && n < opts.min) {
      errors[key] = `${tr(lang, 'errors.min')} ${opts.min}`;
      return;
    }
    if (opts.max !== undefined && n > opts.max) {
      errors[key] = `${tr(lang, 'errors.max')} ${opts.max}`;
    }
  }

  check('initialCapital', vals.initialCapital, { nonNeg: true });
  check('monthlyNeedToday', vals.monthlyNeedToday, SLIDERS.monthlyNeedToday);
  check('monthlyContribution', vals.monthlyContribution, SLIDERS.monthlyContribution);
  if (!histMode) {
    check('annualInflationPercent', vals.annualInflationPercent, SLIDERS.annualInflationPercent);
    check('annualReturnPercent', vals.annualReturnPercent, SLIDERS.annualReturnPercent);
  }
  check('horizonYears', vals.horizonYears, SLIDERS.horizonYears);

  if (currentAge.trim() !== '' && !isValidAgeInput(currentAge)) {
    errors.currentAge = tr(lang, 'errors.age');
  }

  if (mcVals) {
    check('mcReturnStdDev', mcVals.mcReturnStdDev, { nonNeg: true, max: 20 });
    check('mcInflationStdDev', mcVals.mcInflationStdDev, { nonNeg: true, max: 10 });
  }

  return errors;
}
