import { definePlugin as _definePlugin } from 'nitro'
import { defineCachedFunction as _defineCachedFunction, defineCachedHandler as _defineCachedHandler } from 'nitro/cache'
import { useStorage as _useStorage } from 'nitro/storage'
import {
  createError as _createError,
  getRequestURL as _getRequestURL,
  getRouterParam as _getRouterParam,
  setCookie as _setCookie,
  useRuntimeConfig as _useRuntimeConfig,
  serverFetch,
  useServerHooks,
} from 'nuxt/server'
import { defineI18nMiddleware as _defineI18nMiddleware } from '../intlify'

import type { RequestEvent } from 'nuxt/schema'
import type { CookieSerializeOptions } from 'cookie-es'
import type { CoreOptions } from '@intlify/core'
import type { CacheOptions, I18nServerHooks } from './types'

export type ServerEvent = RequestEvent

export function definePlugin(setup: (hooks: I18nServerHooks<ServerEvent>) => void | Promise<void>) {
  return _definePlugin((nitro) => {
    const serverHooks = useServerHooks()
    return setup({
      onRequest: fn => nitro.hooks.hook('request', event => fn(event as unknown as ServerEvent)),
      onAfterResponse: fn => nitro.hooks.hook('response', (_response, event) => fn(event as unknown as ServerEvent)),
      onBeforeRender: fn => serverHooks.hook('render:route', async (_context, extra) => {
        const event = extra.event as unknown as ServerEvent
        const redirect = await fn(event)
        if (redirect) {
          event.res.status = redirect.status
          event.res.headers.set('location', redirect.location)
        }
      }),
      onRenderHTML: fn => serverHooks.hook('render:html', (html, { event }) => fn(html, event as unknown as ServerEvent)),
    })
  })
}

export const useRuntimeConfig = (_event?: ServerEvent) => _useRuntimeConfig()

export const useStorage = (base: string) => _useStorage(base)

export const I18N_HANDLER_CACHE_PREFIX = 'nitrohandlers:i18n'

export const defineEventHandler = <T>(handler: (event: ServerEvent) => T) => handler

export const defineCachedHandler = <T>(handler: (event: ServerEvent) => T | Promise<T>, options: CacheOptions<ServerEvent>) =>
  _defineCachedHandler(handler as unknown as Parameters<typeof _defineCachedHandler>[0], options as Parameters<typeof _defineCachedHandler>[1])

export const defineCachedFunction: typeof _defineCachedFunction = _defineCachedFunction

export const getRouterParam = (event: ServerEvent, name: string) => _getRouterParam(event, name)

export const createError = (input: { status: number, message: string }) => _createError(input)

export const getRequestURL = (event: ServerEvent) => _getRequestURL(event, { xForwardedHost: true })

/**
 * The path and query of a page render, without `app.baseURL`
 */
export const getRenderPath = (event: ServerEvent) => event.url.pathname + event.url.search

export const setCookie = (event: ServerEvent, name: string, value: string, options: CookieSerializeOptions) =>
  _setCookie(event, name, value, options)

export async function fetchInternal<T>(event: ServerEvent, path: string, init: { headers: Headers }): Promise<T> {
  const response = await serverFetch(event, path, init)
  if (!response.ok) {
    throw _createError({ status: response.status, message: `Failed to fetch ${path}` })
  }
  return await response.json() as T
}

export const defineI18nMiddleware = (options: CoreOptions) => _defineI18nMiddleware(options)
