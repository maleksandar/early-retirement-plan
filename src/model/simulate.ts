export type SimulationInput = {
  initialCapital: number
  monthlyNeedToday: number
  annualInflationPercent: number
  monthlyContribution: number
  annualReturnPercent: number
  horizonYears: number
}

export type YearPoint = {
  year: number
  capital: number
  annualExpenses: number
  passiveReturn: number
}

export type SimulationResult = {
  series: YearPoint[]
  crossoverYear: number | null
}

function pctToDecimal(pct: number): number {
  return pct / 100
}

/**
 * Yearly step: K[y+1] = K[y] * (1 + r) + 12 * monthlyContribution.
 * At year y, passive return is K[y] * r; annual expenses are 12 * M0 * (1 + pi)^y.
 */
export function simulate(input: SimulationInput): SimulationResult {
  const r = pctToDecimal(input.annualReturnPercent)
  const pi = pctToDecimal(input.annualInflationPercent)
  const monthlyNeed = input.monthlyNeedToday
  const contribYearly = 12 * input.monthlyContribution

  const H = Math.max(0, Math.floor(input.horizonYears))
  const series: YearPoint[] = []

  let k = input.initialCapital

  for (let y = 0; y <= H; y++) {
    const annualExpenses = 12 * monthlyNeed * (1 + pi) ** y
    const passiveReturn = k * r

    series.push({
      year: y,
      capital: k,
      annualExpenses,
      passiveReturn,
    })

    if (y < H) {
      k = k * (1 + r) + contribYearly
    }
  }

  let crossoverYear: number | null = null
  for (const p of series) {
    if (p.passiveReturn >= p.annualExpenses) {
      crossoverYear = p.year
      break
    }
  }

  return { series, crossoverYear }
}

// ── Monte Carlo ──────────────────────────────────────────────────────────────

function boxMuller(): number {
  let u1: number
  do {
    u1 = Math.random()
  } while (u1 === 0)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * Math.random())
}

function sortedPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

export type MonteCarloInput = SimulationInput & {
  returnStdDevPercent: number
  inflationStdDevPercent: number
  runCount: number
}

export type MCYearPoint = {
  year: number
  capitalP10: number
  capitalP50: number
  capitalP90: number
  passiveReturnP10: number
  passiveReturnP50: number
  passiveReturnP90: number
  expensesP10: number
  expensesP50: number
  expensesP90: number
}

export type MCResult = {
  series: MCYearPoint[]
  p50CrossoverYear: number | null   // first year where P50 passive return >= P50 expenses (chart-aligned)
  medianCrossoverYear: number | null // 50th percentile of individual run crossover years
  crossoverP10Year: number | null
  crossoverP90Year: number | null
  successRate: number
}

export function simulateMonteCarlo(input: MonteCarloInput): MCResult {
  const H = Math.max(0, Math.floor(input.horizonYears))
  const N = Math.max(1, input.runCount)

  const capitalSamples: number[][] = Array.from({ length: H + 1 }, () => [])
  const passiveReturnSamples: number[][] = Array.from({ length: H + 1 }, () => [])
  const annualExpensesSamples: number[][] = Array.from({ length: H + 1 }, () => [])
  const crossoverYears: number[] = []

  const baseR = input.annualReturnPercent / 100
  const basePi = input.annualInflationPercent / 100
  const returnStd = input.returnStdDevPercent / 100
  const inflationStd = input.inflationStdDevPercent / 100
  const contribYearly = 12 * input.monthlyContribution

  for (let run = 0; run < N; run++) {
    let k = input.initialCapital
    let priceLevel = 1
    let crossover: number | null = null

    for (let y = 0; y <= H; y++) {
      const r = Math.max(0, baseR + (returnStd > 0 ? boxMuller() * returnStd : 0))
      const pi = basePi + (inflationStd > 0 ? boxMuller() * inflationStd : 0)

      const annualExpenses = 12 * input.monthlyNeedToday * priceLevel
      const passiveReturn = k * r

      capitalSamples[y].push(k)
      passiveReturnSamples[y].push(passiveReturn)
      annualExpensesSamples[y].push(annualExpenses)

      if (crossover === null && passiveReturn >= annualExpenses) {
        crossover = y
      }

      if (y < H) {
        k = k * (1 + r) + contribYearly
        priceLevel *= Math.max(0.5, 1 + pi)
      }
    }

    if (crossover !== null) {
      crossoverYears.push(crossover)
    }
  }

  for (let y = 0; y <= H; y++) {
    capitalSamples[y].sort((a, b) => a - b)
    passiveReturnSamples[y].sort((a, b) => a - b)
    annualExpensesSamples[y].sort((a, b) => a - b)
  }

  const series: MCYearPoint[] = Array.from({ length: H + 1 }, (_, y) => ({
    year: y,
    capitalP10: sortedPercentile(capitalSamples[y], 10),
    capitalP50: sortedPercentile(capitalSamples[y], 50),
    capitalP90: sortedPercentile(capitalSamples[y], 90),
    passiveReturnP10: sortedPercentile(passiveReturnSamples[y], 10),
    passiveReturnP50: sortedPercentile(passiveReturnSamples[y], 50),
    passiveReturnP90: sortedPercentile(passiveReturnSamples[y], 90),
    expensesP10: sortedPercentile(annualExpensesSamples[y], 10),
    expensesP50: sortedPercentile(annualExpensesSamples[y], 50),
    expensesP90: sortedPercentile(annualExpensesSamples[y], 90),
  }))

  // Treat non-crossover runs as beyond horizon; percentile indices over all N sorted values
  crossoverYears.sort((a, b) => a - b)
  const successRate = crossoverYears.length / N

  const rankIdx = (pct: number) => Math.floor((pct / 100) * (N - 1))
  const at = (idx: number): number | null => (idx < crossoverYears.length ? crossoverYears[idx] : null)

  // First year where the P50 passive return line crosses the P50 expenses line (visually consistent with chart)
  const p50CrossoverYear = series.find((p) => p.passiveReturnP50 >= p.expensesP50)?.year ?? null

  return {
    series,
    p50CrossoverYear,
    medianCrossoverYear: at(rankIdx(50)),
    crossoverP10Year: at(rankIdx(10)),
    crossoverP90Year: at(rankIdx(90)),
    successRate,
  }
}
