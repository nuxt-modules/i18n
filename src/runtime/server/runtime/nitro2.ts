import {
  useRuntimeConfig as _useRuntimeConfig,
  useStorage as _useStorage,
  defineCachedEventHandler,
  defineCachedFunction,
  defineNitroPlugin,
} from 'nitropack/runtime'
import {
  createError as _createError,
  defineEventHandler as _defineEventHandler,
  getRequestURL as _getRequestURL,
  getRouterParam as _getRouterParam,
  setCookie as _setCookie,
  sanitizeStatusCode,
} from 'h3'
import { defineI18nMiddleware as _defineI18nMiddleware } from '@intlify/h3'

import type { H3Event } from 'h3'
import type { CookieSerializeOptions } from 'cookie-es'
import type { CoreOptions } from '@intlify/core'
import type { CacheOptions, I18nServerHooks } from './types'

export type ServerEvent = H3Event

export function definePlugin(setup: (hooks: I18nServerHooks<ServerEvent>) => void | Promise<void>) {
  return defineNitroPlugin(nitro => setup({
    onRequest: fn => nitro.hooks.hook('request', fn),
    onAfterResponse: fn => nitro.hooks.hook('afterResponse', fn),
    onBeforeRender: fn => nitro.hooks.hook('render:before', async (context) => {
      const redirect = await fn(context.event)
      if (redirect) {
        context.response = createRedirectResponse(context.event, redirect.location, redirect.status)
      }
    }),
    onRenderHTML: fn => nitro.hooks.hook('render:html', (html, { event }) => fn(html, event)),
  }))
}

// Adapted from H3 v1
// https://github.com/h3js/h3/blob/24231b9c448aa852b15b889c53253a783f67a126/src/utils/response.ts#L166-L179
function createRedirectResponse(event: H3Event, dest: string, code: number) {
  event.node.res.setHeader('location', dest)
  event.node.res.statusCode = sanitizeStatusCode(code, event.node.res.statusCode)

  return {
    headers: event.node.res.getHeaders() as Record<string, string>,
    statusCode: event.node.res.statusCode,
    body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${dest.replace(/"/g, '%22')}"></head></html>`,
  }
}

export const useRuntimeConfig = (event?: ServerEvent) => _useRuntimeConfig(event)

export const useStorage = (base: string): ReturnType<typeof _useStorage> => _useStorage(base)

export const I18N_HANDLER_CACHE_PREFIX = 'nitro:handlers:i18n'

export const defineEventHandler = <T>(handler: (event: ServerEvent) => T) => _defineEventHandler(handler)

export const defineCachedHandler = <T>(handler: (event: ServerEvent) => T | Promise<T>, options: CacheOptions<ServerEvent>) =>
  defineCachedEventHandler(handler, options)

export { defineCachedFunction }

export const getRouterParam = (event: ServerEvent, name: string) => _getRouterParam(event, name)

export const createError = (input: { status: number, message: string }) => _createError(input)

export const getRequestURL = (event: ServerEvent) => _getRequestURL(event, { xForwardedHost: true })

/**
 * The path and query of a page render, without `app.baseURL`
 */
export const getRenderPath = (event: ServerEvent) => event.path

export const setCookie = (event: ServerEvent, name: string, value: string, options: CookieSerializeOptions) =>
  _setCookie(event, name, value, options)

export const fetchInternal = <T>(_event: ServerEvent, path: string, init: { headers: Headers }) => $fetch<T>(path, init)

export const defineI18nMiddleware = (options: CoreOptions) => _defineI18nMiddleware(options)
