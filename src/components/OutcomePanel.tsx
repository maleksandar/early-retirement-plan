import { type Lang, tr, trParams } from '../i18n';
import { CURRENT_YEAR, type XMode, type SimMode } from '../constants';
import { formatMoney } from '../lib';
import type { YearPoint, MCResult } from '../model/simulate';

interface OutcomePanelProps {
  lang: Lang;
  result: {
    series: YearPoint[];
    crossoverYear: number | null;
    invalid: boolean;
    truncated?: boolean;
  };
  resolvedXMode: XMode;
  ageYears: number | null;
  horizonYears: string;
  mcEnabled: boolean;
  mcResult: MCResult | null;
  mcRunCount: string;
  simMode: SimMode;
  histStartYear?: number;
  histEndYear?: number | null;
}

function formatXMode(year: number, resolvedXMode: XMode, ageYears: number | null): string {
  if (resolvedXMode === 'cal') return String(CURRENT_YEAR + year);
  if (resolvedXMode === 'age' && ageYears !== null) return String(ageYears + year);
  return String(year);
}

export function OutcomePanel({
  lang,
  result,
  resolvedXMode,
  ageYears,
  horizonYears,
  mcEnabled,
  mcResult,
  mcRunCount,
  simMode,
  histStartYear,
  histEndYear,
}: OutcomePanelProps) {
  const crossoverPoint =
    result.crossoverYear !== null && !result.invalid
      ? (result.series.find((p) => p.year === result.crossoverYear) ?? null)
      : null;
  const finalPoint = result.series.length > 0 ? result.series[result.series.length - 1] : null;
  const py = tr(lang, 'units.perYear');

  if (result.invalid) {
    return (
      <section className='panel outcome-panel'>
        <h2>{tr(lang, 'sections.result')}</h2>
        <p className='warning'>{tr(lang, 'result.invalid')}</p>
      </section>
    );
  }

  // ── Monte Carlo mode ────────────────────────────────────────────────────────
  if (mcEnabled && mcResult) {
    const { p50CrossoverYear, crossoverP10Year, crossoverP90Year, successRate, series: mcSeries } = mcResult;
    const mcFinalPoint = mcSeries[mcSeries.length - 1];
    const successPct = Math.round(successRate * 100);
    const runs = Number(mcRunCount).toLocaleString();

    const crossoverTitle = () => {
      if (p50CrossoverYear === null) return null;
      if (resolvedXMode === 'age' && ageYears !== null) {
        return trParams(lang, 'result.mc.crossoverTitleByAge', { age: ageYears + p50CrossoverYear });
      }
      if (resolvedXMode === 'cal') {
        return trParams(lang, 'result.mc.crossoverTitleByCalendar', { year: CURRENT_YEAR + p50CrossoverYear });
      }
      return trParams(lang, 'result.mc.crossoverTitleRelative', { years: p50CrossoverYear });
    };

    const crossoverRange = () => {
      if (crossoverP10Year === null || crossoverP90Year === null) return null;
      const p10 = formatXMode(crossoverP10Year, resolvedXMode, ageYears);
      const p90 = formatXMode(crossoverP90Year, resolvedXMode, ageYears);
      if (resolvedXMode === 'age' && ageYears !== null) {
        return trParams(lang, 'result.mc.crossoverRangeByAge', { p10, p90 });
      }
      if (resolvedXMode === 'cal') {
        return trParams(lang, 'result.mc.crossoverRangeByCalendar', { p10, p90 });
      }
      return trParams(lang, 'result.mc.crossoverRange', { p10, p90 });
    };

    const mcCrossoverMcPoint =
      p50CrossoverYear !== null ? (mcSeries.find((p) => p.year === p50CrossoverYear) ?? null) : null;

    const hasCrossover = p50CrossoverYear !== null;

    return (
      <section className='panel outcome-panel'>
        <h2>{tr(lang, 'sections.result')}</h2>

        {hasCrossover ? (
          <>
            <div className='outcome-headline outcome-headline--success'>
              <span className='outcome-badge outcome-badge--success'>✓</span>
              <div>
                <p className='outcome-title'>{crossoverTitle()}</p>
                <p className='outcome-sub'>{tr(lang, 'result.mc.crossoverSub')}</p>
                {crossoverRange() && <p className='outcome-range'>{crossoverRange()}</p>}
              </div>
            </div>
            <div className='outcome-stats'>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.capitalAt')}</span>
                <span className='stat-value'>{formatMoney(mcCrossoverMcPoint?.capitalP50 ?? 0)}</span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.passiveIncome')}</span>
                <span className='stat-value stat-value--green'>
                  {formatMoney(mcCrossoverMcPoint?.passiveReturnP50 ?? 0)}
                  <span className='stat-unit'>{py}</span>
                </span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.annualCost')}</span>
                <span className='stat-value'>
                  {formatMoney(mcCrossoverMcPoint?.expensesP50 ?? 0)}
                  <span className='stat-unit'>{py}</span>
                </span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'result.mc.successRate')}</span>
                <span className='stat-value stat-value--green'>
                  {trParams(lang, 'result.mc.successRateValue', { pct: successPct, runs })}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className='outcome-headline outcome-headline--warn'>
              <span className='outcome-badge outcome-badge--warn'>✕</span>
              <div>
                <p className='outcome-title'>
                  {trParams(lang, 'result.mc.noCrossoverTitle', { years: horizonYears })}
                </p>
                <p className='outcome-sub'>{tr(lang, 'result.mc.noCrossoverSub')}</p>
              </div>
            </div>
            <div className='outcome-stats'>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.finalCapital')}</span>
                <span className='stat-value'>{formatMoney(mcFinalPoint?.capitalP50 ?? 0)}</span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.maxIncome')}</span>
                <span className='stat-value'>
                  {formatMoney(mcFinalPoint?.passiveReturnP50 ?? 0)}
                  <span className='stat-unit'>{py}</span>
                </span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.finalCost')}</span>
                <span className='stat-value'>
                  {formatMoney(mcFinalPoint?.expensesP50 ?? 0)}
                  <span className='stat-unit'>{py}</span>
                </span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'result.mc.successRate')}</span>
                <span className='stat-value'>
                  {trParams(lang, 'result.mc.successRateValue', { pct: successPct, runs })}
                </span>
              </div>
            </div>
            <p className='outcome-note outcome-note--warn'>
              {trParams(lang, 'result.mc.noCrossoverGap', {
                amount: formatMoney(
                  (mcFinalPoint?.expensesP50 ?? 0) - (mcFinalPoint?.passiveReturnP50 ?? 0),
                ),
              })}
            </p>
          </>
        )}

        <p className='outcome-mc-note'>
          {trParams(lang, 'result.mc.modeNote', { runs })}
        </p>
      </section>
    );
  }

  // ── Deterministic / Historical mode ─────────────────────────────────────────
  const histNote = simMode === 'hist' && histStartYear != null && histEndYear != null ? (
    <p className='outcome-mc-note'>
      {trParams(lang, 'result.hist.modeNote', { startYear: histStartYear, endYear: histEndYear })}
      {result.truncated
        ? ` · ${trParams(lang, 'result.hist.truncated', { years: result.series.length - 1, endYear: histEndYear })}`
        : ''}
    </p>
  ) : null;

  return (
    <section className='panel outcome-panel'>
      <h2>{tr(lang, 'sections.result')}</h2>
      {crossoverPoint ? (
        <>
          <div className='outcome-headline outcome-headline--success'>
            <span className='outcome-badge outcome-badge--success'>✓</span>
            <div>
              <p className='outcome-title'>
                {resolvedXMode === 'age' && ageYears !== null
                  ? trParams(lang, 'result.outcome.crossoverTitleByAge', {
                      age: ageYears + crossoverPoint.year,
                    })
                  : resolvedXMode === 'cal'
                    ? trParams(lang, 'result.outcome.crossoverTitleByCalendar', {
                        year: CURRENT_YEAR + crossoverPoint.year,
                      })
                    : trParams(lang, 'result.outcome.crossoverTitleRelative', { years: crossoverPoint.year })}
              </p>
              <p className='outcome-sub'>{tr(lang, 'result.outcome.crossoverSub')}</p>
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
            {trParams(lang, 'result.outcome.crossoverSurplus', {
              amount: formatMoney(crossoverPoint.passiveReturn - crossoverPoint.annualExpenses),
            })}
          </p>
        </>
      ) : finalPoint ? (
        <>
          <div className='outcome-headline outcome-headline--warn'>
            <span className='outcome-badge outcome-badge--warn'>✕</span>
            <div>
              <p className='outcome-title'>
                {trParams(lang, 'result.outcome.noCrossoverTitle', { years: horizonYears })}
              </p>
              <p className='outcome-sub'>{tr(lang, 'result.outcome.noCrossoverSub')}</p>
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
            {trParams(lang, 'result.outcome.noCrossoverGap', {
              amount: formatMoney(finalPoint.annualExpenses - finalPoint.passiveReturn),
            })}
          </p>
        </>
      ) : (
        <p className='warning'>{tr(lang, 'result.noCrossover')}</p>
      )}
      {histNote}
    </section>
  );
}
