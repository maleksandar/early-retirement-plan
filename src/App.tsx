import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { tr, type Lang } from './i18n';
import { simulate } from './model/simulate';
import './App.css';

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULTS = {
  initialCapital: 20_000,
  monthlyNeedToday: 2_500,
  annualInflationPercent: 3,
  monthlyContribution: 3_500,
  annualReturnPercent: 10,
  horizonYears: 15,
};

const SLIDERS = {
  monthlyContribution: { min: 250, max: 10_000, step: 250 },
  monthlyNeedToday: { min: 1_000, max: 10_000, step: 250 },
  annualInflationPercent: { min: 2, max: 15, step: 0.25 },
  annualReturnPercent: { min: 5, max: 20, step: 1 },
  horizonYears: { min: 10, max: 30, step: 5 },
};

type FieldKey =
  | 'initialCapital'
  | 'monthlyNeedToday'
  | 'monthlyContribution'
  | 'annualInflationPercent'
  | 'annualReturnPercent'
  | 'horizonYears';

type XMode = 'rel' | 'cal' | 'age';

const QP = {
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

function parseNum(value: string): number {
  const n = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function formatAxis(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function sliderVal(str: string, cfg: { min: number; max: number }): number {
  return clamp(parseNum(str), cfg.min, cfg.max);
}

function isValidAgeInput(s: string): boolean {
  if (s.trim() === '') return false;
  const n = parseNum(s);
  if (!Number.isFinite(n)) return false;
  if (n !== Math.floor(n)) return false;
  return n >= 0 && n <= 120;
}

function parseAgeYears(s: string): number | null {
  if (!isValidAgeInput(s)) return null;
  return Math.floor(parseNum(s));
}

function readUrlState(): {
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

function buildSearchParams(state: {
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

function getErrors(
  vals: Record<FieldKey, string>,
  currentAge: string,
  lang: Lang,
): Partial<Record<FieldKey | 'currentAge', string>> {
  const errors: Partial<Record<FieldKey | 'currentAge', string>> = {};

  function check(key: FieldKey, val: string, opts: { min?: number; max?: number; nonNeg?: boolean } = {}) {
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
  check('annualInflationPercent', vals.annualInflationPercent, SLIDERS.annualInflationPercent);
  check('annualReturnPercent', vals.annualReturnPercent, SLIDERS.annualReturnPercent);
  check('horizonYears', vals.horizonYears, SLIDERS.horizonYears);

  if (currentAge.trim() !== '' && !isValidAgeInput(currentAge)) {
    errors.currentAge = tr(lang, 'errors.age');
  }

  return errors;
}

function FieldTooltip({ text }: { text: string }) {
  return (
    <span className='tip'>
      <span className='tip-icon' aria-hidden='true'>
        i
      </span>
      <span className='tip-bubble' role='tooltip'>
        {text}
      </span>
    </span>
  );
}

export default function App() {
  const urlInit = readUrlState();

  const [lang, setLang] = useState<Lang>(() => urlInit.lang ?? ((localStorage.getItem('lang') as Lang | null) ?? 'sr'));
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [chartNarrow, setChartNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 560px)').matches : false,
  );

  const [initialCapital, setInitialCapital] = useState(
    () => urlInit.initialCapital ?? String(DEFAULTS.initialCapital),
  );
  const [monthlyNeedToday, setMonthlyNeedToday] = useState(
    () => urlInit.monthlyNeedToday ?? String(DEFAULTS.monthlyNeedToday),
  );
  const [annualInflationPercent, setAnnualInflationPercent] = useState(
    () => urlInit.annualInflationPercent ?? String(DEFAULTS.annualInflationPercent),
  );
  const [monthlyContribution, setMonthlyContribution] = useState(
    () => urlInit.monthlyContribution ?? String(DEFAULTS.monthlyContribution),
  );
  const [annualReturnPercent, setAnnualReturnPercent] = useState(
    () => urlInit.annualReturnPercent ?? String(DEFAULTS.annualReturnPercent),
  );
  const [horizonYears, setHorizonYears] = useState(() => urlInit.horizonYears ?? String(DEFAULTS.horizonYears));
  const [currentAge, setCurrentAge] = useState(() => urlInit.currentAge ?? '');

  const [xMode, setXMode] = useState<XMode>(() => {
    const fromUrl = urlInit.xMode ?? 'rel';
    const age = urlInit.currentAge ?? '';
    if (fromUrl === 'age' && !parseAgeYears(age)) return 'rel';
    return fromUrl;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)');
    const fn = () => setChartNarrow(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const ageYears = useMemo(() => parseAgeYears(currentAge), [currentAge]);

  const resolvedXMode = useMemo((): XMode => {
    if (xMode === 'age') return ageYears !== null ? 'age' : 'rel';
    return xMode;
  }, [xMode, ageYears]);

  useEffect(() => {
    const qs = buildSearchParams({
      lang,
      initialCapital,
      monthlyNeedToday,
      annualInflationPercent,
      monthlyContribution,
      annualReturnPercent,
      horizonYears,
      currentAge,
      xMode: resolvedXMode,
    });
    const path = `${window.location.pathname}?${qs}`;
    window.history.replaceState(null, '', path);
  }, [
    lang,
    initialCapital,
    monthlyNeedToday,
    annualInflationPercent,
    monthlyContribution,
    annualReturnPercent,
    horizonYears,
    currentAge,
    resolvedXMode,
  ]);

  const errors = useMemo(
    () =>
      getErrors(
        {
          initialCapital,
          monthlyNeedToday,
          monthlyContribution,
          annualInflationPercent,
          annualReturnPercent,
          horizonYears,
        },
        currentAge,
        lang,
      ),
    [
      initialCapital,
      monthlyNeedToday,
      monthlyContribution,
      annualInflationPercent,
      annualReturnPercent,
      horizonYears,
      currentAge,
      lang,
    ],
  );

  const result = useMemo(() => {
    const input = {
      initialCapital: parseNum(initialCapital),
      monthlyNeedToday: parseNum(monthlyNeedToday),
      annualInflationPercent: parseNum(annualInflationPercent),
      monthlyContribution: parseNum(monthlyContribution),
      annualReturnPercent: parseNum(annualReturnPercent),
      horizonYears: parseNum(horizonYears),
    };
    if (input.horizonYears < 1) {
      return {
        series: [] as { year: number; capital: number; annualExpenses: number; passiveReturn: number }[],
        crossoverYear: null as number | null,
        invalid: true,
      };
    }
    return { ...simulate(input), invalid: false };
  }, [
    initialCapital,
    monthlyNeedToday,
    annualInflationPercent,
    monthlyContribution,
    annualReturnPercent,
    horizonYears,
  ]);

  const xTicks = useMemo(() => {
    const h = Math.max(1, parseNum(horizonYears));
    const step = Math.max(1, Math.ceil(h / 6));
    const ticks: number[] = [];
    for (let i = 0; i <= h; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== h) ticks.push(h);
    return ticks;
  }, [horizonYears]);

  const chartData = result.series.map((p) => ({
    year: p.year,
    capital: p.capital,
    annualExpenses: p.annualExpenses,
    passiveReturn: p.passiveReturn,
  }));

  const formatX = (v: number) => {
    if (resolvedXMode === 'cal') return String(CURRENT_YEAR + v);
    if (resolvedXMode === 'age' && ageYears !== null) return String(ageYears + v);
    return String(v);
  };

  const xAxisTitle = resolvedXMode === 'age' ? tr(lang, 'chart.labels.age') : tr(lang, 'chart.labels.year');

  const crossoverPoint =
    result.crossoverYear !== null && !result.invalid
      ? (result.series.find((p) => p.year === result.crossoverYear) ?? null)
      : null;
  const finalPoint = result.series.length > 0 ? result.series[result.series.length - 1] : null;

  const py = tr(lang, 'units.perYear');
  const showAgeRadios = ageYears !== null;

  return (
    <div className='app'>
      <header className='header'>
        <div className='header-top'>
          <h1>{tr(lang, 'app.title')}</h1>
          <div className='header-controls'>
            <select
              className='lang-select'
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label={tr(lang, 'ui.langLabel')}
            >
              <option value='sr'>🇷🇸 Srpski</option>
              <option value='en'>🇬🇧 English</option>
            </select>
            <button
              className='theme-btn'
              onClick={() => setDark((d) => !d)}
              title={dark ? tr(lang, 'ui.switchToLight') : tr(lang, 'ui.switchToDark')}
              aria-label={dark ? tr(lang, 'ui.switchToLight') : tr(lang, 'ui.switchToDark')}
            >
              {dark ? '☀' : '☾'}
            </button>
          </div>
        </div>
        <p className='subtitle'>{tr(lang, 'app.subtitle')}</p>
      </header>

      <section className='panel form-panel'>
        <h2>{tr(lang, 'sections.params')}</h2>
        <div className='form-grid'>
          <div className='field'>
            <label className='field-label' htmlFor='initialCapital'>
              <span className='field-label-head'>
                <span className='field-label-text'>{tr(lang, 'form.initialCapital.label')}</span>
                <FieldTooltip text={tr(lang, 'form.initialCapital.tip')} />
              </span>
            </label>
            <div className='field-control'>
              <input
                id='initialCapital'
                type='text'
                inputMode='decimal'
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className={errors.initialCapital ? 'input-error' : ''}
              />
              {errors.initialCapital && <span className='field-error'>{errors.initialCapital}</span>}
            </div>
          </div>

          <div className='field'>
            <label className='field-label' htmlFor='monthlyNeedToday'>
              <span className='field-label-head'>
                <span className='field-label-text'>{tr(lang, 'form.monthlyNeed.label')}</span>
                <FieldTooltip text={tr(lang, 'form.monthlyNeed.tip')} />
              </span>
            </label>
            <div className='field-control'>
              <input
                id='monthlyNeedToday'
                type='text'
                inputMode='decimal'
                value={monthlyNeedToday}
                onChange={(e) => setMonthlyNeedToday(e.target.value)}
                className={errors.monthlyNeedToday ? 'input-error' : ''}
              />
              <input
                type='range'
                min={SLIDERS.monthlyNeedToday.min}
                max={SLIDERS.monthlyNeedToday.max}
                step={SLIDERS.monthlyNeedToday.step}
                value={sliderVal(monthlyNeedToday, SLIDERS.monthlyNeedToday)}
                onChange={(e) => setMonthlyNeedToday(e.target.value)}
              />
              {errors.monthlyNeedToday && <span className='field-error'>{errors.monthlyNeedToday}</span>}
            </div>
          </div>

          <div className='field'>
            <label className='field-label' htmlFor='monthlyContribution'>
              <span className='field-label-head'>
                <span className='field-label-text'>{tr(lang, 'form.monthlyContribution.label')}</span>
                <FieldTooltip text={tr(lang, 'form.monthlyContribution.tip')} />
              </span>
            </label>
            <div className='field-control'>
              <input
                id='monthlyContribution'
                type='text'
                inputMode='decimal'
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className={errors.monthlyContribution ? 'input-error' : ''}
              />
              <input
                type='range'
                min={SLIDERS.monthlyContribution.min}
                max={SLIDERS.monthlyContribution.max}
                step={SLIDERS.monthlyContribution.step}
                value={sliderVal(monthlyContribution, SLIDERS.monthlyContribution)}
                onChange={(e) => setMonthlyContribution(e.target.value)}
              />
              {errors.monthlyContribution && <span className='field-error'>{errors.monthlyContribution}</span>}
            </div>
          </div>

          <div className='field'>
            <label className='field-label' htmlFor='annualInflationPercent'>
              <span className='field-label-head'>
                <span className='field-label-text'>{tr(lang, 'form.inflation.label')}</span>
                <FieldTooltip text={tr(lang, 'form.inflation.tip')} />
              </span>
            </label>
            <div className='field-control'>
              <input
                id='annualInflationPercent'
                type='text'
                inputMode='decimal'
                value={annualInflationPercent}
                onChange={(e) => setAnnualInflationPercent(e.target.value)}
                className={errors.annualInflationPercent ? 'input-error' : ''}
              />
              <input
                type='range'
                min={SLIDERS.annualInflationPercent.min}
                max={SLIDERS.annualInflationPercent.max}
                step={SLIDERS.annualInflationPercent.step}
                value={sliderVal(annualInflationPercent, SLIDERS.annualInflationPercent)}
                onChange={(e) => setAnnualInflationPercent(e.target.value)}
              />
              {errors.annualInflationPercent && <span className='field-error'>{errors.annualInflationPercent}</span>}
            </div>
          </div>

          <div className='field'>
            <label className='field-label' htmlFor='annualReturnPercent'>
              <span className='field-label-head'>
                <span className='field-label-text'>{tr(lang, 'form.return.label')}</span>
                <FieldTooltip text={tr(lang, 'form.return.tip')} />
              </span>
            </label>
            <div className='field-control'>
              <input
                id='annualReturnPercent'
                type='text'
                inputMode='decimal'
                value={annualReturnPercent}
                onChange={(e) => setAnnualReturnPercent(e.target.value)}
                className={errors.annualReturnPercent ? 'input-error' : ''}
              />
              <input
                type='range'
                min={SLIDERS.annualReturnPercent.min}
                max={SLIDERS.annualReturnPercent.max}
                step={SLIDERS.annualReturnPercent.step}
                value={sliderVal(annualReturnPercent, SLIDERS.annualReturnPercent)}
                onChange={(e) => setAnnualReturnPercent(e.target.value)}
              />
              {errors.annualReturnPercent && <span className='field-error'>{errors.annualReturnPercent}</span>}
            </div>
          </div>

          <div className='field'>
            <label className='field-label' htmlFor='horizonYears'>
              <span className='field-label-head'>
                <span className='field-label-text'>{tr(lang, 'form.horizon.label')}</span>
                <FieldTooltip text={tr(lang, 'form.horizon.tip')} />
              </span>
            </label>
            <div className='field-control'>
              <input
                id='horizonYears'
                type='text'
                inputMode='numeric'
                value={horizonYears}
                onChange={(e) => setHorizonYears(e.target.value)}
                className={errors.horizonYears ? 'input-error' : ''}
              />
              <input
                type='range'
                min={SLIDERS.horizonYears.min}
                max={SLIDERS.horizonYears.max}
                step={SLIDERS.horizonYears.step}
                value={sliderVal(horizonYears, SLIDERS.horizonYears)}
                onChange={(e) => setHorizonYears(e.target.value)}
              />
              {errors.horizonYears && <span className='field-error'>{errors.horizonYears}</span>}
            </div>
          </div>

          <div className='field'>
            <label className='field-label' htmlFor='currentAge'>
              <span className='field-label-head'>
                <span className='field-label-text'>{tr(lang, 'form.age.label')}</span>
                <FieldTooltip text={tr(lang, 'form.age.tip')} />
              </span>
            </label>
            <div className='field-control'>
              <input
                id='currentAge'
                type='text'
                inputMode='numeric'
                value={currentAge}
                onChange={(e) => setCurrentAge(e.target.value)}
                className={errors.currentAge ? 'input-error' : ''}
                placeholder=''
              />
              {errors.currentAge && <span className='field-error'>{errors.currentAge}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className='panel outcome-panel'>
        <h2>{tr(lang, 'sections.result')}</h2>
        {result.invalid ? (
          <p className='warning'>{tr(lang, 'result.invalid')}</p>
        ) : crossoverPoint ? (
          <>
            <div className='outcome-headline outcome-headline--success'>
              <span className='outcome-badge outcome-badge--success'>✓</span>
              <div>
                <p className='outcome-title'>
                  {resolvedXMode === 'age' && ageYears !== null
                    ? lang === 'sr'
                      ? `Finansijska sloboda kada napuniš ${ageYears + crossoverPoint.year} god.`
                      : `Financial freedom when you reach age ${ageYears + crossoverPoint.year}`
                    : resolvedXMode === 'cal'
                      ? lang === 'sr'
                        ? `Finansijska sloboda u ${CURRENT_YEAR + crossoverPoint.year}. god.`
                        : `Financial freedom in ${CURRENT_YEAR + crossoverPoint.year}`
                      : lang === 'sr'
                        ? `Finansijska sloboda za ${crossoverPoint.year} god.`
                        : `Financial freedom in ${crossoverPoint.year} years`}
                </p>
                <p className='outcome-sub'>
                  {lang === 'sr'
                    ? 'Godišnji prinos portfolija premašuje inflacijom uvećane troškove.'
                    : 'Annual portfolio return exceeds inflation-adjusted expenses.'}
                </p>
              </div>
            </div>
            <div className='outcome-stats'>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.capitalAt')}</span>
                <span className='stat-value'>{formatMoney(crossoverPoint.capital)}</span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.passiveIncome')}</span>
                <span className='stat-value stat-value--green'>
                  {formatMoney(crossoverPoint.passiveReturn)}
                  <span className='stat-unit'>{py}</span>
                </span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.annualCost')}</span>
                <span className='stat-value'>
                  {formatMoney(crossoverPoint.annualExpenses)}
                  <span className='stat-unit'>{py}</span>
                </span>
              </div>
              {ageYears !== null ? (
                <div className='stat'>
                  <span className='stat-label'>{tr(lang, 'stats.ageAt')}</span>
                  <span className='stat-value'>{ageYears + crossoverPoint.year}</span>
                </div>
              ) : null}
            </div>
            <p className='outcome-note'>
              {lang === 'sr'
                ? `Godišnji suficit: ${formatMoney(crossoverPoint.passiveReturn - crossoverPoint.annualExpenses)} — prinos svake naredne godine premašuje troškove.`
                : `Annual surplus: ${formatMoney(crossoverPoint.passiveReturn - crossoverPoint.annualExpenses)} — return exceeds expenses every year from this point.`}
            </p>
          </>
        ) : finalPoint ? (
          <>
            <div className='outcome-headline outcome-headline--warn'>
              <span className='outcome-badge outcome-badge--warn'>✕</span>
              <div>
                <p className='outcome-title'>
                  {lang === 'sr'
                    ? `Presek nije dostignut za ${horizonYears} god.`
                    : `No crossover within ${horizonYears} years`}
                </p>
                <p className='outcome-sub'>
                  {lang === 'sr'
                    ? 'Pokušaj veći doprinos, manji mesečni cilj ili duži horizont.'
                    : 'Try a higher contribution, lower monthly need, or longer horizon.'}
                </p>
              </div>
            </div>
            <div className='outcome-stats'>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.finalCapital')}</span>
                <span className='stat-value'>{formatMoney(finalPoint.capital)}</span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.maxIncome')}</span>
                <span className='stat-value'>
                  {formatMoney(finalPoint.passiveReturn)}
                  <span className='stat-unit'>{py}</span>
                </span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.finalCost')}</span>
                <span className='stat-value'>
                  {formatMoney(finalPoint.annualExpenses)}
                  <span className='stat-unit'>{py}</span>
                </span>
              </div>
              {ageYears !== null ? (
                <div className='stat'>
                  <span className='stat-label'>{tr(lang, 'stats.ageAt')}</span>
                  <span className='stat-value'>{ageYears + finalPoint.year}</span>
                </div>
              ) : null}
            </div>
            <p className='outcome-note outcome-note--warn'>
              {lang === 'sr'
                ? `Nedostaje još ${formatMoney(finalPoint.annualExpenses - finalPoint.passiveReturn)}/god. da bi prinos pokrio troškove.`
                : `Gap to cover: ${formatMoney(finalPoint.annualExpenses - finalPoint.passiveReturn)}/yr between return and expenses.`}
            </p>
          </>
        ) : (
          <p className='warning'>{tr(lang, 'result.noCrossover')}</p>
        )}
      </section>

      <section className='panel chart-panel'>
        <h2>{tr(lang, 'sections.chart')}</h2>
        <p className='chart-hint'>{tr(lang, 'chart.hint')}</p>
        <div className='axis-mode' role='group' aria-label={tr(lang, 'chart.axisModeLabel')}>
          <span className='axis-mode-title'>{tr(lang, 'chart.axisModeLabel')}</span>
          {showAgeRadios ? (
            <div className='axis-radios'>
              <label className={`axis-radio ${resolvedXMode === 'rel' ? 'axis-radio--on' : ''}`}>
                <input type='radio' name='xmode' checked={xMode === 'rel'} onChange={() => setXMode('rel')} />
                {tr(lang, 'chart.toggles.relative')}
              </label>
              <label className={`axis-radio ${resolvedXMode === 'cal' ? 'axis-radio--on' : ''}`}>
                <input type='radio' name='xmode' checked={xMode === 'cal'} onChange={() => setXMode('cal')} />
                {tr(lang, 'chart.toggles.calendar')}
              </label>
              <label className={`axis-radio ${resolvedXMode === 'age' ? 'axis-radio--on' : ''}`}>
                <input type='radio' name='xmode' checked={xMode === 'age'} onChange={() => setXMode('age')} />
                {tr(lang, 'chart.toggles.age')}
              </label>
            </div>
          ) : (
            <div className='axis-toggle'>
              <span className={resolvedXMode === 'rel' ? 'toggle-label active' : 'toggle-label'}>
                {tr(lang, 'chart.toggles.relative')}
              </span>
              <label className='toggle-switch'>
                <input
                  type='checkbox'
                  checked={resolvedXMode === 'cal'}
                  onChange={(e) => setXMode(e.target.checked ? 'cal' : 'rel')}
                />
                <span className='toggle-track' />
              </label>
              <span className={resolvedXMode === 'cal' ? 'toggle-label active' : 'toggle-label'}>
                {tr(lang, 'chart.toggles.calendar')}
              </span>
            </div>
          )}
        </div>
        <div className='chart-wrap'>
          <ResponsiveContainer width='100%' height={chartNarrow ? 400 : 420}>
            <ComposedChart
              data={chartData}
              margin={{
                top: chartNarrow ? 12 : 10,
                right: chartNarrow ? 4 : 8,
                bottom: chartNarrow ? 28 : 28,
                left: 0,
              }}
            >
              <CartesianGrid strokeDasharray='3 3' strokeOpacity={0.35} />
              <XAxis
                dataKey='year'
                ticks={xTicks}
                tickFormatter={(v) => formatX(v as number)}
                tickMargin={6}
                label={{ value: xAxisTitle, position: 'insideBottom', offset: -10 }}
              />
              <YAxis yAxisId='left' tickFormatter={(v) => formatAxis(v as number)} width={54} tickMargin={4} />
              <YAxis
                yAxisId='right'
                orientation='right'
                tickFormatter={(v) => formatAxis(v as number)}
                width={54}
                tickMargin={4}
              />
              <Tooltip
                formatter={(value, name) => [formatMoney(Number(value ?? 0)), String(name ?? '')]}
                labelFormatter={(y) =>
                  `${resolvedXMode === 'age' ? tr(lang, 'chart.labels.age') : tr(lang, 'chart.labels.year')} ${formatX(y as number)}`
                }
              />
              {!chartNarrow ? (
                <Legend verticalAlign='top' height={30} />
              ) : null}
              <Line
                yAxisId='left'
                type='monotone'
                dataKey='capital'
                name={tr(lang, 'chart.legend.capital')}
                stroke='var(--chart-capital)'
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='annualExpenses'
                name={tr(lang, 'chart.legend.expenses')}
                stroke='var(--chart-expenses)'
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='passiveReturn'
                name={tr(lang, 'chart.legend.return')}
                stroke='var(--chart-return)'
                strokeWidth={2}
                dot={false}
              />
              {result.crossoverYear !== null && !result.invalid ? (
                <ReferenceLine
                  x={result.crossoverYear}
                  stroke='var(--chart-cross)'
                  strokeWidth={2}
                  strokeDasharray='4 4'
                  label={{
                    value: `${tr(lang, 'chart.crossoverLabel')} ${formatX(result.crossoverYear)}`,
                    position: 'insideTopRight',
                    fill: 'var(--text-h)',
                    fontSize: 12,
                  }}
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
          {chartNarrow ? (
            <ul className='chart-legend-external' aria-label={tr(lang, 'chart.legendAria')}>
              <li>
                <span className='chart-legend-swatch' style={{ background: 'var(--chart-capital)' }} />
                {tr(lang, 'chart.legend.capital')}
              </li>
              <li>
                <span className='chart-legend-swatch' style={{ background: 'var(--chart-expenses)' }} />
                {tr(lang, 'chart.legend.expenses')}
              </li>
              <li>
                <span className='chart-legend-swatch' style={{ background: 'var(--chart-return)' }} />
                {tr(lang, 'chart.legend.return')}
              </li>
            </ul>
          ) : null}
        </div>
      </section>

      <footer className='footer'>
        <p>
          {lang === 'sr' ? (
            <>
              Model: na kraju godine kapital se uvećava za prinos i dodaje se 12 × mesečni doprinos. Godišnji troškovi =
              12 × mesečna potreba × (1 + inflacija)<sup>godina</sup>. Prinos = trenutni kapital × godišnja stopa
              (nominalno). Nije finansijski savet.
            </>
          ) : (
            <>
              Model: at year end, capital grows by the return rate and 12 × monthly contribution is added. Annual
              expenses = 12 × monthly need × (1 + inflation)<sup>year</sup>. Return = current capital × annual rate
              (nominal). Not financial advice.
            </>
          )}
        </p>
        {ageYears !== null ? (
          <p className='footer-age'>{tr(lang, 'footer.infoBoxAge')}</p>
        ) : null}
        <p className='footer-cookies'>{tr(lang, 'footer.cookiesNote')}</p>
      </footer>
    </div>
  );
}
