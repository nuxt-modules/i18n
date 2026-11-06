import {
  type ServerEvent,
  createError,
  defineCachedFunction,
  defineCachedHandler,
  defineEventHandler,
  getRouterParam,
} from '#i18n-server-runtime'
import { initializeI18nContext, tryUseI18nContext, useI18nContext } from '../context'
import { warnMissedMessageFunctions } from '../../shared/messages'

/**
 * Load messages for the specified locale event parameter
 */
const _messagesHandler = defineEventHandler(async (event: ServerEvent) => {
  const locale = getRouterParam(event, 'locale')

  if (!locale) {
    throw createError({ status: 400, message: 'Locale not specified.' })
  }

  const ctx = useI18nContext(event)
  if (ctx.localeConfigs && locale in ctx.localeConfigs === false) {
    throw createError({ status: 404, message: `Locale '${locale}' not found.` })
  }

  const messages = await ctx.loadMessages(locale)
  // this response is where message functions get dropped - prerender is when SSG bakes it
  if (import.meta.dev || import.meta.prerender) {
    for (const k of Object.keys(messages)) {
      warnMissedMessageFunctions(k, messages[k])
    }
  }
  return messages
})

const getCacheKey = (event: ServerEvent) =>
  [getRouterParam(event, 'locale') ?? 'null', getRouterParam(event, 'hash') ?? 'null'].join('-')

async function shouldBypassCache(event: ServerEvent) {
  const locale = getRouterParam(event, 'locale')
  if (locale == null) { return false }
  // prerendering may require initializing context
  const ctx = tryUseI18nContext(event) || await initializeI18nContext(event)
  return !ctx.localeConfigs?.[locale]?.cacheable
}

const _cachedMessageLoader = defineCachedFunction(_messagesHandler, {
  name: 'i18n:messages-internal',
  maxAge: !__I18N_CACHE__ ? -1 : 60 * 60 * 24,
  getKey: getCacheKey,
  shouldBypassCache,
})

/**
 * Load messages for the specified locale event parameter (cached)
 */
const _messagesHandlerCached = defineCachedHandler(_cachedMessageLoader, {
  name: 'i18n:messages',
  maxAge: !__I18N_CACHE__ ? -1 : __I18N_HTTP_CACHE_DURATION__,
  swr: false,
  getKey: getCacheKey,
  shouldBypassCache,
})

/**
 * Load messages for the specified locale event parameter
 * - uses `messagesHandler` in development
 * - uses `cachedMessagesHandler` in production
 */
// export default _messagesHandler
export default import.meta.dev ? _messagesHandler : _messagesHandlerCached
