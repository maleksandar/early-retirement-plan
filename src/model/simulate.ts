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
