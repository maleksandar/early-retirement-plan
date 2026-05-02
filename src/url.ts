import { type Lang } from './i18n';
import { QP, type XMode } from './constants';

export function readUrlState(): {
  lang?: Lang;
  initialCapital?: string;
  monthlyNeedToday?: string;
  annualInflationPercent?: string;
  monthlyContribution?: string;
  annualReturnPercent?: string;
  horizonYears?: string;
  currentAge?: string;
  xMode?: XMode;
} {
  if (typeof window === 'undefined') return {};
  const sp = new URLSearchParams(window.location.search);
  const g = (k: string) => sp.get(k);
  const o: ReturnType<typeof readUrlState> = {};
  if (g(QP.l) === 'en' || g(QP.l) === 'sr') o.lang = g(QP.l) as Lang;
  if (g(QP.ic) != null && g(QP.ic) !== '') o.initialCapital = g(QP.ic)!;
  if (g(QP.mn) != null && g(QP.mn) !== '') o.monthlyNeedToday = g(QP.mn)!;
  if (g(QP.inf) != null && g(QP.inf) !== '') o.annualInflationPercent = g(QP.inf)!;
  if (g(QP.mc) != null && g(QP.mc) !== '') o.monthlyContribution = g(QP.mc)!;
  if (g(QP.ar) != null && g(QP.ar) !== '') o.annualReturnPercent = g(QP.ar)!;
  if (g(QP.h) != null && g(QP.h) !== '') o.horizonYears = g(QP.h)!;
  if (g(QP.a) != null && g(QP.a) !== '') o.currentAge = g(QP.a)!;
  const xv = g(QP.x);
  if (xv === 'rel' || xv === 'cal' || xv === 'age') o.xMode = xv;
  return o;
}

export function buildSearchParams(state: {
  lang: Lang;
  initialCapital: string;
  monthlyNeedToday: string;
  annualInflationPercent: string;
  monthlyContribution: string;
  annualReturnPercent: string;
  horizonYears: string;
  currentAge: string;
  xMode: XMode;
}): string {
  const sp = new URLSearchParams();
  sp.set(QP.l, state.lang);
  sp.set(QP.ic, state.initialCapital);
  sp.set(QP.mn, state.monthlyNeedToday);
  sp.set(QP.inf, state.annualInflationPercent);
  sp.set(QP.mc, state.monthlyContribution);
  sp.set(QP.ar, state.annualReturnPercent);
  sp.set(QP.h, state.horizonYears);
  if (state.currentAge.trim() !== '') sp.set(QP.a, state.currentAge);
  sp.set(QP.x, state.xMode);
  return sp.toString();
}
