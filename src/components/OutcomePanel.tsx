import { type Lang, tr, trParams } from '../i18n';
import { CURRENT_YEAR, type XMode } from '../constants';
import { formatMoney } from '../lib';
import type { YearPoint } from '../model/simulate';

interface OutcomePanelProps {
  lang: Lang;
  result: {
    series: YearPoint[];
    crossoverYear: number | null;
    invalid: boolean;
  };
  resolvedXMode: XMode;
  ageYears: number | null;
  horizonYears: string;
}

export function OutcomePanel({ lang, result, resolvedXMode, ageYears, horizonYears }: OutcomePanelProps) {
  const crossoverPoint =
    result.crossoverYear !== null && !result.invalid
      ? (result.series.find((p) => p.year === result.crossoverYear) ?? null)
      : null;
  const finalPoint = result.series.length > 0 ? result.series[result.series.length - 1] : null;
  const py = tr(lang, 'units.perYear');

  return (
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
    </section>
  );
}
