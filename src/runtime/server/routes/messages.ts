import { getRouterParam, createError } from 'h3'
import { defineCachedEventHandler } from 'nitropack/runtime'
import { getMergedMessages, isLocaleWithFallbacksCacheable } from '../utils/messages'
import { useI18nContext } from '../context'

export default defineCachedEventHandler(
  async event => {
    const locale = getRouterParam(event, 'locale')

    if (!locale) {
      throw createError({ status: 400, statusMessage: 'Bad Request', message: 'Invalid locale parameter' })
    }

    const ctx = useI18nContext(event)
    ctx.locale = locale
    ctx.messages = await getMergedMessages(locale, ctx.getFallbackLocales(locale))

    return ctx.messages
  },
  {
    name: 'i18n:messages',
    maxAge: import.meta.dev ? -1 : 60 * 60 * 24,
    getKey: event => getRouterParam(event, 'locale') ?? 'null',
    shouldBypassCache(event) {
      const locale = getRouterParam(event, 'locale')
      return (
        import.meta.dev ||
        locale == null ||
        !isLocaleWithFallbacksCacheable(locale, useI18nContext(event).getFallbackLocales(locale))
      )
    }
  }
)
