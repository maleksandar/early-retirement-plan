import { useRef, useCallback } from 'react';
import { type Lang, tr, trParams } from '../i18n';
import {
  SLIDERS,
  MC_RUN_COUNTS,
  HIST_LAST_YEAR,
  type SimMode,
  EXTRA_ASSETS,
  type ExtraAsset,
  type ExtraAssetState,
  ASSET_COLORS,
} from '../constants';
import { sliderVal, clamp, parseNum } from '../lib';
import type { AllErrors } from '../lib';
import type { MCStatus } from '../App';
import type { HistoricalRate } from '../data/historical';
import { FieldTooltip } from './FieldTooltip';

const MC_SLIDERS = {
  mcReturnStdDev: { min: 1, max: 20, step: 1 },
  mcInflationStdDev: { min: 0.5, max: 10, step: 0.5 },
} as const;

const ASSET_RETURN_SLIDER = { min: 0, max: 30, step: 0.5 };
const ASSET_SD_SLIDER = { min: 0, max: 100, step: 1 };
const ASSET_VAL_SLIDER = { min: 100, max: 200_000, step: 100 };

const ASSET_LABEL_KEYS: Record<ExtraAsset, string> = {
  bonds:      'form.assetAllocation.bondsLabel',
  realestate: 'form.assetAllocation.realestateLabel',
  gold:       'form.assetAllocation.goldLabel',
  silver:     'form.assetAllocation.silverLabel',
  crypto:     'form.assetAllocation.cryptoLabel',
};

interface InputFormProps {
  lang: Lang;
  errors: AllErrors;
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
  simMode: SimMode;
  setSimMode: (v: SimMode) => void;
  histStartYear: number;
  setHistStartYear: (v: number) => void;
  histMinYear: number;
  histData: HistoricalRate[] | null;
  histDataError: string | null;
  mcRunCount: string;
  setMcRunCount: (v: string) => void;
  mcReturnStdDev: string;
  setMcReturnStdDev: (v: string) => void;
  mcInflationStdDev: string;
  setMcInflationStdDev: (v: string) => void;
  mcStatus: MCStatus;
  onRerunMC: () => void;
  // multi-asset
  multiAssetMode: boolean;
  blendedCapital: number;
  blendedContribution: number;
  blendedReturnNum: number;
  blendedStdDevNum: number;
  extraAssets: Record<ExtraAsset, ExtraAssetState>;
  stocksVal: string;
  setStocksVal: (v: string) => void;
  stocksCon: string;
  setStocksCon: (v: string) => void;
  allocOrder: string[];
  setAllocOrder: (v: string[]) => void;
  onToggleAsset: (asset: ExtraAsset, on: boolean) => void;
  onUpdateAsset: (asset: ExtraAsset, field: keyof ExtraAssetState, value: string | boolean) => void;
  cryptoClampNotice: boolean;
  onDismissCryptoClamp: () => void;
}

// ── Allocation Bar ────────────────────────────────────────────────────────────

interface BarSegment {
  key: string;
  label: string;
  color: string;
  value: number;
  pct: number;
}

interface AllocationBarProps {
  segments: BarSegment[];
  onDragRebalance: (leftKey: string, rightKey: string, deltaValue: number) => void;
  onMoveLeft: (key: string) => void;
  onMoveRight: (key: string) => void;
}

