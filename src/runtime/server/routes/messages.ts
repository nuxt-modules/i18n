import { setResponseStatus } from 'h3'
import { defineCachedEventHandler } from 'nitropack/runtime'
import { isLocaleCacheable } from '../utils/messages'

export default defineCachedEventHandler(
  async event => {
    const ctx = event.context.nuxtI18n
    ctx.locale = event.context.params!.locale!
    if (!ctx.locale) {
      setResponseStatus(event, 400)
      return 'Locale is required'
    }

    ctx.messages = await ctx.getMergedMessages(ctx.locale, ctx.getFallbackLocales(ctx.locale))
    return ctx.messages?.[ctx.locale] ?? {}
  },
  {
    name: 'i18n:messages',
    getKey: event => `${event.context.params?.locale ?? 'null'}`,
    shouldInvalidateCache(event) {
      if (event.context.params?.locale == null) return true
      return !isLocaleCacheable(event.context.params.locale)
    }
  }
)
