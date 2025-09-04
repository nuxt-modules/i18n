import { deepCopy } from '@intlify/shared'
import { defineCachedEventHandler, defineCachedFunction } from 'nitropack/runtime'
import { getRouterParam, createError, defineEventHandler } from 'h3'
import { useI18nContext } from '../context'
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
  shouldBypassCache(event) {
    const locale = getRouterParam(event, 'locale')
    if (locale == null) return false
    return !useI18nContext(event).localeConfigs?.[locale]?.cacheable
  }
})

/**
 * Load messages for the specified locale event parameter (cached)
 */
const _messagesHandlerCached = defineCachedEventHandler(_cachedMessageLoader, {
  name: 'i18n:messages',
  maxAge: !__I18N_CACHE__ ? -1 : 10,
  swr: false,
  getKey: event => [getRouterParam(event, 'locale') ?? 'null', getRouterParam(event, 'hash') ?? 'null'].join('-')
})

/**
 * Load messages for the specified locale event parameter
 * - uses `messagesHandler` in development
 * - uses `cachedMessagesHandler` in production
 */
// export default _messagesHandler
export default import.meta.dev ? _messagesHandler : _messagesHandlerCached
