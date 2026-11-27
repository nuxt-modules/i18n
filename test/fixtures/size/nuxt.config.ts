import { fileURLToPath } from 'node:url'
import type { NuxtConfig } from 'nuxt/schema'

const i18nModule = fileURLToPath(new URL('../../../dist/module.mjs', import.meta.url))

function app(dynamic = false): NuxtConfig {
  return {
    srcDir: 'full',
    modules: [i18nModule],
    i18n: {
      baseUrl: 'http://localhost:3000',
      defaultLocale: 'en',
      customRoutes: 'meta',
      locales: [
        { code: 'en', language: 'en-US', file: 'en.json' },
        { code: 'fr', language: 'fr-FR', file: 'fr.json' },
        { code: 'ja', language: 'ja-JP', file: dynamic ? 'ja.ts' : 'ja.json' },
      ],
    },
  }
}

// keep in sync with the descriptions in scripts/size.ts
const scenarios: Record<string, NuxtConfig> = {
  baseline: { srcDir: 'bare' },
  minimal: { srcDir: 'bare', modules: [i18nModule] },
  ssr: app(),
  spa: { ...app(), ssr: false },
  dynamic: app(true),
}

const name = process.env.SIZE_SCENARIO || 'ssr'
if (!scenarios[name]) {
  throw new Error(`Unknown size scenario "${name}"`)
}

export default defineNuxtConfig({
  ...scenarios[name],
  buildDir: `.nuxt/${name}`,
  nitro: { output: { dir: `.output/${name}` } },
  compatibilityDate: '2025-02-04',
  telemetry: false,
})
