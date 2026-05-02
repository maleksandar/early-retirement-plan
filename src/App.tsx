import { useEffect, useMemo, useState } from 'react';
import { tr, type Lang } from './i18n';
import { simulate } from './model/simulate';
import { DEFAULTS, type XMode } from './constants';
import { parseNum, parseAgeYears, getErrors } from './lib';
import { readUrlState, buildSearchParams } from './url';
import { InputForm } from './components/InputForm';
import { OutcomePanel } from './components/OutcomePanel';
import { SimulationChart } from './components/SimulationChart';
import './App.css';

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
              <option value='sr'>{tr(lang, 'ui.langOptionSr')}</option>
              <option value='en'>{tr(lang, 'ui.langOptionEn')}</option>
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

      <InputForm
        lang={lang}
        errors={errors}
        initialCapital={initialCapital}
        setInitialCapital={setInitialCapital}
        monthlyNeedToday={monthlyNeedToday}
        setMonthlyNeedToday={setMonthlyNeedToday}
        monthlyContribution={monthlyContribution}
        setMonthlyContribution={setMonthlyContribution}
        annualInflationPercent={annualInflationPercent}
        setAnnualInflationPercent={setAnnualInflationPercent}
        annualReturnPercent={annualReturnPercent}
        setAnnualReturnPercent={setAnnualReturnPercent}
        horizonYears={horizonYears}
        setHorizonYears={setHorizonYears}
        currentAge={currentAge}
        setCurrentAge={setCurrentAge}
      />

      <OutcomePanel
        lang={lang}
        result={result}
        resolvedXMode={resolvedXMode}
        ageYears={ageYears}
        horizonYears={horizonYears}
      />

      <SimulationChart
        lang={lang}
        chartData={chartData}
        chartNarrow={chartNarrow}
        xTicks={xTicks}
        resolvedXMode={resolvedXMode}
        ageYears={ageYears}
        xMode={xMode}
        setXMode={setXMode}
        crossoverYear={result.crossoverYear}
        invalid={result.invalid}
      />

      <footer className='footer'>
        <p dangerouslySetInnerHTML={{ __html: tr(lang, 'footer.modelDisclaimer') }} />
        {ageYears !== null ? (
          <p className='footer-age'>{tr(lang, 'footer.infoBoxAge')}</p>
        ) : null}
        <p className='footer-cookies'>{tr(lang, 'footer.cookiesNote')}</p>
      </footer>
    </div>
  );
}
