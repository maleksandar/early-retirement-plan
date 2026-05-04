import { type Lang } from './i18n';
import {
  QP,
  type XMode,
  type SimMode,
  HIST_FIRST_YEAR,
  HIST_LAST_YEAR,
  EXTRA_ASSETS,
  type ExtraAsset,
  type ExtraAssetState,
  EXTRA_ASSET_DEFAULTS,
  DEFAULT_ALLOC_ORDER,
} from './constants';

const ASSET_QP: Record<ExtraAsset, { on: string; val: string; ret: string; sd: string; con: string }> = {
  bonds:      { on: QP.bonOn, val: QP.bonVal, ret: QP.bonRet, sd: QP.bonSd, con: QP.bonCon },
  realestate: { on: QP.reOn,  val: QP.reVal,  ret: QP.reRet,  sd: QP.reSd,  con: QP.reCon  },
  gold:       { on: QP.goOn,  val: QP.goVal,  ret: QP.goRet,  sd: QP.goSd,  con: QP.goCon  },
  silver:     { on: QP.siOn,  val: QP.siVal,  ret: QP.siRet,  sd: QP.siSd,  con: QP.siCon  },
  crypto:     { on: QP.crOn,  val: QP.crVal,  ret: QP.crRet,  sd: QP.crSd,  con: QP.crCon  },
};

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
  simMode?: SimMode;
  mcRunCount?: string;
  mcReturnStdDev?: string;
  mcInflationStdDev?: string;
  histStartYear?: number;
  stocksVal?: string;
  stocksCon?: string;
  extraAssets?: Record<ExtraAsset, ExtraAssetState>;
  allocOrder?: string[];
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
  const smv = g(QP.sm);
  if (smv === 'mc' || smv === 'hist') {
    o.simMode = smv;
  } else if (g(QP.mce) === '1') {
    o.simMode = 'mc';
  }
  if (g(QP.mcn) != null && g(QP.mcn) !== '') o.mcRunCount = g(QP.mcn)!;
  if (g(QP.mcrs) != null && g(QP.mcrs) !== '') o.mcReturnStdDev = g(QP.mcrs)!;
  if (g(QP.mcis) != null && g(QP.mcis) !== '') o.mcInflationStdDev = g(QP.mcis)!;
  const hyv = g(QP.hy);
  if (hyv != null && hyv !== '') {
    const hy = parseInt(hyv, 10);
    if (hy >= HIST_FIRST_YEAR && hy <= HIST_LAST_YEAR) o.histStartYear = hy;
  }

  if (g(QP.stV) != null && g(QP.stV) !== '') o.stocksVal = g(QP.stV)!;
  if (g(QP.stCon) != null && g(QP.stCon) !== '') o.stocksCon = g(QP.stCon)!;

  const extraAssets: Record<ExtraAsset, ExtraAssetState> = {
    bonds:      { ...EXTRA_ASSET_DEFAULTS.bonds      },
    realestate: { ...EXTRA_ASSET_DEFAULTS.realestate },
    gold:       { ...EXTRA_ASSET_DEFAULTS.gold       },
    silver:     { ...EXTRA_ASSET_DEFAULTS.silver     },
    crypto:     { ...EXTRA_ASSET_DEFAULTS.crypto     },
  };
  let anyAssetInUrl = false;
  for (const asset of EXTRA_ASSETS) {
    const keys = ASSET_QP[asset];
    const on = g(keys.on);
    const val = g(keys.val);
    const ret = g(keys.ret);
    const sd = g(keys.sd);
    const con = g(keys.con);
    if (on != null || val != null || ret != null || sd != null || con != null) {
      anyAssetInUrl = true;
      extraAssets[asset] = {
        on: on === '1',
        val: val ?? EXTRA_ASSET_DEFAULTS[asset].val,
        ret: ret ?? EXTRA_ASSET_DEFAULTS[asset].ret,
        sd:  sd  ?? EXTRA_ASSET_DEFAULTS[asset].sd,
        con: con ?? EXTRA_ASSET_DEFAULTS[asset].con,
      };
    }
  }
  if (anyAssetInUrl) o.extraAssets = extraAssets;

  const aord = g(QP.aOrd);
  if (aord) {
    const parts = aord.split(',').filter(Boolean);
    if (parts.length >= 1) o.allocOrder = parts;
  }

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
  simMode: SimMode;
  mcRunCount: string;
  mcReturnStdDev: string;
  mcInflationStdDev: string;
  histStartYear: number;
  stocksVal: string;
  stocksCon: string;
  extraAssets: Record<ExtraAsset, ExtraAssetState>;
  allocOrder: string[];
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
  if (state.simMode === 'mc') {
    sp.set(QP.sm, 'mc');
    sp.set(QP.mcn, state.mcRunCount);
    sp.set(QP.mcrs, state.mcReturnStdDev);
    sp.set(QP.mcis, state.mcInflationStdDev);
  } else if (state.simMode === 'hist') {
    sp.set(QP.sm, 'hist');
    sp.set(QP.hy, String(state.histStartYear));
  }

  const anyOn = EXTRA_ASSETS.some((a) => state.extraAssets[a].on);
  if (anyOn) {
    sp.set(QP.stV, state.stocksVal);
    sp.set(QP.stCon, state.stocksCon);
    for (const asset of EXTRA_ASSETS) {
      const a = state.extraAssets[asset];
      const keys = ASSET_QP[asset];
      sp.set(keys.on, a.on ? '1' : '0');
      if (a.on) {
        sp.set(keys.val, a.val);
        sp.set(keys.ret, a.ret);
        sp.set(keys.sd, a.sd);
        sp.set(keys.con, a.con);
      }
    }
    const order = state.allocOrder.join(',');
    if (order !== DEFAULT_ALLOC_ORDER.join(',')) {
      sp.set(QP.aOrd, order);
    }
  }

  return sp.toString();
}
