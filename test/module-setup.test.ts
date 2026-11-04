import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { loadNuxt, resolveModule } from '@nuxt/kit'
import { dirname, join, normalize, resolve } from 'pathe'
import { describe, expect, onTestFinished, test } from 'vitest'

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

describe('intlify aliases', () => {
  const testURL = new URL(import.meta.url)
  const moduleVueI18n = normalize(resolveModule('vue-i18n/dist/vue-i18n', { url: testURL }))
  const moduleVersion: string = JSON.parse(readFileSync(resolveModule('vue-i18n/package.json', { url: testURL }), 'utf-8')).version

  /**
   * Loads the module for an app outside of this repository, so only packages written
   * to its `node_modules` and the module's own dependencies can be resolved.
   */
  async function setupApp(packages: Record<string, string> = {}, version = moduleVersion) {
    const appDir = realpathSync(mkdtempSync(join(tmpdir(), 'nuxt-i18n-app-')))
    onTestFinished(() => rmSync(appDir, { recursive: true, force: true, maxRetries: 3 }))

    for (const [dir, entry] of Object.entries(packages)) {
      const pkgDir = join(appDir, dir)
      mkdirSync(dirname(join(pkgDir, entry)), { recursive: true })
      writeFileSync(join(pkgDir, entry), '')
      writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ version, exports: { '.': `./${entry}`, './*': './*' } }))
    }

    const nuxt = await loadNuxt({
      dev: false,
      overrides: { rootDir: appDir, modules: ['@nuxtjs/i18n'], pages: false }
    })
    await nuxt.close()
    return { appDir, alias: Object.fromEntries(Object.entries(nuxt.options.alias).map(([k, v]) => [k, normalize(v)])) }
  }

  test('resolve `vue-i18n` from the app and its `@intlify` dependencies from `vue-i18n`', async () => {
    const vueI18n = 'node_modules/vue-i18n'
    const coreBase = `${vueI18n}/node_modules/@intlify/core-base`
    const { appDir, alias } = await setupApp({
      'node_modules/@intlify/shared': 'index.mjs',
      [vueI18n]: 'dist/vue-i18n.mjs',
      [`${vueI18n}/node_modules/@intlify/shared`]: 'index.mjs',
      [coreBase]: 'index.mjs',
      [`${coreBase}/node_modules/@intlify/message-compiler`]: 'index.mjs'
    })

    expect(alias['vue-i18n']).toEqual(join(appDir, vueI18n, 'dist/vue-i18n.mjs'))
    expect(alias['@intlify/shared']).toEqual(join(appDir, vueI18n, 'node_modules/@intlify/shared/index.mjs'))
    expect(alias['@intlify/core-base']).toEqual(join(appDir, coreBase, 'index.mjs'))
    expect(alias['@intlify/message-compiler']).toEqual(join(appDir, coreBase, 'node_modules/@intlify/message-compiler/index.mjs'))
  })

  test('fall back to the module `vue-i18n` when the app does not install it', async () => {
    const { alias } = await setupApp()

    expect(alias['vue-i18n']).toEqual(moduleVueI18n)
  })

  test('fall back to the module `vue-i18n` when the app installs another major', async () => {
    const { appDir, alias } = await setupApp({
      'node_modules/vue-i18n': 'dist/vue-i18n.mjs',
      'node_modules/vue-i18n/node_modules/@intlify/shared': 'index.mjs',
      'node_modules/vue-i18n/node_modules/@intlify/core-base': 'index.mjs',
      'node_modules/vue-i18n/node_modules/@intlify/message-compiler': 'index.mjs'
    }, `${Number.parseInt(moduleVersion) + 1}.0.0`)

    expect(alias['vue-i18n']).toEqual(moduleVueI18n)
    expect(alias['@intlify/shared']).not.toContain(appDir)
    expect(alias['@intlify/core-base']).not.toContain(appDir)
    expect(alias['@intlify/message-compiler']).not.toContain(appDir)
  })
})
