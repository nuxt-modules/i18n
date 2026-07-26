import { loadNuxt } from '@nuxt/kit'
import { resolve } from 'pathe'
import { describe, expect, test } from 'vitest'

import type { LocaleObject } from '../src/types'

const rootDir = resolve(process.cwd(), './test/fixtures/module-setup')

/**
 * Runs the module `setup()` and resolves its locale context without paying for the
 * client/server bundling of a full build.
 */
async function setupModule(configFile: string) {
  const nuxt = await loadNuxt({ rootDir, configFile, dev: false, overrides: { pages: false } })

  try {
    const template = nuxt.options.build.templates.find(x => x.filename === 'i18n-options.mjs')
    // @ts-expect-error generated runtime config type
    const runtime = nuxt.options.runtimeConfig.public.i18n as { locales: (string | LocaleObject)[], defaultLocale: string }
    return {
      runtime,
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
