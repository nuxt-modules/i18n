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
    ctx.messages = await getMergedMessages(locale, ctx.localeConfigs?.[locale]?.fallbacks ?? [])
    return ctx.messages
  },
  {
    name: 'i18n:messages',
    maxAge: !__I18N_CACHE__ ? -1 : 60 * 60 * 24,
    getKey: event => getRouterParam(event, 'locale') ?? 'null',
    shouldBypassCache(event) {
      const locale = getRouterParam(event, 'locale')
      if (locale == null) return false
      return !useI18nContext(event).localeConfigs?.[locale]?.cacheable
    }
  }
)
