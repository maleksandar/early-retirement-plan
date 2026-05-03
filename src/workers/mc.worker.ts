import { simulateMonteCarlo } from '../model/simulate'
import type { MonteCarloInput, MCResult } from '../model/simulate'

export interface MCWorkerRequest {
  id: number
  params: MonteCarloInput
}

export interface MCWorkerResponse {
  id: number
  result: MCResult
}

onmessage = (e: MessageEvent<MCWorkerRequest>) => {
  const { id, params } = e.data
  const result = simulateMonteCarlo(params)
  postMessage({ id, result } satisfies MCWorkerResponse)
}
