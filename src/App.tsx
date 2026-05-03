import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tr, type Lang } from './i18n';
import { simulate, simulateHistorical, type MCResult, type MonteCarloInput } from './model/simulate';
import { DEFAULTS, MC_DEFAULTS, HIST_DEFAULT_START_YEAR, type XMode, type SimMode } from './constants';
import { parseNum, parseAgeYears, getErrors } from './lib';
import { readUrlState, buildSearchParams } from './url';
import { fetchHistoricalRates, type HistoricalRate } from './data/historical';
import { InputForm } from './components/InputForm';
import { OutcomePanel } from './components/OutcomePanel';
import { SimulationChart } from './components/SimulationChart';
import type { MCWorkerResponse } from './workers/mc.worker';
import './App.css';

export type MCStatus = 'idle' | 'running' | 'done';

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

  const [simMode, setSimMode] = useState<SimMode>(() => urlInit.simMode ?? 'fixed');
  const [histStartYear, setHistStartYear] = useState<number>(
    () => urlInit.histStartYear ?? HIST_DEFAULT_START_YEAR,
  );

  // Monte Carlo params
  const [mcRunCount, setMcRunCount] = useState(() => urlInit.mcRunCount ?? MC_DEFAULTS.mcRunCount);
  const [mcReturnStdDev, setMcReturnStdDev] = useState(() => urlInit.mcReturnStdDev ?? MC_DEFAULTS.mcReturnStdDev);
  const [mcInflationStdDev, setMcInflationStdDev] = useState(
    () => urlInit.mcInflationStdDev ?? MC_DEFAULTS.mcInflationStdDev,
  );

  const mcEnabled = simMode === 'mc';

  // Monte Carlo result state
  const [mcResult, setMcResult] = useState<MCResult | null>(null);
  const [mcStatus, setMcStatus] = useState<MCStatus>('idle');

  // Historical data state
  const [histData, setHistData] = useState<HistoricalRate[] | null>(null);
  const [histDataError, setHistDataError] = useState<string | null>(null);

  // Worker management
  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef(0);

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

  // Terminate worker on unmount
  useEffect(() => {
    return () => { workerRef.current?.terminate(); };
  }, []);

  // Fetch historical data on mount
  useEffect(() => {
    fetchHistoricalRates()
      .then(setHistData)
      .catch((e: unknown) => setHistDataError(String(e)));
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
      simMode,
      mcRunCount,
      mcReturnStdDev,
      mcInflationStdDev,
      histStartYear,
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
    simMode,
    mcRunCount,
    mcReturnStdDev,
    mcInflationStdDev,
    histStartYear,
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
        simMode === 'mc' ? { mcReturnStdDev, mcInflationStdDev } : undefined,
        simMode === 'hist',
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
      simMode,
      mcReturnStdDev,
      mcInflationStdDev,
    ],
  );

  const result = useMemo(() => {
    const baseInput = {
      initialCapital: parseNum(initialCapital),
      monthlyNeedToday: parseNum(monthlyNeedToday),
      monthlyContribution: parseNum(monthlyContribution),
      horizonYears: parseNum(horizonYears),
    };
    if (baseInput.horizonYears < 1) {
      return {
        series: [] as { year: number; capital: number; annualExpenses: number; passiveReturn: number }[],
        crossoverYear: null as number | null,
        truncated: false,
        invalid: true,
      };
    }
    if (simMode === 'hist') {
      if (!histData) {
        return {
          series: [] as { year: number; capital: number; annualExpenses: number; passiveReturn: number }[],
          crossoverYear: null as number | null,
          truncated: false,
          invalid: true,
        };
      }
      const startIdx = histData.findIndex((d) => d.year === histStartYear);
      if (startIdx === -1) {
        return {
          series: [] as { year: number; capital: number; annualExpenses: number; passiveReturn: number }[],
          crossoverYear: null as number | null,
          truncated: false,
          invalid: true,
        };
      }
      const rates = histData.slice(startIdx);
      return { ...simulateHistorical(baseInput, rates), invalid: false };
    }
    const input = {
      ...baseInput,
      annualInflationPercent: parseNum(annualInflationPercent),
      annualReturnPercent: parseNum(annualReturnPercent),
    };
    return { ...simulate(input), truncated: false, invalid: false };
  }, [
    simMode,
    histData,
    histStartYear,
    initialCapital,
    monthlyNeedToday,
    annualInflationPercent,
    monthlyContribution,
    annualReturnPercent,
    horizonYears,
  ]);

  // Compute MC input params (null when MC cannot run)
  const mcInput = useMemo((): MonteCarloInput | null => {
    if (!mcEnabled || result.invalid) return null;
    if (errors.mcReturnStdDev || errors.mcInflationStdDev) return null;
    return {
      initialCapital: parseNum(initialCapital),
      monthlyNeedToday: parseNum(monthlyNeedToday),
      annualInflationPercent: parseNum(annualInflationPercent),
      monthlyContribution: parseNum(monthlyContribution),
      annualReturnPercent: parseNum(annualReturnPercent),
      horizonYears: parseNum(horizonYears),
      returnStdDevPercent: parseNum(mcReturnStdDev),
      inflationStdDevPercent: parseNum(mcInflationStdDev),
      runCount: parseNum(mcRunCount),
    };
  }, [
    mcEnabled,
    result.invalid,
    errors.mcReturnStdDev,
    errors.mcInflationStdDev,
    initialCapital,
    monthlyNeedToday,
    annualInflationPercent,
    monthlyContribution,
    annualReturnPercent,
    horizonYears,
    mcReturnStdDev,
    mcInflationStdDev,
    mcRunCount,
  ]);

  // Launch a worker run; terminates any in-progress run first
  const triggerMCRun = useCallback((params: MonteCarloInput) => {
    workerRef.current?.terminate();
    const id = ++runIdRef.current;
    setMcStatus('running');

    const worker = new Worker(new URL('./workers/mc.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<MCWorkerResponse>) => {
      if (e.data.id !== runIdRef.current) return;
      setMcResult(e.data.result);
      setMcStatus('done');
      worker.terminate();
    };

    worker.postMessage({ id, params });
  }, []);

  // Auto-run with 150 ms debounce whenever mcInput changes
  useEffect(() => {
    if (!mcInput) {
      setMcStatus('idle');
      return;
    }
    const timer = setTimeout(() => triggerMCRun(mcInput), 150);
    return () => clearTimeout(timer);
  }, [mcInput, triggerMCRun]);

  const handleRerunMC = useCallback(() => {
    if (mcInput) triggerMCRun(mcInput);
  }, [mcInput, triggerMCRun]);

  const xTicks = useMemo(() => {
    const h = Math.max(1, parseNum(horizonYears));
    const step = Math.max(1, Math.ceil(h / 6));
    const ticks: number[] = [];
    for (let i = 0; i <= h; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== h) ticks.push(h);
    return ticks;
  }, [horizonYears]);

  const chartData = useMemo(() => {
    const mcSeriesReady = mcEnabled && mcResult && mcResult.series.length === result.series.length;
    if (!mcSeriesReady) {
      return result.series.map((p) => ({
        year: p.year,
        capital: p.capital,
        annualExpenses: p.annualExpenses,
        passiveReturn: p.passiveReturn,
      }));
    }
    return result.series.map((p, i) => {
      const mc = mcResult!.series[i];
      return {
        year: p.year,
        capital: p.capital,
        annualExpenses: p.annualExpenses,
        passiveReturn: p.passiveReturn,
        capitalP10: mc.capitalP10,
        capitalP50: mc.capitalP50,
        capitalBand: Math.max(0, mc.capitalP90 - mc.capitalP10),
        passiveReturnP10: mc.passiveReturnP10,
        passiveReturnP50: mc.passiveReturnP50,
        passiveReturnBand: Math.max(0, mc.passiveReturnP90 - mc.passiveReturnP10),
        expensesP10: mc.expensesP10,
        expensesP50: mc.expensesP50,
        expensesBand: Math.max(0, mc.expensesP90 - mc.expensesP10),
      };
    });
  }, [result, mcResult, mcEnabled]);

  const histEndYear = useMemo(() => {
    if (simMode !== 'hist' || result.series.length === 0) return null;
    return histStartYear + result.series[result.series.length - 1].year;
  }, [simMode, histStartYear, result.series]);

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
        simMode={simMode}
        setSimMode={setSimMode}
        histStartYear={histStartYear}
        setHistStartYear={setHistStartYear}
        histData={histData}
        histDataError={histDataError}
        mcRunCount={mcRunCount}
        setMcRunCount={setMcRunCount}
        mcReturnStdDev={mcReturnStdDev}
        setMcReturnStdDev={setMcReturnStdDev}
        mcInflationStdDev={mcInflationStdDev}
        setMcInflationStdDev={setMcInflationStdDev}
        mcStatus={mcStatus}
        onRerunMC={handleRerunMC}
      />

      <OutcomePanel
        lang={lang}
        result={result}
        resolvedXMode={resolvedXMode}
        ageYears={ageYears}
        horizonYears={horizonYears}
        mcEnabled={mcEnabled}
        mcResult={mcEnabled && mcResult?.series.length === result.series.length ? mcResult : null}
        mcRunCount={mcRunCount}
        simMode={simMode}
        histStartYear={histStartYear}
        histEndYear={histEndYear}
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
        mcResult={mcEnabled && mcResult?.series.length === result.series.length ? mcResult : null}
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
