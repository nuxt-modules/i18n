import { deepCopy, isArray, isFunction, isString, toTypeString } from '@intlify/shared'
import { createLogger } from '#nuxt-i18n/logger'

import type { I18nOptions, Locale, FallbackLocale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { VueI18nConfig } from '#internal-i18n-types'
import type { CoreContext } from '@intlify/h3'

type MessageLoaderFunction<T = DefineLocaleMessage> = (locale: Locale) => Promise<LocaleMessages<T>>
type MessageLoaderResult<T, Result = MessageLoaderFunction<T> | LocaleMessages<T>> = { default: Result } | Result

type LocaleLoader<T = LocaleMessages<DefineLocaleMessage>> = {
  key: string
  cache: boolean
  load: () => Promise<MessageLoaderResult<T>>
}

// mock nuxt.runWithContext to have identical signature in nitro context (which does not need runWithContext)
const nuxtMock: { runWithContext: NuxtApp['runWithContext'] } = {
  runWithContext: async (fn: () => Promise<never>) => await fn()
}
const cacheMessages = new Map<string, LocaleMessages<DefineLocaleMessage>>()

export async function loadVueI18nOptions(vueI18nConfigs: VueI18nConfig[], nuxt = nuxtMock): Promise<I18nOptions> {
  const vueI18nOptions: I18nOptions = { messages: {} }
  for (const configFile of vueI18nConfigs) {
    const { default: resolver } = await configFile()

    const resolved = isFunction(resolver) ? await nuxt.runWithContext(() => resolver()) : resolver

    deepCopy(resolved, vueI18nOptions)
  }

  vueI18nOptions.fallbackLocale ??= false

  return vueI18nOptions
}

export function makeFallbackLocaleCodes(fallback: FallbackLocale, locales: Locale[]): Locale[] {
  if (fallback === false) return []
  if (isArray(fallback)) return fallback

  let fallbackLocales: Locale[] = []
  if (isString(fallback)) {
    if (locales.every(locale => locale !== fallback)) {
      fallbackLocales.push(fallback)
    }
    return fallbackLocales
  }

  const targets = [...locales, 'default']
  for (const locale of targets) {
    if (locale in fallback == false) continue
    fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)]
  }

  return fallbackLocales
}

export async function loadInitialMessages(
  messages: LocaleMessages<DefineLocaleMessage>,
  localeLoaders: Record<Locale, LocaleLoader[]>,
  options: {
    localeCodes: string[]
    defaultLocale: Locale
    initialLocale: Locale
    fallbackLocale: FallbackLocale
  },
  nuxt = nuxtMock
): Promise<LocaleMessages<DefineLocaleMessage>> {
  const { defaultLocale, initialLocale, localeCodes, fallbackLocale } = options

  // load fallback messages
  if (__LAZY_LOCALES__ && fallbackLocale) {
    const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [defaultLocale, initialLocale])
    await Promise.all(fallbackLocales.map(locale => loadAndSetLocaleMessages(locale, localeLoaders, messages, nuxt)))
  }

  // load initial messages
  const locales = __LAZY_LOCALES__ ? [...new Set<Locale>().add(defaultLocale).add(initialLocale)] : localeCodes
  await Promise.all(locales.map((locale: Locale) => loadAndSetLocaleMessages(locale, localeLoaders, messages, nuxt)))

  return messages
}

const isModule = (val: unknown): val is { default: unknown } => toTypeString(val) === '[object Module]'

async function loadMessage(locale: Locale, { key, load }: LocaleLoader, nuxt = nuxtMock) {
  const logger = /*#__PURE__*/ createLogger('loadMessage')
  let message: LocaleMessages<DefineLocaleMessage> | null = null
  try {
    __DEBUG__ && logger.log({ locale })
    const getter = await load().then(
      x =>
        isModule(x)
          ? x.default
          : import.meta.server && import.meta.dev
            ? // @ts-expect-error no idea why this is needed
              (x.default as
                | MessageLoaderFunction<LocaleMessages<DefineLocaleMessage>>
                | LocaleMessages<LocaleMessages<DefineLocaleMessage>>)
            : x
      // x => (isModule(x) ? x.default : x)
    )
    if (isFunction(getter)) {
      message = await nuxt.runWithContext(() => getter(locale))
      __DEBUG__ && logger.log('dynamic load', logger.level >= 999 ? message : '')
    } else {
      message = getter
    }
    if (message != null && cacheMessages && (!import.meta.dev || __I18N_DEV_CACHE__)) {
      cacheMessages.set(key, message)
    }
    __DEBUG__ && logger.log('loaded', logger.level >= 999 ? message : '')
  } catch (e: unknown) {
    console.error('Failed locale loading: ' + (e as Error).message)
  }
  return message
}

export async function loadLocale(
  locale: Locale,
  localeLoaders: Record<Locale, LocaleLoader[]>,
  setter: (locale: Locale, message: LocaleMessages<DefineLocaleMessage>) => void,
  nuxt = nuxtMock
) {
  const logger = /*#__PURE__*/ createLogger('loadLocale')
  const loaders = localeLoaders[locale]

  if (loaders == null) {
    __DEBUG__ && logger.warn('Could not find locale file messages for locale code: ' + locale)
    return
  }

  const targetMessage: LocaleMessages<DefineLocaleMessage> = {}
  for (const loader of loaders) {
    let message: LocaleMessages<DefineLocaleMessage> | undefined | null = null

    if (cacheMessages && cacheMessages.has(loader.key) && loader.cache) {
      __DEBUG__ && logger.log(loader.key + ' is already loaded')
      message = cacheMessages.get(loader.key)
    } else {
      __TEST__ && !loader.cache && logger.log(loader.key + ' bypassing cache!')
      __DEBUG__ && logger.log(loader.key + ' is loading ...')
      message = await nuxt.runWithContext(() => loadMessage(locale, loader, nuxt))
    }

    if (message != null) {
      deepCopy(message, targetMessage)
    }
  }

  setter(locale, targetMessage)
}

type LocaleLoaderMessages =
  | CoreContext<Locale, DefineLocaleMessage>['messages']
  | LocaleMessages<DefineLocaleMessage, Locale>
export async function loadAndSetLocaleMessages(
  locale: Locale,
  localeLoaders: Record<Locale, LocaleLoader[]>,
  messages: LocaleLoaderMessages,
  nuxt = nuxtMock
) {
  const setter = (locale: Locale, message: LocaleMessages<DefineLocaleMessage, Locale>) => {
    const base = messages[locale] || {}
    deepCopy(message, base)
    messages[locale] = base
  }

  await loadLocale(locale, localeLoaders, setter, nuxt)
}
