import type { NuxtApp } from '#app'
import { isString } from '@intlify/shared'
import type { DetectBrowserLanguageOptions, I18nPublicRuntimeConfig, RootRedirectOptions } from '#internal-i18n-types'

export function useRuntimeI18n(nuxtApp: NuxtApp) {
  return nuxtApp.$config.public.i18n as unknown as I18nPublicRuntimeConfig
}

export function useI18nDetection(
  runtimeI18n: I18nPublicRuntimeConfig,
): DetectBrowserLanguageOptions & { enabled: boolean, cookieKey: string } {
  const detectBrowserLanguage = runtimeI18n.detectBrowserLanguage
  const detect = detectBrowserLanguage || {}
  return {
    ...detect,
    enabled: !!detectBrowserLanguage,
    cookieKey: detect.cookieKey || __DEFAULT_COOKIE_KEY__,
  }
}

export function resolveRootRedirect(config: string | RootRedirectOptions | undefined) {
  if (!config) { return undefined }
  return {
    path: '/' + (isString(config) ? config : config.path).replace(/^\//, ''),
    code: (!isString(config) && config.statusCode) || 302,
  }
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '"': '&quot;',
  '\'': '&#39;',
  '<': '&lt;',
  '>': '&gt;',
}

/**
 * Escapes a value interpolated into raw HTML, same character set as vue's `escapeHtml`
 * so a rewritten attribute is identical to what vue rendered for the same value.
 *
 * Vue exposes this through `ssrRenderAttr` from `vue/server-renderer`, but importing that
 * would pull the server renderer into the client bundle.
 */
export function escapeHtmlAttr(value: string): string {
  return value.replace(/["'&<>]/g, c => HTML_ESCAPES[c]!)
}
