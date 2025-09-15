import { getConfig } from './storage'

export function getRandomDelay(): number {
  const cfg = getConfig().reactions
  return (
    (Math.floor(Math.random() * (cfg.maxDelay - cfg.minDelay + 1)) +
      cfg.minDelay) *
    1_000
  )
}
