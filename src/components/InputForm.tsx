import { type Lang, tr, trParams } from '../i18n';
import { SLIDERS, MC_RUN_COUNTS, type FieldKey } from '../constants';
import { sliderVal } from '../lib';
import type { MCFieldKey } from '../lib';
import type { MCStatus } from '../App';
import { FieldTooltip } from './FieldTooltip';

interface InputFormProps {
  lang: Lang;
  errors: Partial<Record<FieldKey | 'currentAge' | MCFieldKey, string>>;
  initialCapital: string;
  setInitialCapital: (v: string) => void;
  monthlyNeedToday: string;
  setMonthlyNeedToday: (v: string) => void;
  monthlyContribution: string;
  setMonthlyContribution: (v: string) => void;
  annualInflationPercent: string;
  setAnnualInflationPercent: (v: string) => void;
  annualReturnPercent: string;
  setAnnualReturnPercent: (v: string) => void;
  horizonYears: string;
  setHorizonYears: (v: string) => void;
  currentAge: string;
  setCurrentAge: (v: string) => void;
  mcEnabled: boolean;
  setMcEnabled: (v: boolean) => void;
  mcRunCount: string;
  setMcRunCount: (v: string) => void;
  mcReturnStdDev: string;
  setMcReturnStdDev: (v: string) => void;
  mcInflationStdDev: string;
  setMcInflationStdDev: (v: string) => void;
  mcStatus: MCStatus;
  onRerunMC: () => void;
}

export function InputForm({
  lang,
  errors,
  initialCapital,
  setInitialCapital,
  monthlyNeedToday,
  setMonthlyNeedToday,
  monthlyContribution,
  setMonthlyContribution,
  annualInflationPercent,
  setAnnualInflationPercent,
  annualReturnPercent,
  setAnnualReturnPercent,
  horizonYears,
  setHorizonYears,
  currentAge,
  setCurrentAge,
  mcEnabled,
  setMcEnabled,
  mcRunCount,
  setMcRunCount,
  mcReturnStdDev,
  setMcReturnStdDev,
  mcInflationStdDev,
  setMcInflationStdDev,
  mcStatus,
  onRerunMC,
}: InputFormProps) {
  const runsFormatted = Number(mcRunCount).toLocaleString();
  return (
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

      <div className='mc-section'>
        <div className='mc-toggle-row'>
          <span className='mc-toggle-label'>
            <span>{tr(lang, 'form.mc.toggleLabel')}</span>
            <FieldTooltip text={tr(lang, 'form.mc.toggleTip')} />
          </span>
          <label className='toggle-switch'>
            <input type='checkbox' checked={mcEnabled} onChange={(e) => setMcEnabled(e.target.checked)} />
            <span className='toggle-track' />
          </label>
        </div>

        {mcEnabled && (
          <>
            <div className='form-grid mc-params-grid'>
              <div className='field'>
                <label className='field-label' htmlFor='mcRunCount'>
                  <span className='field-label-head'>
                    <span className='field-label-text'>{tr(lang, 'form.mc.runCount.label')}</span>
                    <FieldTooltip text={tr(lang, 'form.mc.runCount.tip')} />
                  </span>
                </label>
                <div className='field-control'>
                  <select
                    id='mcRunCount'
                    className='mc-select'
                    value={mcRunCount}
                    onChange={(e) => setMcRunCount(e.target.value)}
                  >
                    {MC_RUN_COUNTS.map((n) => (
                      <option key={n} value={n}>
                        {Number(n).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='field'>
                <label className='field-label' htmlFor='mcReturnStdDev'>
                  <span className='field-label-head'>
                    <span className='field-label-text'>{tr(lang, 'form.mc.returnStdDev.label')}</span>
                    <FieldTooltip text={tr(lang, 'form.mc.returnStdDev.tip')} />
                  </span>
                </label>
                <div className='field-control'>
                  <input
                    id='mcReturnStdDev'
                    type='text'
                    inputMode='decimal'
                    value={mcReturnStdDev}
                    onChange={(e) => setMcReturnStdDev(e.target.value)}
                    className={errors.mcReturnStdDev ? 'input-error' : ''}
                  />
                  {errors.mcReturnStdDev && <span className='field-error'>{errors.mcReturnStdDev}</span>}
                </div>
              </div>

              <div className='field'>
                <label className='field-label' htmlFor='mcInflationStdDev'>
                  <span className='field-label-head'>
                    <span className='field-label-text'>{tr(lang, 'form.mc.inflationStdDev.label')}</span>
                    <FieldTooltip text={tr(lang, 'form.mc.inflationStdDev.tip')} />
                  </span>
                </label>
                <div className='field-control'>
                  <input
                    id='mcInflationStdDev'
                    type='text'
                    inputMode='decimal'
                    value={mcInflationStdDev}
                    onChange={(e) => setMcInflationStdDev(e.target.value)}
                    className={errors.mcInflationStdDev ? 'input-error' : ''}
                  />
                  {errors.mcInflationStdDev && <span className='field-error'>{errors.mcInflationStdDev}</span>}
                </div>
              </div>
            </div>

            <div className='mc-run-row'>
              <button
                className='mc-run-btn'
                onClick={onRerunMC}
                disabled={mcStatus === 'running'}
                aria-label={tr(lang, 'form.mc.runButton')}
              >
                <span className={mcStatus === 'running' ? 'mc-spinner' : 'mc-rerun-icon'} aria-hidden='true'>
                  {mcStatus === 'running' ? '⟳' : '↺'}
                </span>
                {tr(lang, 'form.mc.runButton')}
              </button>
              {mcStatus === 'running' && (
                <span className='mc-status mc-status--running'>
                  {trParams(lang, 'form.mc.statusRunning', { runs: runsFormatted })}
                </span>
              )}
              {mcStatus === 'done' && (
                <span className='mc-status mc-status--done'>
                  ✓ {trParams(lang, 'form.mc.statusDone', { runs: runsFormatted })}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
