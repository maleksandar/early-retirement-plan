import { type Lang, tr, trParams } from '../i18n';
import { CURRENT_YEAR, type SimMode } from '../constants';
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
  ageYears: number | null;
  horizonYears: string;
  mcEnabled: boolean;
  mcResult: MCResult | null;
  mcRunCount: string;
  simMode: SimMode;
  histStartYear?: number;
  histEndYear?: number | null;
}

export function OutcomePanel({
  lang,
  result,
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
      if (ageYears !== null) {
        return trParams(lang, 'result.mc.crossoverTitleAge', {
          years: p50CrossoverYear,
          year: CURRENT_YEAR + p50CrossoverYear,
          age: ageYears + p50CrossoverYear,
        });
      }
      return trParams(lang, 'result.mc.crossoverTitle', {
        years: p50CrossoverYear,
        year: CURRENT_YEAR + p50CrossoverYear,
      });
    };

    const crossoverRange = () => {
      if (crossoverP10Year === null || crossoverP90Year === null) return null;
      if (ageYears !== null) {
        return trParams(lang, 'result.mc.crossoverRangeCombinedAge', {
          p10: crossoverP10Year,
          p90: crossoverP90Year,
          a10: ageYears + crossoverP10Year,
          a90: ageYears + crossoverP90Year,
        });
      }
      return trParams(lang, 'result.mc.crossoverRangeCombined', {
        p10: crossoverP10Year,
        p90: crossoverP90Year,
        cy10: CURRENT_YEAR + crossoverP10Year,
        cy90: CURRENT_YEAR + crossoverP90Year,
      });
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
                <span className='stat-label'>{tr(lang, 'stats.yearsFromNow')}</span>
                <span className='stat-value'>{p50CrossoverYear}</span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.calendarYear')}</span>
                <span className='stat-value'>{CURRENT_YEAR + p50CrossoverYear!}</span>
              </div>
              {ageYears !== null && (
                <div className='stat'>
                  <span className='stat-label'>{tr(lang, 'stats.ageAt')}</span>
                  <span className='stat-value'>{ageYears + p50CrossoverYear!}</span>
                </div>
              )}
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
                <span className='stat-label'>{tr(lang, 'stats.yearsFromNow')}</span>
                <span className='stat-value'>{mcFinalPoint?.year}</span>
              </div>
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.calendarYear')}</span>
                <span className='stat-value'>{mcFinalPoint ? CURRENT_YEAR + mcFinalPoint.year : '—'}</span>
              </div>
              {ageYears !== null && mcFinalPoint && (
                <div className='stat'>
                  <span className='stat-label'>{tr(lang, 'stats.ageAt')}</span>
                  <span className='stat-value'>{ageYears + mcFinalPoint.year}</span>
                </div>
              )}
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
                {ageYears !== null
                  ? trParams(lang, 'result.outcome.crossoverTitleAge', {
                      years: crossoverPoint.year,
                      year: CURRENT_YEAR + crossoverPoint.year,
                      age: ageYears + crossoverPoint.year,
                    })
                  : trParams(lang, 'result.outcome.crossoverTitle', {
                      years: crossoverPoint.year,
                      year: CURRENT_YEAR + crossoverPoint.year,
                    })}
              </p>
              <p className='outcome-sub'>{tr(lang, 'result.outcome.crossoverSub')}</p>
            </div>
          </div>
          <div className='outcome-stats'>
            <div className='stat'>
              <span className='stat-label'>{tr(lang, 'stats.yearsFromNow')}</span>
              <span className='stat-value'>{crossoverPoint.year}</span>
            </div>
            <div className='stat'>
              <span className='stat-label'>{tr(lang, 'stats.calendarYear')}</span>
              <span className='stat-value'>{CURRENT_YEAR + crossoverPoint.year}</span>
            </div>
            {ageYears !== null && (
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.ageAt')}</span>
                <span className='stat-value'>{ageYears + crossoverPoint.year}</span>
              </div>
            )}
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
              <span className='stat-label'>{tr(lang, 'stats.yearsFromNow')}</span>
              <span className='stat-value'>{finalPoint.year}</span>
            </div>
            <div className='stat'>
              <span className='stat-label'>{tr(lang, 'stats.calendarYear')}</span>
              <span className='stat-value'>{CURRENT_YEAR + finalPoint.year}</span>
            </div>
            {ageYears !== null && (
              <div className='stat'>
                <span className='stat-label'>{tr(lang, 'stats.ageAt')}</span>
                <span className='stat-value'>{ageYears + finalPoint.year}</span>
              </div>
            )}
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
