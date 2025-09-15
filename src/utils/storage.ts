import { defaultConfig, BratishkinConfig } from './config'

let config: BratishkinConfig = defaultConfig

export function getConfig() {
  return config
}

export function initConfig(onReady: () => void) {
  const storage = (globalThis.chrome ?? globalThis.browser)?.storage?.local

  if (!storage) {
    console.error('Storage API not available')
    return
  }

  storage.get('bratishkinConfig', (data: any) => {
    config = data?.bratishkinConfig ?? defaultConfig
    onReady()
  })

  ;(globalThis.chrome ?? globalThis.browser)?.storage.onChanged.addListener(
    (changes: any) => {
      if (changes.bratishkinConfig) {
        config = changes.bratishkinConfig.newValue
      }
    }
  )
}

export function getExtensionURL(path: string): string {
  return (globalThis.chrome ?? globalThis.browser)?.runtime?.getURL(path) ?? path
}
