import {
  Area,
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
import { type Lang, tr } from '../i18n';
import { CURRENT_YEAR, type XMode } from '../constants';
import { formatMoney, formatAxis } from '../lib';
import type { MCResult } from '../model/simulate';

interface ChartPoint {
  year: number;
  capital: number;
  annualExpenses: number;
  passiveReturn: number;
  capitalP10?: number;
  capitalP50?: number;
  capitalBand?: number;
  passiveReturnP10?: number;
  passiveReturnP50?: number;
  passiveReturnBand?: number;
  expensesP10?: number;
  expensesP50?: number;
  expensesBand?: number;
}

interface SimulationChartProps {
  lang: Lang;
  chartData: ChartPoint[];
  chartNarrow: boolean;
  xTicks: number[];
  resolvedXMode: XMode;
  ageYears: number | null;
  xMode: XMode;
  setXMode: (mode: XMode) => void;
  crossoverYear: number | null;
  invalid: boolean;
  mcResult: MCResult | null;
}

const MC_BAND_KEYS = new Set(['capitalP10', 'capitalBand', 'passiveReturnP10', 'passiveReturnBand', 'expensesP10', 'expensesBand']);

export function SimulationChart({
  lang,
  chartData,
  chartNarrow,
  xTicks,
  resolvedXMode,
  ageYears,
  xMode,
  setXMode,
  crossoverYear,
  invalid,
  mcResult,
}: SimulationChartProps) {
  const showAgeRadios = ageYears !== null;
  const isMC = mcResult !== null;

  const formatX = (v: number) => {
    if (resolvedXMode === 'cal') return String(CURRENT_YEAR + v);
    if (resolvedXMode === 'age' && ageYears !== null) return String(ageYears + v);
    return String(v);
  };

  const xAxisTitle = resolvedXMode === 'age' ? tr(lang, 'chart.labels.age') : tr(lang, 'chart.labels.year');

  const activeCrossover = isMC ? mcResult.p50CrossoverYear : crossoverYear;

  return (
    <section className='panel chart-panel'>
      <h2>{tr(lang, 'sections.chart')}</h2>
      <p className='chart-hint'>{tr(lang, isMC ? 'chart.hintMc' : 'chart.hint')}</p>
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
              formatter={(value, name, props) => {
                if (MC_BAND_KEYS.has(props.dataKey as string)) return null;
                return [formatMoney(Number(value ?? 0)), String(name ?? '')];
              }}
              labelFormatter={(y) =>
                `${resolvedXMode === 'age' ? tr(lang, 'chart.labels.age') : tr(lang, 'chart.labels.year')} ${formatX(y as number)}`
              }
            />
            {!chartNarrow ? <Legend verticalAlign='top' height={30} /> : null}

            {isMC ? (
              <>
                {/* Capital band (p10–p90) */}
                <Area
                  yAxisId='left'
                  type='monotone'
                  dataKey='capitalP10'
                  stackId='cap'
                  fill='transparent'
                  stroke='none'
                  legendType='none'
                  name='capitalP10'
                  isAnimationActive={false}
                />
                <Area
                  yAxisId='left'
                  type='monotone'
                  dataKey='capitalBand'
                  stackId='cap'
                  fill='var(--chart-capital)'
                  fillOpacity={0.18}
                  stroke='none'
                  name={tr(lang, 'chart.legend.capitalBand')}
                  isAnimationActive={false}
                />
                {/* Capital median line */}
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='capitalP50'
                  name={tr(lang, 'chart.legend.capitalP50')}
                  stroke='var(--chart-capital)'
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {/* Expenses band (p10–p90) */}
                <Area
                  yAxisId='right'
                  type='monotone'
                  dataKey='expensesP10'
                  stackId='exp'
                  fill='transparent'
                  stroke='none'
                  legendType='none'
                  name='expensesP10'
                  isAnimationActive={false}
                />
                <Area
                  yAxisId='right'
                  type='monotone'
                  dataKey='expensesBand'
                  stackId='exp'
                  fill='var(--chart-expenses)'
                  fillOpacity={0.18}
                  stroke='none'
                  name={tr(lang, 'chart.legend.expensesBand')}
                  isAnimationActive={false}
                />
                {/* Expenses median line */}
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='expensesP50'
                  name={tr(lang, 'chart.legend.expensesP50')}
                  stroke='var(--chart-expenses)'
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {/* Return band (p10–p90) */}
                <Area
                  yAxisId='right'
                  type='monotone'
                  dataKey='passiveReturnP10'
                  stackId='ret'
                  fill='transparent'
                  stroke='none'
                  legendType='none'
                  name='passiveReturnP10'
                  isAnimationActive={false}
                />
                <Area
                  yAxisId='right'
                  type='monotone'
                  dataKey='passiveReturnBand'
                  stackId='ret'
                  fill='var(--chart-return)'
                  fillOpacity={0.18}
                  stroke='none'
                  name={tr(lang, 'chart.legend.returnBand')}
                  isAnimationActive={false}
                />
                {/* Return median line */}
                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='passiveReturnP50'
                  name={tr(lang, 'chart.legend.returnP50')}
                  stroke='var(--chart-return)'
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <>
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
              </>
            )}

            {activeCrossover !== null && !invalid ? (
              <ReferenceLine
                x={activeCrossover}
                stroke='var(--chart-cross)'
                strokeWidth={2}
                strokeDasharray='4 4'
                label={{
                  value: `${tr(lang, 'chart.crossoverLabel')} ${formatX(activeCrossover)}`,
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
            {isMC ? (
              <>
                <li>
                  <span className='chart-legend-swatch chart-legend-swatch--band' style={{ background: 'var(--chart-capital)' }} />
                  {tr(lang, 'chart.legend.capitalBand')}
                </li>
                <li>
                  <span className='chart-legend-swatch' style={{ background: 'var(--chart-capital)' }} />
                  {tr(lang, 'chart.legend.capitalP50')}
                </li>
                <li>
                  <span className='chart-legend-swatch chart-legend-swatch--band' style={{ background: 'var(--chart-expenses)' }} />
                  {tr(lang, 'chart.legend.expensesBand')}
                </li>
                <li>
                  <span className='chart-legend-swatch' style={{ background: 'var(--chart-expenses)' }} />
                  {tr(lang, 'chart.legend.expensesP50')}
                </li>
                <li>
                  <span className='chart-legend-swatch chart-legend-swatch--band' style={{ background: 'var(--chart-return)' }} />
                  {tr(lang, 'chart.legend.returnBand')}
                </li>
                <li>
                  <span className='chart-legend-swatch' style={{ background: 'var(--chart-return)' }} />
                  {tr(lang, 'chart.legend.returnP50')}
                </li>
              </>
            ) : (
              <>
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
              </>
            )}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
