export const CURRENT_YEAR = new Date().getFullYear();

export const DEFAULTS = {
  initialCapital: 20_000,
  monthlyNeedToday: 2_500,
  annualInflationPercent: 3,
  monthlyContribution: 3_500,
  annualReturnPercent: 10,
  horizonYears: 15,
};

export const SLIDERS = {
  monthlyContribution: { min: 250, max: 10_000, step: 250 },
  monthlyNeedToday: { min: 1_000, max: 10_000, step: 250 },
  annualInflationPercent: { min: 2, max: 15, step: 0.25 },
  annualReturnPercent: { min: 5, max: 20, step: 1 },
  horizonYears: { min: 10, max: 30, step: 5 },
};

export type FieldKey =
  | 'initialCapital'
  | 'monthlyNeedToday'
  | 'monthlyContribution'
  | 'annualInflationPercent'
  | 'annualReturnPercent'
  | 'horizonYears';

export type XMode = 'rel' | 'cal' | 'age';

export const QP = {
  l: 'l',
  ic: 'ic',
  mn: 'mn',
  inf: 'inf',
  mc: 'mc',
  ar: 'ar',
  h: 'h',
  a: 'a',
  x: 'x',
} as const;
