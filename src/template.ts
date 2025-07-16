import { useNuxt } from '@nuxt/kit'
import { generateLoaderOptions } from './gen'
import { genArrayFromRaw, genObjectFromRaw, genObjectFromValues, genString } from 'knitwork'
import type { I18nNuxtContext } from './context'

type TemplateNuxtI18nOptions = ReturnType<typeof generateLoaderOptions>

const loadConfigsFn = `
async function loadCfg(config) {
  const nuxt = useNuxtApp()
  const { default: resolver } = await config()
  return typeof resolver === 'function' ? await nuxt.runWithContext(() => resolver()) : resolver
}\n`
function genLocaleLoaderHMR(localeLoaders: TemplateNuxtI18nOptions['localeLoaders']) {
  const statements: string[] = []

  for (const locale in localeLoaders) {
    for (let i = 0; i < localeLoaders[locale]!.length; i++) {
      const loader = localeLoaders[locale]![i]!
      statements.push(
        [
          `  import.meta.hot.accept("${loader.relative}", async mod => {`,
          //   replace locale loader
          `    localeLoaders["${locale}"][${i}].load = () => Promise.resolve(mod.default)`,
          //   trigger locale messages reload for locale
          `    await useNuxtApp()._nuxtI18nCtx.dev.resetI18nProperties("${locale}")`,
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
        `  import.meta.hot.accept("${configs[i]!.relative}", async mod => {`,
        //   load configs before replacing loader
        `    const [oldData, newData] = await Promise.all([loadCfg(vueI18nConfigs[${i}]), loadCfg(() => Promise.resolve(mod))]);`,
        //   replace config loader
        `    vueI18nConfigs[${i}] = () => Promise.resolve(mod)`,
        //   compare data - reload configs if _only_ replaceable properties have changed
        `    if(useNuxtApp()._nuxtI18nCtx.dev.deepEqual(oldData, newData, ['messages', 'numberFormats', 'datetimeFormats'])) {`,
        `      return await useNuxtApp()._nuxtI18nCtx.dev.resetI18nProperties()`,
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
  opts: TemplateNuxtI18nOptions,
  nuxt = useNuxt()
): string {
  const codeHMR =
    nuxt.options.dev &&
    ctx.options.hmr &&
    [
      `if(import.meta.hot) {`,
      loadConfigsFn,
      genLocaleLoaderHMR(opts.localeLoaders),
      genVueI18nConfigHMR(opts.vueI18nConfigs),
      '}'
    ].join('\n\n')

  const localeLoaderEntries: Record<string, { key: string; load: string; cache: boolean }[]> = {}
  for (const locale in opts.localeLoaders) {
    localeLoaderEntries[locale] = opts.localeLoaders[locale]!.map(({ key, load, cache }) => ({ key, load, cache }))
  }

  return `// @ts-nocheck
export const localeCodes =  ${genArrayFromRaw(ctx.localeCodes.map(x => genString(x)))}
export const localeLoaders = ${genObjectFromRaw(localeLoaderEntries)}
export const vueI18nConfigs = ${genArrayFromRaw(opts.vueI18nConfigs.map(x => x.importer))}
export const normalizedLocales = ${genArrayFromRaw(opts.normalizedLocales.map(x => genObjectFromValues(x, '  ')))}
/** client **/
${codeHMR || ''}
/** client-end **/`
}
