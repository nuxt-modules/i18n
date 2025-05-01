import { getRouterParam, setResponseStatus } from 'h3'
import { defineCachedEventHandler } from 'nitropack/runtime'
import { isLocaleCacheable } from '../utils/messages'

export default defineCachedEventHandler(
  async event => {
    const ctx = event.context.nuxtI18n
    const locale = getRouterParam(event, 'locale')
    if (!ctx.locale) {
      setResponseStatus(event, 400)
      return 'Locale is required'
    }

    ctx.locale = locale!
    ctx.messages = await ctx.getMergedMessages(ctx.locale, ctx.getFallbackLocales(ctx.locale))
    return ctx.messages?.[ctx.locale] ?? {}
  },
  {
    name: 'i18n:messages',
    getKey: event => `${event.context.params?.locale ?? 'null'}`,
    shouldBypassCache(event) {
      const locale = getRouterParam(event, 'locale')
      return locale == null || !isLocaleCacheable(locale)
    }
  }
)
