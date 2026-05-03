export type HistoricalRate = {
  year: number
  returnPct: number
  inflationPct: number
}

let cache: HistoricalRate[] | null = null

export async function fetchHistoricalRates(): Promise<HistoricalRate[]> {
  if (cache) return cache
  const res = await fetch('/data/historical-rates.json')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  cache = (await res.json()) as HistoricalRate[]
  return cache
}
