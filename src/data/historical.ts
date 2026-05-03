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

export type AssetClass = 'stocks' | 'bonds' | 'realestate' | 'gold' | 'silver' | 'crypto'

export type AssetHistoricalRate = {
  year: number
  returnPct: number
}

const ASSET_FILE: Record<Exclude<AssetClass, 'stocks'>, string> = {
  bonds: '/data/historical-bonds.json',
  realestate: '/data/historical-realestate.json',
  gold: '/data/historical-gold.json',
  silver: '/data/historical-silver.json',
  crypto: '/data/historical-crypto.json',
}

const assetCache: Partial<Record<Exclude<AssetClass, 'stocks'>, AssetHistoricalRate[]>> = {}

export async function fetchAssetHistoricalRates(
  asset: Exclude<AssetClass, 'stocks'>
): Promise<AssetHistoricalRate[]> {
  if (assetCache[asset]) return assetCache[asset]!
  const res = await fetch(ASSET_FILE[asset])
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  assetCache[asset] = (await res.json()) as AssetHistoricalRate[]
  return assetCache[asset]!
}
