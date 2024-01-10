import { fileURLToPath } from 'node:url'
import initJiti from 'jiti'
import { defu } from 'defu'
import { join } from 'pathe'
import { NuxtConfig } from '@nuxt/types'
import { chromium, Browser, Page } from 'playwright-chromium'

// Nuxt seems to import and modify contents of the nuxt.config configuration so we must make sure
// that we don't import updated config.
const jitiImport = initJiti(fileURLToPath(import.meta.url), { requireCache: false })

export async function createBrowser (): Promise<Browser> {
  return await chromium.launch()
}

export async function $$ (selector: string, page: Page): Promise<string | null> {
  const element = await page.$(selector)
  if (element) {
    return await element.textContent()
  }
  return null
}

export function loadConfig (dir: string, fixture: string | null = null, override: NuxtConfig = {}, { merge = false } = {}): NuxtConfig {
  const fixtureConfig = jitiImport(join(dir, 'fixture', fixture ?? '', 'nuxt.config'))
  const config = defu({}, fixtureConfig.default || fixtureConfig)

  if (merge) {
    return defu(override, config)
  } else {
    return {
      ...defu(config),
      ...defu(override)
    }
  }
}
