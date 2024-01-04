import { isFunction, isArray, isObject, isString } from '@intlify/shared'
import { MESSAGE_CACHE_KEY, deepCopyIteratively } from './utils'

import type { I18nOptions, Locale, FallbackLocale, LocaleMessages, DefineLocaleMessage } from 'vue-i18n'
import type { NuxtApp } from '#app'
import type { DeepRequired } from 'ts-essentials'
import type { VueI18nConfig, NuxtI18nOptions } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LocaleLoader = { key: string; load: () => Promise<any>; cache: boolean }

export async function loadVueI18nOptions(
  vueI18nConfigs: VueI18nConfig[],
  nuxt: Pick<NuxtApp, 'runWithContext'>
): Promise<I18nOptions> {
  const vueI18nOptions: I18nOptions = { messages: {} }
  for (const configFile of vueI18nConfigs) {
    const { default: resolver } = await configFile()

    const resolved = typeof resolver === 'function' ? await nuxt.runWithContext(async () => await resolver()) : resolver

    deepCopyIteratively(resolved, vueI18nOptions)
  }

  return vueI18nOptions
}

export function makeFallbackLocaleCodes(fallback: FallbackLocale, locales: Locale[]): Locale[] {
  let fallbackLocales: string[] = []
  if (isArray(fallback)) {
    fallbackLocales = fallback
  } else if (isObject(fallback)) {
    const targets = [...locales, 'default']
    for (const locale of targets) {
      if (fallback[locale]) {
        fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)]
      }
    }
  } else if (isString(fallback) && locales.every(locale => locale !== fallback)) {
    fallbackLocales.push(fallback)
  }
  return fallbackLocales
}

export async function loadInitialMessages<Context extends NuxtApp = NuxtApp>(
  messages: LocaleMessages<DefineLocaleMessage>,
  localeLoaderMessages: Record<Locale, LocaleLoader[]>,
  options: DeepRequired<NuxtI18nOptions<Context>> & {
    initialLocale: Locale
    fallbackLocale: FallbackLocale
    localeCodes: string[]
    cacheMessages?: Map<string, LocaleMessages<DefineLocaleMessage>>
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  const { defaultLocale, initialLocale, localeCodes, fallbackLocale, lazy, cacheMessages } = options
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setter = (locale: Locale, message: Record<string, any>) => {
    const base = messages[locale] || {}
    deepCopyIteratively(message, base)
    messages[locale] = base
  }

  // load fallback messages
  if (lazy && fallbackLocale) {
    const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [defaultLocale, initialLocale])
    await Promise.all(
      fallbackLocales.map(locale => loadLocale({ locale, setter, localeMessages: localeLoaderMessages }, cacheMessages))
    )
  }

  // load initial messages
  const locales = lazy ? [...new Set<Locale>().add(defaultLocale).add(initialLocale)] : localeCodes
  await Promise.all(
    locales.map((locale: Locale) => loadLocale({ locale, setter, localeMessages: localeLoaderMessages }, cacheMessages))
  )

  return messages
}

async function loadMessage(
  locale: Locale,
  { key, load }: LocaleLoader,
  cacheMessages?: Map<string, LocaleMessages<DefineLocaleMessage>>
) {
  let message: LocaleMessages<DefineLocaleMessage> | null = null
  try {
    __DEBUG__ && console.log('loadMessage: (locale) -', locale)
    const getter = await load().then(r => r.default || r)
    if (isFunction(getter)) {
      message = await getter(locale)
      __DEBUG__ && console.log('loadMessage: dynamic load', message)
    } else {
      message = getter
      if (message != null && cacheMessages) {
        // @ts-expect-error Type should be changed
        message[MESSAGE_CACHE_KEY] = key
        cacheMessages.set(key, message)
      }
      __DEBUG__ && console.log('loadMessage: load', message)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    // eslint-disable-next-line no-console
    // console.error(formatMessage('Failed locale loading: ' + e.message))
    console.error('Failed locale loading: ' + e.message)
  }
  return message
}

export async function loadLocale(
  {
    locale,
    localeMessages,
    setter
  }: {
    locale: Locale
    localeMessages: Record<Locale, LocaleLoader[]>
    setter: (locale: Locale, message: LocaleMessages<DefineLocaleMessage>) => void
  },
  cacheMessages?: Map<string, LocaleMessages<DefineLocaleMessage>>
) {
  const loaders = localeMessages[locale]

  if (loaders == null) {
    // console.warn(formatMessage('Could not find messages for locale code: ' + locale))
    console.warn('Could not find messages for locale code: ' + locale)
    return
  }

  const targetMessage: LocaleMessages<DefineLocaleMessage> = {}
  for (const loader of loaders) {
    let message: LocaleMessages<DefineLocaleMessage> | undefined | null = null

    if (cacheMessages && cacheMessages.has(loader.key) && loader.cache) {
      __DEBUG__ && console.log(loader.key + ' is already loaded')
      message = cacheMessages.get(loader.key)
    } else {
      __DEBUG__ && !loader.cache && console.log(loader.key + ' bypassing cache!')
      __DEBUG__ && console.log(loader.key + ' is loading ...')
      message = await loadMessage(locale, loader, cacheMessages)
    }

    if (message != null) {
      deepCopyIteratively(message, targetMessage)
    }
  }

  setter(locale, targetMessage)
}
