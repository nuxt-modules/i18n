import { deepCopy } from '@intlify/shared'
import { defineCachedEventHandler, defineCachedFunction } from 'nitropack/runtime'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { initializeI18nContext, tryUseI18nContext, useI18nContext } from '../context'
import { getMergedMessages } from '../utils/messages'

import type { H3Event } from 'h3'

/**
 * Load messages for the specified locale event parameter
 */
const _messagesHandler = defineEventHandler(async (event: H3Event) => {
  const locale = getRouterParam(event, 'locale')

  if (!locale) {
    throw createError({ status: 400, message: 'Locale not specified.' })
  }

  const ctx = useI18nContext(event)
  if (ctx.localeConfigs && locale in ctx.localeConfigs === false) {
    throw createError({ status: 404, message: `Locale '${locale}' not found.` })
  }

  const messages = await getMergedMessages(locale, ctx.localeConfigs?.[locale]?.fallbacks ?? [])
  deepCopy(messages, ctx.messages)

  return ctx.messages
})

const _cachedMessageLoader = defineCachedFunction(_messagesHandler, {
  name: 'i18n:messages-internal',
  maxAge: !__I18N_CACHE__ ? -1 : 60 * 60 * 24,
  getKey: event => [getRouterParam(event, 'locale') ?? 'null', getRouterParam(event, 'hash') ?? 'null'].join('-'),
  async shouldBypassCache(event) {
    const locale = getRouterParam(event, 'locale')
    if (locale == null) { return false }
    // prerendering may require initializing context
    const ctx = tryUseI18nContext(event) || await initializeI18nContext(event)
    return !ctx.localeConfigs?.[locale]?.cacheable
  },
})

/**
 * Load messages for the specified locale event parameter (cached)
 */
const _messagesHandlerCached = defineCachedEventHandler(_cachedMessageLoader, {
  name: 'i18n:messages',
  maxAge: !__I18N_CACHE__ ? -1 : __I18N_HTTP_CACHE_DURATION__,
  swr: false,
  getKey: event => [getRouterParam(event, 'locale') ?? 'null', getRouterParam(event, 'hash') ?? 'null'].join('-'),
})

/**
 * Load messages for the specified locale event parameter
 * - uses `messagesHandler` in development
 * - uses `cachedMessagesHandler` in production
 */
// export default _messagesHandler
export default import.meta.dev ? _messagesHandler : _messagesHandlerCached
