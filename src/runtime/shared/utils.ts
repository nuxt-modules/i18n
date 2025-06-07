import { useRuntimeConfig } from '#app'
import type { DetectBrowserLanguageOptions, I18nPublicRuntimeConfig } from '#internal-i18n-types'

export function useRuntimeI18n() {
  return useRuntimeConfig().public.i18n as I18nPublicRuntimeConfig
}

export function useI18nDetection(): DetectBrowserLanguageOptions & { enabled: boolean; cookieKey: string } {
  const detectBrowserLanguage = useRuntimeI18n().detectBrowserLanguage
  const detect = detectBrowserLanguage || {}
  return {
    ...detect,
    enabled: !!detectBrowserLanguage,
    cookieKey: detect.cookieKey || __DEFAULT_COOKIE_KEY__
  }
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}
