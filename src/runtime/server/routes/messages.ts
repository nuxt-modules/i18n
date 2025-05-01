import { getRouterParam, setResponseStatus } from 'h3'
import { defineCachedEventHandler } from 'nitropack/runtime'
import { getMergedMessages, isLocaleWithFallbacksCacheable } from '../utils/messages'
import { useI18nContext } from '../context'

export default defineCachedEventHandler(
  async event => {
    const locale = getRouterParam(event, 'locale')
    if (!locale) {
      setResponseStatus(event, 400)
      return
    }

    const ctx = useI18nContext(event)
    ctx.locale = locale!
    ctx.messages = await getMergedMessages(ctx.locale, ctx.getFallbackLocales(ctx.locale))
    return ctx.messages
  },
  {
    name: 'i18n:messages',
    maxAge: import.meta.dev ? -1 : 60 * 60 * 24,
    getKey: event => getRouterParam(event, 'locale') ?? 'null',
    shouldBypassCache(event) {
      const locale = getRouterParam(event, 'locale')
      return locale == null || !isLocaleWithFallbacksCacheable(locale, useI18nContext(event).getFallbackLocales(locale))
    }
  }
)
