import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { loadNuxt, resolveModule, runWithNuxtContext, useRuntimeConfig } from '@nuxt/kit'
import { join, normalize, resolve } from 'pathe'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { resolveVueI18nPackages } from '../src/utils'

import type { NuxtConfig } from '@nuxt/schema'
import type { DetectBrowserLanguageOptions, LocaleObject } from '../src/types'

const rootDir = resolve(process.cwd(), './test/fixtures/module-setup')

type RuntimeI18n = {
  locales: (string | LocaleObject)[]
  defaultLocale: string
  detectBrowserLanguage: DetectBrowserLanguageOptions | false
}

/**
 * Runs the module `setup()` and resolves its locale context without paying for the
 * client/server bundling of a full build.
 */
async function setupModule(configFile: string, overrides: NuxtConfig = {}) {
  const nuxt = await loadNuxt({ rootDir, configFile, dev: false, overrides: { pages: false, ...overrides } })

  try {
    const template = nuxt.options.build.templates.find(x => x.filename === 'i18n-options.mjs')
    // @ts-expect-error generated runtime config type
    const runtime = nuxt.options.runtimeConfig.public.i18n as RuntimeI18n
    return {
      runtime,
      // with environment variables applied, as the server resolves it
      resolved: runWithNuxtContext(nuxt, () => useRuntimeConfig()).public.i18n as RuntimeI18n,
      languages: Object.fromEntries(runtime.locales.map(x => (typeof x === 'string' ? [x, undefined] : [x.code, x.language]))),
      // @ts-expect-error template context is unused by this template
      generated: String(await template!.getContents({}))
    }
  } finally {
    await nuxt.close()
  }
}

describe('empty options', () => {
  test('sets up with no configured locales', async () => {
    const { runtime, generated } = await setupModule('empty.config')

    expect(runtime.locales).toEqual([])
    expect(generated).toContain('export const localeCodes =  []')
  })

  test('discovers the layer `i18n.config` without an explicit `vueI18n` option', async () => {
    const { generated } = await setupModule('empty.config')

    expect(generated).toContain('config_i18n_46config_46ts')
  })
})

