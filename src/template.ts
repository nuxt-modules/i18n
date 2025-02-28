import { generateLoaderOptions } from './gen'
import {
  DEFAULT_DYNAMIC_PARAMS_KEY,
  DEFAULT_COOKIE_KEY,
  NUXT_I18N_MODULE_ID,
  SWITCH_LOCALE_PATH_LINK_IDENTIFIER
} from './constants'
import type { I18nNuxtContext } from './context'
import type { Nuxt } from '@nuxt/schema'

export type TemplateNuxtI18nOptions = ReturnType<typeof generateLoaderOptions>

// used to compare vue-i18n config replacement
const deepEqualFn = `function deepEqual(a, b, ignoreKeys = []) {
  // Same reference?
  if (a === b) return true

  // Check if either is null or not an object
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') {
    return false
  }

  // Get top-level keys, excluding ignoreKeys
  const keysA = Object.keys(a).filter(k => !ignoreKeys.includes(k))
  const keysB = Object.keys(b).filter(k => !ignoreKeys.includes(k))

  // Must have the same number of keys (after ignoring)
  if (keysA.length !== keysB.length) {
    return false
  }

  // Check each property
  for (const key of keysA) {
    if (!keysB.includes(key)) {
      return false
    }

    const valA = a[key]
    const valB = b[key]

    // Compare functions stringified
    if (typeof valA === 'function' && typeof valB === 'function') {
      if (valA.toString() !== valB.toString()) {
        return false
      }
    }
    // If nested, do a normal recursive check (no ignoring at deeper levels)
    else if (typeof valA === 'object' && typeof valB === 'object') {
      if (!deepEqual(valA, valB)) {
        return false
      }
    }
    // Compare primitive values
    else if (valA !== valB) {
      return false
    }
  }

  return true
}
`

const loadConfigsFn = `
async function loadCfg(config) {
  const nuxt = useNuxtApp()
  const { default: resolver } = await config()
  return typeof resolver === 'function' ? await nuxt.runWithContext(() => resolver()) : resolver
}\n`
function genLocaleLoaderHMR(localeLoaders: TemplateNuxtI18nOptions['localeLoaders']) {
  const statements: string[] = []

  for (const [locale, loaders] of localeLoaders) {
    for (let i = 0; i < loaders.length; i++) {
      const loader = loaders[i]
      statements.push(
        [
          `  import.meta.hot.accept("${loader.relative}", async mod => {`,
          //   replace locale loader
          `    localeLoaders["${locale}"][${i}].load = () => Promise.resolve(mod.default)`,
          //   trigger locale messages reload for locale
          `    await useNuxtApp()._nuxtI18nDev.resetI18nProperties("${locale}")`,
          `  })`
        ].join('\n')
      )
    }
  }

  return statements.join('\n\n')
}

function genVueI18nConfigHMR(configs: TemplateNuxtI18nOptions['vueI18nConfigs']) {
  const statements: string[] = []

  for (let i = 0; i < configs.length; i++) {
    statements.push(
      [
        `  import.meta.hot.accept("${configs[i].relative}", async mod => {`,
        //   load configs before replacing loader
        `    const [oldData, newData] = await Promise.all([loadCfg(vueI18nConfigs[${i}]), loadCfg(() => Promise.resolve(mod))]);`,
        //   replace config loader
        `    vueI18nConfigs[${i}] = () => Promise.resolve(mod)`,
        //   compare data - reload configs if _only_ replaceable properties have changed
        `    if(deepEqual(oldData, newData, ['messages', 'numberFormats', 'datetimeFormats'])) {`,
        `      return await useNuxtApp()._nuxtI18nDev.resetI18nProperties()`,
        `    }`,
        //   communicate to vite plugin to trigger a page load
        `    import.meta.hot.send('i18n:options-complex-invalidation', {})`,
        `  })`
      ].join('\n')
    )
  }

  return statements.join('\n\n')
}

export function generateTemplateNuxtI18nOptions(
  ctx: I18nNuxtContext,
  nuxt: Nuxt,
  opts: TemplateNuxtI18nOptions
): string {
  const codeHMR = [
    `if(import.meta.hot) {`,
    deepEqualFn,
    loadConfigsFn,
    genLocaleLoaderHMR(opts.localeLoaders),
    genVueI18nConfigHMR(opts.vueI18nConfigs),
    '}'
  ].join('\n\n')

  const lazy = ctx.options.lazy
  const importStrings = opts.localeLoaders.map(([_, val]) => val.flatMap(x => x.importString).join('\n')).join('\n')

  return `
// @ts-nocheck
${(!lazy && importStrings) || ''}

export const localeCodes =  ${JSON.stringify(ctx.localeCodes, null, 2)}

export const localeLoaders = {
${opts.localeLoaders
  .map(([key, val]) => {
    return `  "${key}": [${val
      .map(entry => `{ key: ${entry.key}, load: ${lazy ? entry.async : entry.sync}, cache: ${entry.cache} }`)
      .join(',\n')}]`
  })
  .join(',\n')}
}

export const vueI18nConfigs = [
  ${opts.vueI18nConfigs.map(x => x.importer).join(',\n  ')}
]

export const nuxtI18nOptions = ${JSON.stringify(opts.nuxtI18nOptions, null, 2)}

export const normalizedLocales = ${JSON.stringify(opts.normalizedLocales, null, 2)}

export const NUXT_I18N_MODULE_ID = "${NUXT_I18N_MODULE_ID}"
export const parallelPlugin = ${ctx.options.parallelPlugin}
export const isSSG = ${ctx.isSSG}
export const hasPages = ${nuxt.options.pages}

export const DEFAULT_DYNAMIC_PARAMS_KEY = ${JSON.stringify(DEFAULT_DYNAMIC_PARAMS_KEY)}
export const DEFAULT_COOKIE_KEY = ${JSON.stringify(DEFAULT_COOKIE_KEY)}
export const SWITCH_LOCALE_PATH_LINK_IDENTIFIER = ${JSON.stringify(SWITCH_LOCALE_PATH_LINK_IDENTIFIER)}
/** client **/
${(ctx.isDev && opts.nuxtI18nOptions.experimental.hmr && codeHMR) || ''}
/** client-end **/`
}