function AllocationBar({ segments, onDragRebalance, onMoveLeft, onMoveRight }: AllocationBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    leftKey: string;
    rightKey: string;
    leftVal: number;
    rightVal: number;
    startX: number;
    barWidth: number;
    total: number;
  } | null>(null);

  const handleDividerPointerDown = useCallback(
    (e: React.PointerEvent, leftKey: string, rightKey: string, leftVal: number, rightVal: number, total: number) => {
      e.preventDefault();
      const bar = barRef.current;
      if (!bar) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = {
        leftKey,
        rightKey,
        leftVal,
        rightVal,
        startX: e.clientX,
        barWidth: bar.getBoundingClientRect().width,
        total,
      };
    },
    [],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const deltaValue = (dx / ds.barWidth) * ds.total;
    const MIN = 100;
    const clampedDelta = Math.max(-(ds.leftVal - MIN), Math.min(ds.rightVal - MIN, deltaValue));
    onDragRebalance(ds.leftKey, ds.rightKey, clampedDelta);
    // Update baseline so drag feels continuous
    ds.leftVal += clampedDelta;
    ds.rightVal -= clampedDelta;
    ds.startX = e.clientX;
  }, [onDragRebalance]);

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div
      className='alloc-bar-wrap'
      ref={barRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className='alloc-bar'>
        {segments.map((seg, i) => (
          <div
            key={seg.key}
            className='alloc-bar-seg'
            style={{ flex: `0 0 ${seg.pct}%`, background: seg.color }}
          >
            {seg.pct > 8 && (
              <span className='alloc-bar-label'>
                {seg.pct > 14 ? seg.label + ' ' : ''}{Math.round(seg.pct)}%
              </span>
            )}
            {i < segments.length - 1 && (
              <div
                className='alloc-bar-divider'
                onPointerDown={(e) =>
                  handleDividerPointerDown(
                    e,
                    seg.key,
                    segments[i + 1].key,
                    seg.value,
                    segments[i + 1].value,
                    total,
                  )
                }
              />
            )}
          </div>
        ))}
      </div>
      <div className='alloc-bar-legend'>
        {segments.map((seg, i) => (
          <div key={seg.key} className='alloc-bar-legend-item'>
            <span className='alloc-bar-legend-dot' style={{ background: seg.color }} />
            <span className='alloc-bar-legend-name'>{seg.label}</span>
            <div className='alloc-bar-legend-arrows'>
              <button
                type='button'
                className='alloc-bar-arrow'
                onClick={() => onMoveLeft(seg.key)}
                disabled={i === 0}
                aria-label={`Move ${seg.label} left`}
              >
                ←
              </button>
              <button
                type='button'
                className='alloc-bar-arrow'
                onClick={() => onMoveRight(seg.key)}
                disabled={i === segments.length - 1}
                aria-label={`Move ${seg.label} right`}
              >
                →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────────────────────

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
  simMode,
  setSimMode,
  histStartYear,
  setHistStartYear,
  histMinYear,
  histData,
  histDataError,
  mcRunCount,
  setMcRunCount,
  mcReturnStdDev,
  setMcReturnStdDev,
  mcInflationStdDev,
  setMcInflationStdDev,
  mcStatus,
  onRerunMC,
  multiAssetMode,
  blendedCapital,
  blendedContribution,
  blendedReturnNum,
  blendedStdDevNum,
  extraAssets,
  stocksVal,
  setStocksVal,
  stocksCon,
  setStocksCon,
  allocOrder,
  setAllocOrder,
  onToggleAsset,
  onUpdateAsset,
  cryptoClampNotice,
  onDismissCryptoClamp,
}: InputFormProps) {
  const runsFormatted = Number(mcRunCount).toLocaleString();
  const histMode = simMode === 'hist';
  const mcMode = simMode === 'mc';

  // Build allocation bar segments
  const activeAssetKeys = allocOrder.filter(
    (k) => k === 'stocks' || (EXTRA_ASSETS as readonly string[]).includes(k) && extraAssets[k as ExtraAsset].on,
  );

  const totalAllocVal = multiAssetMode
    ? parseNum(stocksVal) + EXTRA_ASSETS.filter((a) => extraAssets[a].on).reduce((s, a) => s + parseNum(extraAssets[a].val), 0)
    : 0;

  const totalAllocCon = multiAssetMode
    ? parseNum(stocksCon) + EXTRA_ASSETS.filter((a) => extraAssets[a].on).reduce((s, a) => s + parseNum(extraAssets[a].con), 0)
    : 0;

  const barSegments: BarSegment[] = multiAssetMode && activeAssetKeys.length >= 2
    ? activeAssetKeys.map((k) => {
        const val = k === 'stocks' ? parseNum(stocksVal) : parseNum(extraAssets[k as ExtraAsset].val);
        const pct = totalAllocVal > 0 ? (val / totalAllocVal) * 100 : 0;
        const labelKey = k === 'stocks' ? 'form.assetAllocation.stocksLabel' : ASSET_LABEL_KEYS[k as ExtraAsset];
        return { key: k, label: tr(lang, labelKey), color: ASSET_COLORS[k as import('../data/historical').AssetClass], value: val, pct };
      })
    : [];

  const conBarSegments: BarSegment[] = multiAssetMode && activeAssetKeys.length >= 2 && totalAllocCon > 0
    ? activeAssetKeys.map((k) => {
        const val = k === 'stocks' ? parseNum(stocksCon) : parseNum(extraAssets[k as ExtraAsset].con);
        const pct = totalAllocCon > 0 ? (val / totalAllocCon) * 100 : 0;
        const labelKey = k === 'stocks' ? 'form.assetAllocation.stocksLabel' : ASSET_LABEL_KEYS[k as ExtraAsset];
        return { key: k, label: tr(lang, labelKey), color: ASSET_COLORS[k as import('../data/historical').AssetClass], value: val, pct };
      })
    : [];

  function handleDragRebalance(leftKey: string, rightKey: string, deltaValue: number) {
    const MIN = 100;
    if (leftKey === 'stocks') {
      const newLeft = Math.max(MIN, parseNum(stocksVal) + deltaValue);
      const newRight = Math.max(MIN, parseNum(rightKey === 'stocks' ? stocksVal : extraAssets[rightKey as ExtraAsset].val) - deltaValue);
      setStocksVal(String(Math.round(newLeft)));
      if (rightKey !== 'stocks') onUpdateAsset(rightKey as ExtraAsset, 'val', String(Math.round(newRight)));
    } else if (rightKey === 'stocks') {
      const leftAsset = leftKey as ExtraAsset;
      const newLeft = Math.max(MIN, parseNum(extraAssets[leftAsset].val) + deltaValue);
      const newRight = Math.max(MIN, parseNum(stocksVal) - deltaValue);
      onUpdateAsset(leftAsset, 'val', String(Math.round(newLeft)));
      setStocksVal(String(Math.round(newRight)));
    } else {
      const leftAsset = leftKey as ExtraAsset;
      const rightAsset = rightKey as ExtraAsset;
      const newLeft = Math.max(MIN, parseNum(extraAssets[leftAsset].val) + deltaValue);
      const newRight = Math.max(MIN, parseNum(extraAssets[rightAsset].val) - deltaValue);
      onUpdateAsset(leftAsset, 'val', String(Math.round(newLeft)));
      onUpdateAsset(rightAsset, 'val', String(Math.round(newRight)));
    }
  }

  function handleMoveLeft(key: string) {
    const idx = allocOrder.indexOf(key);
    if (idx <= 0) return;
    const next = [...allocOrder];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setAllocOrder(next);
  }

  function handleMoveRight(key: string) {
    const idx = allocOrder.indexOf(key);
    if (idx < 0 || idx >= allocOrder.length - 1) return;
    const next = [...allocOrder];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setAllocOrder(next);
  }

  function handleConDragRebalance(leftKey: string, rightKey: string, deltaValue: number) {
    const MIN = 0;
    if (leftKey === 'stocks') {
      const newLeft = Math.max(MIN, parseNum(stocksCon) + deltaValue);
      const newRight = Math.max(MIN, parseNum(rightKey === 'stocks' ? stocksCon : extraAssets[rightKey as ExtraAsset].con) - deltaValue);
      setStocksCon(String(Math.round(newLeft)));
      if (rightKey !== 'stocks') onUpdateAsset(rightKey as ExtraAsset, 'con', String(Math.round(newRight)));
    } else if (rightKey === 'stocks') {
      const leftAsset = leftKey as ExtraAsset;
      const newLeft = Math.max(MIN, parseNum(extraAssets[leftAsset].con) + deltaValue);
      const newRight = Math.max(MIN, parseNum(stocksCon) - deltaValue);
      onUpdateAsset(leftAsset, 'con', String(Math.round(newLeft)));
      setStocksCon(String(Math.round(newRight)));
    } else {
      const leftAsset = leftKey as ExtraAsset;
      const rightAsset = rightKey as ExtraAsset;
      const newLeft = Math.max(MIN, parseNum(extraAssets[leftAsset].con) + deltaValue);
      const newRight = Math.max(MIN, parseNum(extraAssets[rightAsset].con) - deltaValue);
      onUpdateAsset(leftAsset, 'con', String(Math.round(newLeft)));
      onUpdateAsset(rightAsset, 'con', String(Math.round(newRight)));
    }
  }

  return (
    <section className='panel form-panel'>
      <h2>{tr(lang, 'sections.params')}</h2>
      <div className='form-grid'>
        <div className={`field${multiAssetMode ? ' field--readonly' : ''}`}>
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
              value={multiAssetMode ? String(Math.round(blendedCapital)) : initialCapital}
              onChange={(e) => !multiAssetMode && setInitialCapital(e.target.value)}
              readOnly={multiAssetMode}
              className={!multiAssetMode && errors.initialCapital ? 'input-error' : ''}
            />
            {!multiAssetMode && errors.initialCapital && <span className='field-error'>{errors.initialCapital}</span>}
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

        <div className={`field${multiAssetMode ? ' field--readonly' : ''}`}>
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
              value={multiAssetMode ? String(Math.round(blendedContribution)) : monthlyContribution}
              onChange={(e) => !multiAssetMode && setMonthlyContribution(e.target.value)}
              readOnly={multiAssetMode}
              className={!multiAssetMode && errors.monthlyContribution ? 'input-error' : ''}
            />
            {!multiAssetMode && (
              <input
                type='range'
                min={SLIDERS.monthlyContribution.min}
                max={SLIDERS.monthlyContribution.max}
                step={SLIDERS.monthlyContribution.step}
                value={sliderVal(monthlyContribution, SLIDERS.monthlyContribution)}
                onChange={(e) => setMonthlyContribution(e.target.value)}
              />
            )}
            {!multiAssetMode && errors.monthlyContribution && <span className='field-error'>{errors.monthlyContribution}</span>}
          </div>
        </div>

        <div className={`field${histMode ? ' field--disabled' : ''}`}>
          <label className='field-label' htmlFor='annualInflationPercent'>
            <span className='field-label-head'>
              <span className='field-label-text'>{tr(lang, 'form.inflation.label')}</span>
              <FieldTooltip
                text={histMode ? tr(lang, 'form.hist.disabledInflationTip') : tr(lang, 'form.inflation.tip')}
              />
            </span>
          </label>
          <div className='field-control'>
            <input
              id='annualInflationPercent'
              type='text'
              inputMode='decimal'
              value={annualInflationPercent}
              onChange={(e) => setAnnualInflationPercent(e.target.value)}
              disabled={histMode}
              className={!histMode && errors.annualInflationPercent ? 'input-error' : ''}
            />
            <input
              type='range'
              min={SLIDERS.annualInflationPercent.min}
              max={SLIDERS.annualInflationPercent.max}
              step={SLIDERS.annualInflationPercent.step}
              value={sliderVal(annualInflationPercent, SLIDERS.annualInflationPercent)}
              onChange={(e) => setAnnualInflationPercent(e.target.value)}
              disabled={histMode}
            />
            {!histMode && errors.annualInflationPercent && (
              <span className='field-error'>{errors.annualInflationPercent}</span>
            )}
          </div>
        </div>

        <div className={`field${histMode || multiAssetMode ? ' field--disabled' : ''}`}>
          <label className='field-label' htmlFor='annualReturnPercent'>
            <span className='field-label-head'>
              <span className='field-label-text'>{tr(lang, 'form.return.label')}</span>
              <FieldTooltip
                text={histMode ? tr(lang, 'form.hist.disabledReturnTip') : tr(lang, 'form.return.tip')}
              />
            </span>
          </label>
          <div className='field-control'>
            <input
              id='annualReturnPercent'
              type='text'
              inputMode='decimal'
              value={multiAssetMode ? blendedReturnNum.toFixed(2) : annualReturnPercent}
              onChange={(e) => !multiAssetMode && !histMode && setAnnualReturnPercent(e.target.value)}
              disabled={histMode}
              readOnly={multiAssetMode}
              className={!histMode && !multiAssetMode && errors.annualReturnPercent ? 'input-error' : ''}
            />
            {!multiAssetMode && (
              <input
                type='range'
                min={SLIDERS.annualReturnPercent.min}
                max={SLIDERS.annualReturnPercent.max}
                step={SLIDERS.annualReturnPercent.step}
                value={sliderVal(annualReturnPercent, SLIDERS.annualReturnPercent)}
                onChange={(e) => setAnnualReturnPercent(e.target.value)}
                disabled={histMode}
              />
            )}
            {!histMode && !multiAssetMode && errors.annualReturnPercent && (
              <span className='field-error'>{errors.annualReturnPercent}</span>
            )}
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

      {/* ── Asset Allocation Section ── */}
      <details className='alloc-section'>
        <summary className='alloc-section-summary'>
          {tr(lang, 'form.assetAllocation.sectionTitle')}
          {multiAssetMode && (
            <span className='alloc-section-badge'>
              {EXTRA_ASSETS.filter((a) => extraAssets[a].on).length + 1}
            </span>
          )}
        </summary>

        <div className='alloc-body'>
          {/* Stocks value row (shown when multi-asset) */}
          {multiAssetMode && (
            <div className='alloc-asset-row alloc-asset-row--stocks'>
              <div className='alloc-asset-header'>
                <span className='alloc-asset-swatch' style={{ background: ASSET_COLORS.stocks }} />
                <span className='alloc-asset-name'>{tr(lang, 'form.assetAllocation.stocksLabel')}</span>
              </div>
              <div className='alloc-asset-fields'>
                <div className='alloc-field'>
                  <label className='alloc-field-label'>{tr(lang, 'form.assetAllocation.valueLabel')}</label>
                  <input
                    type='text'
                    inputMode='decimal'
                    value={stocksVal}
                    onChange={(e) => setStocksVal(e.target.value)}
                  />
                  <input
                    type='range'
                    min={ASSET_VAL_SLIDER.min}
                    max={ASSET_VAL_SLIDER.max}
                    step={ASSET_VAL_SLIDER.step}
                    value={clamp(parseNum(stocksVal), ASSET_VAL_SLIDER.min, ASSET_VAL_SLIDER.max)}
                    onChange={(e) => setStocksVal(e.target.value)}
                  />
                </div>
                <div className='alloc-field'>
                  <label className='alloc-field-label'>{tr(lang, 'form.assetAllocation.contributionLabel')}</label>
                  <input
                    type='text'
                    inputMode='decimal'
                    value={stocksCon}
                    onChange={(e) => setStocksCon(e.target.value)}
                    className={errors.stocks_con ? 'input-error' : ''}
                  />
                  <input
                    type='range'
                    min={0}
                    max={ASSET_VAL_SLIDER.max / 10}
                    step={50}
                    value={clamp(parseNum(stocksCon), 0, ASSET_VAL_SLIDER.max / 10)}
                    onChange={(e) => setStocksCon(e.target.value)}
                  />
                  {errors.stocks_con && <span className='field-error'>{errors.stocks_con}</span>}
                </div>
                <div className='alloc-field'>
                  <label className='alloc-field-label'>{tr(lang, 'form.assetAllocation.returnLabel')}</label>
                  <input
                    type='text'
                    inputMode='decimal'
                    value={annualReturnPercent}
                    onChange={(e) => setAnnualReturnPercent(e.target.value)}
                    disabled={histMode}
                  />
                  {!histMode && (
                    <input
                      type='range'
                      min={ASSET_RETURN_SLIDER.min}
                      max={ASSET_RETURN_SLIDER.max}
                      step={ASSET_RETURN_SLIDER.step}
                      value={clamp(parseNum(annualReturnPercent), ASSET_RETURN_SLIDER.min, ASSET_RETURN_SLIDER.max)}
                      onChange={(e) => setAnnualReturnPercent(e.target.value)}
                    />
                  )}
                </div>
                {mcMode && (
                  <div className='alloc-field'>
                    <label className='alloc-field-label'>{tr(lang, 'form.assetAllocation.stdDevLabel')}</label>
                    <input
                      type='text'
                      inputMode='decimal'
                      value={mcReturnStdDev}
                      onChange={(e) => setMcReturnStdDev(e.target.value)}
                    />
                    <input
                      type='range'
                      min={MC_SLIDERS.mcReturnStdDev.min}
                      max={MC_SLIDERS.mcReturnStdDev.max}
                      step={MC_SLIDERS.mcReturnStdDev.step}
                      value={clamp(parseNum(mcReturnStdDev), MC_SLIDERS.mcReturnStdDev.min, MC_SLIDERS.mcReturnStdDev.max)}
                      onChange={(e) => setMcReturnStdDev(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extra asset toggles */}
          {EXTRA_ASSETS.map((asset) => {
            const a = extraAssets[asset];
            const label = tr(lang, ASSET_LABEL_KEYS[asset]);
            const valErr = errors[`${asset}_val` as keyof AllErrors];
            const conErr = errors[`${asset}_con` as keyof AllErrors];
            const retErr = errors[`${asset}_ret` as keyof AllErrors];
            const sdErr = errors[`${asset}_sd` as keyof AllErrors];
            return (
              <div key={asset} className={`alloc-asset-row${a.on ? ' alloc-asset-row--on' : ''}`}>
                <div className='alloc-asset-header'>
                  <span className='alloc-asset-swatch' style={{ background: ASSET_COLORS[asset] }} />
                  <label className='alloc-toggle-label' htmlFor={`toggle-${asset}`}>
                    {label}
                  </label>
                  <button
                    id={`toggle-${asset}`}
                    type='button'
                    role='switch'
                    aria-checked={a.on}
                    className={`alloc-toggle${a.on ? ' alloc-toggle--on' : ''}`}
                    onClick={() => onToggleAsset(asset, !a.on)}
                  >
                    <span className='alloc-toggle-thumb' />
                  </button>
                </div>

                {a.on && (
                  <div className='alloc-asset-fields'>
                    <div className='alloc-field'>
                      <label className='alloc-field-label'>{tr(lang, 'form.assetAllocation.valueLabel')}</label>
                      <input
                        type='text'
                        inputMode='decimal'
                        value={a.val}
                        onChange={(e) => onUpdateAsset(asset, 'val', e.target.value)}
                        className={valErr ? 'input-error' : ''}
                      />
                      <input
                        type='range'
                        min={ASSET_VAL_SLIDER.min}
                        max={ASSET_VAL_SLIDER.max}
                        step={ASSET_VAL_SLIDER.step}
                        value={clamp(parseNum(a.val), ASSET_VAL_SLIDER.min, ASSET_VAL_SLIDER.max)}
                        onChange={(e) => onUpdateAsset(asset, 'val', e.target.value)}
                      />
                      {valErr && <span className='field-error'>{valErr}</span>}
                    </div>

                    <div className='alloc-field'>
                      <label className='alloc-field-label'>{tr(lang, 'form.assetAllocation.contributionLabel')}</label>
                      <input
                        type='text'
                        inputMode='decimal'
                        value={a.con}
                        onChange={(e) => onUpdateAsset(asset, 'con', e.target.value)}
                        className={conErr ? 'input-error' : ''}
                      />
                      <input
                        type='range'
                        min={0}
                        max={ASSET_VAL_SLIDER.max / 10}
                        step={50}
                        value={clamp(parseNum(a.con), 0, ASSET_VAL_SLIDER.max / 10)}
                        onChange={(e) => onUpdateAsset(asset, 'con', e.target.value)}
                      />
                      {conErr && <span className='field-error'>{conErr}</span>}
                    </div>

                    <div className='alloc-field'>
                      <label className='alloc-field-label'>{tr(lang, 'form.assetAllocation.returnLabel')}</label>
                      <input
                        type='text'
                        inputMode='decimal'
                        value={a.ret}
                        onChange={(e) => onUpdateAsset(asset, 'ret', e.target.value)}
                        className={retErr ? 'input-error' : ''}
                        disabled={histMode}
                      />
                      {!histMode && (
                        <input
                          type='range'
                          min={ASSET_RETURN_SLIDER.min}
                          max={ASSET_RETURN_SLIDER.max}
                          step={ASSET_RETURN_SLIDER.step}
                          value={clamp(parseNum(a.ret), ASSET_RETURN_SLIDER.min, ASSET_RETURN_SLIDER.max)}
                          onChange={(e) => onUpdateAsset(asset, 'ret', e.target.value)}
                        />
                      )}
                      {retErr && <span className='field-error'>{retErr}</span>}
                    </div>

                    {mcMode && (
                      <div className='alloc-field'>
                        <label className='alloc-field-label'>{tr(lang, 'form.assetAllocation.stdDevLabel')}</label>
                        <input
                          type='text'
                          inputMode='decimal'
                          value={a.sd}
                          onChange={(e) => onUpdateAsset(asset, 'sd', e.target.value)}
                          className={sdErr ? 'input-error' : ''}
                        />
                        <input
                          type='range'
                          min={ASSET_SD_SLIDER.min}
                          max={ASSET_SD_SLIDER.max}
                          step={ASSET_SD_SLIDER.step}
                          value={clamp(parseNum(a.sd), ASSET_SD_SLIDER.min, ASSET_SD_SLIDER.max)}
                          onChange={(e) => onUpdateAsset(asset, 'sd', e.target.value)}
                        />
                        {sdErr && <span className='field-error'>{sdErr}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Crypto clamp notice */}
          {cryptoClampNotice && (
            <p className='alloc-notice'>
              {trParams(lang, 'form.assetAllocation.cryptoYearClamp', { year: 2010 })}
              <button type='button' className='alloc-notice-close' onClick={onDismissCryptoClamp}>×</button>
            </p>
          )}

          {/* Blended summary */}
          {multiAssetMode && (
            <div className='alloc-summary'>
              <span>{tr(lang, 'form.assetAllocation.totalLabel')}: <strong>${Math.round(blendedCapital).toLocaleString()}</strong></span>
              <span>{tr(lang, 'form.assetAllocation.totalContributionLabel')}: <strong>${Math.round(blendedContribution).toLocaleString()}/mo</strong></span>
              <span>{tr(lang, 'form.assetAllocation.blendedReturnLabel')}: <strong>{blendedReturnNum.toFixed(2)}%</strong></span>
              {mcMode && (
                <span>{tr(lang, 'form.assetAllocation.blendedStdDevLabel')}: <strong>{blendedStdDevNum.toFixed(2)}%</strong></span>
              )}
            </div>
          )}

          {/* Capital allocation bar */}
          {barSegments.length >= 2 && (
            <div className='alloc-bar-section'>
              <span className='alloc-bar-title'>{tr(lang, 'form.assetAllocation.totalLabel')}</span>
              <AllocationBar
                segments={barSegments}
                onDragRebalance={handleDragRebalance}
                onMoveLeft={handleMoveLeft}
                onMoveRight={handleMoveRight}
              />
            </div>
          )}

          {/* Monthly contribution bar */}
          {conBarSegments.length >= 2 && (
            <div className='alloc-bar-section'>
              <span className='alloc-bar-title'>{tr(lang, 'form.assetAllocation.totalContributionLabel')}</span>
              <AllocationBar
                segments={conBarSegments}
                onDragRebalance={handleConDragRebalance}
                onMoveLeft={handleMoveLeft}
                onMoveRight={handleMoveRight}
              />
            </div>
          )}
        </div>
      </details>

      <div className='sim-mode-section'>
        <span className='sim-mode-label'>{tr(lang, 'form.simMode.label')}</span>
        <div className='sim-mode-tabs' role='group' aria-label={tr(lang, 'form.simMode.label')}>
          <button
            type='button'
            className={`sim-mode-tab${simMode === 'fixed' ? ' sim-mode-tab--active' : ''}`}
            aria-pressed={simMode === 'fixed'}
            onClick={() => setSimMode('fixed')}
          >
            {tr(lang, 'form.simMode.fixed')}
          </button>
          <button
            type='button'
            className={`sim-mode-tab${simMode === 'mc' ? ' sim-mode-tab--active' : ''}`}
            aria-pressed={simMode === 'mc'}
            onClick={() => setSimMode('mc')}
          >
            {tr(lang, 'form.simMode.mc')}
          </button>
          <button
            type='button'
            className={`sim-mode-tab${simMode === 'hist' ? ' sim-mode-tab--active' : ''}`}
            aria-pressed={simMode === 'hist'}
            onClick={() => setSimMode('hist')}
          >
            {tr(lang, 'form.simMode.hist')}
          </button>
        </div>
      </div>

      {simMode === 'hist' && (
        <div className='hist-section'>
          {histDataError && <p className='hist-message hist-message--error'>{tr(lang, 'form.hist.error')}</p>}
          {!histData && !histDataError && (
            <p className='hist-message'>{tr(lang, 'form.hist.loading')}</p>
          )}
          {histData && (
            <div className='field'>
              <label className='field-label' htmlFor='histStartYear'>
                <span className='field-label-head'>
                  <span className='field-label-text'>{tr(lang, 'form.hist.startYearLabel')}</span>
                  <FieldTooltip text={tr(lang, 'form.hist.startYearTip')} />
                </span>
                <span className='field-label-sub'>
                  {trParams(lang, 'form.hist.dataRange', { first: histMinYear, last: HIST_LAST_YEAR })}
                </span>
              </label>
              <div className='field-control'>
                <input
                  id='histStartYear'
                  type='text'
                  inputMode='numeric'
                  value={histStartYear}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (v >= histMinYear && v <= HIST_LAST_YEAR) setHistStartYear(v);
                  }}
                />
                <input
                  type='range'
                  min={histMinYear}
                  max={HIST_LAST_YEAR}
                  step={1}
                  value={histStartYear}
                  onChange={(e) => setHistStartYear(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {simMode === 'mc' && (
        <div className='mc-section'>
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

            <div className={`field${multiAssetMode ? ' field--readonly' : ''}`}>
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
                  value={multiAssetMode ? blendedStdDevNum.toFixed(2) : mcReturnStdDev}
                  onChange={(e) => !multiAssetMode && setMcReturnStdDev(e.target.value)}
                  readOnly={multiAssetMode}
                  className={!multiAssetMode && errors.mcReturnStdDev ? 'input-error' : ''}
                />
                {!multiAssetMode && (
                  <input
                    type='range'
                    min={MC_SLIDERS.mcReturnStdDev.min}
                    max={MC_SLIDERS.mcReturnStdDev.max}
                    step={MC_SLIDERS.mcReturnStdDev.step}
                    value={clamp(parseNum(mcReturnStdDev), MC_SLIDERS.mcReturnStdDev.min, MC_SLIDERS.mcReturnStdDev.max)}
                    onChange={(e) => setMcReturnStdDev(e.target.value)}
                  />
                )}
                {!multiAssetMode && errors.mcReturnStdDev && <span className='field-error'>{errors.mcReturnStdDev}</span>}
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
                <input
                  type='range'
                  min={MC_SLIDERS.mcInflationStdDev.min}
                  max={MC_SLIDERS.mcInflationStdDev.max}
                  step={MC_SLIDERS.mcInflationStdDev.step}
                  value={clamp(
                    parseNum(mcInflationStdDev),
                    MC_SLIDERS.mcInflationStdDev.min,
                    MC_SLIDERS.mcInflationStdDev.max,
                  )}
                  onChange={(e) => setMcInflationStdDev(e.target.value)}
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
        </div>
      )}
    </section>
  );
}
