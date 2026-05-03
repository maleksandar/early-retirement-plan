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
export type SimMode = 'fixed' | 'mc' | 'hist';

export const HIST_FIRST_YEAR = 1970;
export const HIST_LAST_YEAR = 2024;
export const HIST_DEFAULT_START_YEAR = 2000;

export const HIST_CRYPTO_FIRST_YEAR = 2010;
export const ASSET_HIST_FIRST_YEAR: Partial<Record<import('./data/historical').AssetClass, number>> = {
  crypto: HIST_CRYPTO_FIRST_YEAR,
};

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
  mce: 'mce',
  mcn: 'mcn',
  mcrs: 'mcrs',
  mcis: 'mcis',
  sm: 'sm',
  hy: 'hy',
} as const;

export const MC_DEFAULTS = {
  mcEnabled: false,
  mcRunCount: '1000',
  mcReturnStdDev: '15',
  mcInflationStdDev: '2',
};

export const MC_RUN_COUNTS = ['500', '1000', '5000', '10000'] as const;
