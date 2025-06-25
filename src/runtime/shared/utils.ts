import { useRuntimeConfig, type NuxtApp } from '#app'
import { isString } from '@intlify/shared'
import type { DetectBrowserLanguageOptions, I18nPublicRuntimeConfig, RootRedirectOptions } from '#internal-i18n-types'

export function useRuntimeI18n(nuxtApp?: NuxtApp) {
  if (!nuxtApp) {
    return useRuntimeConfig().public.i18n as unknown as I18nPublicRuntimeConfig
  }
  return nuxtApp.$config.public.i18n as unknown as I18nPublicRuntimeConfig
}

export function useI18nDetection(
  nuxtApp: NuxtApp | undefined
): DetectBrowserLanguageOptions & { enabled: boolean; cookieKey: string } {
  const detectBrowserLanguage = useRuntimeI18n(nuxtApp).detectBrowserLanguage
  const detect = detectBrowserLanguage || {}
  return {
    ...detect,
    enabled: !!detectBrowserLanguage,
    cookieKey: detect.cookieKey || __DEFAULT_COOKIE_KEY__
  }
}

export function resolveRootRedirect(config: string | RootRedirectOptions | undefined) {
  if (!config) return undefined
  return {
    path: '/' + (isString(config) ? config : config.path).replace(/^\//, ''),
    code: (!isString(config) && config.statusCode) || 302
  }
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
