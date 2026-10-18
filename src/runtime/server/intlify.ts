import * as utils from '@intlify/utils'
import {
  NOT_REOSLVED,
  createCoreContext,
  // @ts-expect-error exported at runtime, but missing from the published types
  parseTranslateArgs as parseArgs,
  translate,
} from '@intlify/core'
import { setCookie } from 'nuxt/server'

import type { CookieSerializeOptions } from 'cookie-es'
import type { CoreOptions, Locale } from '@intlify/core'

const parseTranslateArgs = parseArgs as (...args: unknown[]) => [string, Record<string, unknown>]

type CoreContext = Omit<ReturnType<typeof createCoreContext>, 'locale'> & { locale: unknown }

export interface RequestEvent {
  req: Request
  res: { headers: Headers }
  context: Record<string, unknown>
}

type WithEvent<T> = T extends (request: Request, ...args: infer Args) => infer Result
  ? (event: Pick<RequestEvent, 'req'>, ...args: Args) => Result
  : never

const withEvent = <T extends (request: Request, ...args: never[]) => unknown>(fn: T) =>
  ((event: Pick<RequestEvent, 'req'>, ...args: never[]) => fn(event.req, ...args)) as WithEvent<T>

export const getCookieLocale: WithEvent<typeof utils.getCookieLocale> = withEvent(utils.getCookieLocale)
export const getHeaderLanguage: WithEvent<typeof utils.getHeaderLanguage> = withEvent(utils.getHeaderLanguage)
export const getHeaderLanguages: WithEvent<typeof utils.getHeaderLanguages> = withEvent(utils.getHeaderLanguages)
export const getHeaderLocale: WithEvent<typeof utils.getHeaderLocale> = withEvent(utils.getHeaderLocale)
export const getHeaderLocales: WithEvent<typeof utils.getHeaderLocales> = withEvent(utils.getHeaderLocales)
export const getPathLocale: WithEvent<typeof utils.getPathLocale> = withEvent(utils.getPathLocale)
export const getQueryLocale: WithEvent<typeof utils.getQueryLocale> = withEvent(utils.getQueryLocale)
export const tryCookieLocale: WithEvent<typeof utils.tryCookieLocale> = withEvent(utils.tryCookieLocale)
export const tryHeaderLocale: WithEvent<typeof utils.tryHeaderLocale> = withEvent(utils.tryHeaderLocale)
export const tryHeaderLocales: WithEvent<typeof utils.tryHeaderLocales> = withEvent(utils.tryHeaderLocales)
export const tryPathLocale: WithEvent<typeof utils.tryPathLocale> = withEvent(utils.tryPathLocale)
export const tryQueryLocale: WithEvent<typeof utils.tryQueryLocale> = withEvent(utils.tryQueryLocale)

export function setCookieLocale(
  event: Pick<RequestEvent, 'res'>,
  locale: string | Intl.Locale,
  options: CookieSerializeOptions & { name: string } = { name: 'i18n_locale' },
) {
  if (!(utils.isLocale(locale) || (typeof locale === 'string' && utils.validateLangTag(locale)))) {
    throw new SyntaxError(`locale is invalid: ${locale.toString()}`)
  }
  setCookie(event, options.name, locale.toString(), options)
}

type LocaleDetector = (event: RequestEvent, i18n: CoreContext) => Locale | Promise<Locale>

interface I18nEventContext {
  i18n?: CoreContext
  _i18nLocale?: (event: RequestEvent) => Locale | Promise<Locale>
}

const detectLocaleFromAcceptLanguageHeader = (event: Pick<RequestEvent, 'req'>) => getHeaderLocale(event).toString()

export function defineI18nMiddleware(options: CoreOptions) {
  const context = createCoreContext(options)
  const i18n = context as unknown as CoreContext
  const orgLocale = i18n.locale as Locale | LocaleDetector

  const getLocaleDetector = (event: RequestEvent) => {
    if (typeof orgLocale === 'function') {
      return orgLocale.bind(null, event, i18n)
    }
    return orgLocale ? () => orgLocale : detectLocaleFromAcceptLanguageHeader.bind(null, event)
  }

  return {
    onRequest(event: RequestEvent) {
      const context = event.context as I18nEventContext
      context._i18nLocale = getLocaleDetector(event)
      i18n.locale = context._i18nLocale as unknown as Locale
      context.i18n = i18n
    },
    onAfterResponse(event: RequestEvent) {
      i18n.locale = orgLocale as Locale
      delete (event.context as I18nEventContext).i18n
    },
  }
}

export async function useTranslation(event: RequestEvent) {
  const context = event.context as I18nEventContext
  if (context.i18n == null || context._i18nLocale == null) {
    throw new Error('[nuxt-i18n] `useTranslation` requires a locale detector to be configured (`experimental.localeDetector`).')
  }

  const i18n = context.i18n
  const locale = await context._i18nLocale(event)
  i18n.locale = locale

  return function t(key: string, ...args: unknown[]): string {
    const [, options] = parseTranslateArgs(key, ...args)
    const result = Reflect.apply(translate, null, [i18n, key, args[0], { locale, ...options }])
    return NOT_REOSLVED === result ? key : result as string
  }
}