describe('inline module options', () => {
  test('merge with the `i18n` config key and `i18n:registerModule` locales', async () => {
    const { languages, runtime } = await setupModule('nuxt.config')

    expect(languages).toEqual({
      en: 'en-US', // inline module options
      ja: 'ja-JP', // `i18n` config key
      fr: 'fr-FR', // registered by another module
      nl: 'nl-NL'
    })
    // non-locale inline options reach the runtime too
    expect(runtime.defaultLocale).toEqual('en')
  })

  test('(#2617) every merged locale keeps its `language`, alternate links need it at runtime', async () => {
    const { languages } = await setupModule('nuxt.config')

    expect(Object.values(languages).every(Boolean)).toBe(true)
  })

  test('`langDir` from inline options resolves the files of locales it did not declare', async () => {
    const { generated } = await setupModule('nuxt.config')

    // `ja` comes from the `i18n` key but its file only exists under the inline `langDir`,
    // resolving it against the default `langDir` fails setup with ENOENT
    expect(generated).toMatch(/ja: \[\s*\{\s*key: "locale_ja_46json/)
    expect(generated).toMatch(/fr: \[\s*\{\s*key: "locale_fr_46json/)
  })
})

describe('runtime config', () => {
  // values are typed by their default here, as on Nuxt 5
  const inferred = { future: { compatibilityVersion: 5 } } satisfies NuxtConfig

  test('`detectBrowserLanguage` can be disabled by its environment variable', async () => {
    vi.stubEnv('NUXT_PUBLIC_I18N_DETECT_BROWSER_LANGUAGE', 'false')
    onTestFinished(() => void vi.unstubAllEnvs())
    const { runtime, resolved } = await setupModule('empty.config', inferred)

    expect(runtime.detectBrowserLanguage).toMatchObject({ redirectOn: 'root', useCookie: true })
    expect(resolved.detectBrowserLanguage).toBe(false)
  })

  test('`detectBrowserLanguage` properties can be overridden by environment variables', async () => {
    vi.stubEnv('NUXT_PUBLIC_I18N_DETECT_BROWSER_LANGUAGE_COOKIE_DOMAIN', 'example.test')
    vi.stubEnv('NUXT_PUBLIC_I18N_DETECT_BROWSER_LANGUAGE_USE_COOKIE', 'false')
    onTestFinished(() => void vi.unstubAllEnvs())
    const { resolved } = await setupModule('empty.config', inferred)

    expect(resolved.detectBrowserLanguage).toMatchObject({ cookieDomain: 'example.test', useCookie: false, redirectOn: 'root' })
  })

  test('`detectBrowserLanguage: false` ignores property variables until a JSON value enables it', async () => {
    vi.stubEnv('NUXT_PUBLIC_I18N_DETECT_BROWSER_LANGUAGE_USE_COOKIE', 'true')
    onTestFinished(() => void vi.unstubAllEnvs())
    const disabled = { ...inferred, i18n: { detectBrowserLanguage: false } } satisfies NuxtConfig
    const { runtime, resolved } = await setupModule('empty.config', disabled)

    expect(runtime.detectBrowserLanguage).toBe(false)
    expect(resolved.detectBrowserLanguage).toBe(false)

    vi.stubEnv('NUXT_PUBLIC_I18N_DETECT_BROWSER_LANGUAGE', '{"redirectOn":"all"}')
    const enabled = await setupModule('empty.config', disabled)

    expect(enabled.resolved.detectBrowserLanguage).toEqual({ redirectOn: 'all', useCookie: true })
  })
})

describe('intlify aliases', () => {
  const moduleURL = new URL(import.meta.url)

  /** resolves the packages for an app outside of this repository, with empty `packages` in it */
  function resolveFor(packages: string[]) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'nuxt-i18n-app-')))
    onTestFinished(() => rmSync(root, { recursive: true, force: true, maxRetries: 3 }))

    for (const dir of packages) {
      mkdirSync(join(root, dir), { recursive: true })
      writeFileSync(join(root, dir, 'index.mjs'), '')
      writeFileSync(join(root, dir, 'package.json'), JSON.stringify({ exports: { '.': './index.mjs', './*': './*' } }))
    }

    const from = resolveVueI18nPackages(root, moduleURL)
    const resolved = Object.keys(from).map(name => [name, normalize(resolveModule(name, { url: from[name] }))])
    return { root, resolved: Object.fromEntries(resolved) as Record<string, string> }
  }

  test('use the `vue-i18n` of the app, and its `@intlify` dependencies instead of a hoisted copy', () => {
    const vueI18n = 'node_modules/vue-i18n'
    const coreBase = `${vueI18n}/node_modules/@intlify/core-base`
    const { root, resolved } = resolveFor([
      'node_modules/@intlify/shared',
      vueI18n,
      `${vueI18n}/node_modules/@intlify/shared`,
      coreBase,
      `${coreBase}/node_modules/@intlify/message-compiler`
    ])

    expect(resolved).toEqual({
      'vue-i18n': join(root, vueI18n, 'index.mjs'),
      '@intlify/shared': join(root, vueI18n, 'node_modules/@intlify/shared/index.mjs'),
      '@intlify/core-base': join(root, coreBase, 'index.mjs'),
      '@intlify/message-compiler': join(root, coreBase, 'node_modules/@intlify/message-compiler/index.mjs')
    })
  })

  test('use the `vue-i18n` of the module when the app has none', () => {
    const { root, resolved } = resolveFor(['node_modules/@intlify/shared'])

    expect(resolved['vue-i18n']).toEqual(normalize(resolveModule('vue-i18n', { url: moduleURL })))
    expect(resolved['@intlify/shared']).not.toContain(root)
  })
})
