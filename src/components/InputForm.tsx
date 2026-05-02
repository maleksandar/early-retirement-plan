import { type Lang, tr } from '../i18n';
import { SLIDERS, type FieldKey } from '../constants';
import { sliderVal } from '../lib';
import { FieldTooltip } from './FieldTooltip';

interface InputFormProps {
  lang: Lang;
  errors: Partial<Record<FieldKey | 'currentAge', string>>;
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
}: InputFormProps) {
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
    </section>
  );
}
