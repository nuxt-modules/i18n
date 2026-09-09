declare module '#build/i18n-options.mjs' {
  import type { LocaleObject, NormalizedLocaleObject, VueI18nConfig } from '@nuxtjs/i18n'

  export type { LocaleObject }

  type LocaleLoader = { key: string, cache: boolean, load: () => Promise<never> }
  export const localeLoaders: Record<string, LocaleLoader[]>
  export const vueI18nConfigs: VueI18nConfig[]
  export const localeCodes: string[]
  export const normalizedLocales: NormalizedLocaleObject[]
}

declare module '#internal/i18n-options.mjs' {
  import type { NormalizedLocaleObject, VueI18nConfig } from '@nuxtjs/i18n'

  type LocaleLoader = { key: string, cache: boolean, load: () => Promise<never> }
  export const localeLoaders: Record<string, LocaleLoader[]>
  export const vueI18nConfigs: VueI18nConfig[]
  export const localeCodes: string[]
  export const normalizedLocales: NormalizedLocaleObject[]
}

declare module '#build/i18n-h3.mjs' {
  export {
    createError,
    defineEventHandler,
    getCookie,
    getRequestHeader,
    getRequestURL,
    getResponseHeaders,
    getResponseStatus,
    getRouterParam,
    sanitizeStatusCode,
    setCookie,
    setResponseHeader,
    setResponseStatus,
  } from 'h3'
}

declare module '#internal/i18n-locale-detector.mjs' {
  export const localeDetector: ((event: H3Event, config: LocaleConfig) => string) | undefined
}

declare module '#internal/i18n-nitro.mjs' {
  import type { NitroApp, RenderContext } from 'nitropack'

  export const defineNitroPlugin: (plugin: (nitro: NitroApp) => void) => (nitro: NitroApp) => void

  export function hookNitroRender(
    nitro: NitroApp,
    handler: (context: RenderContext) => void | Promise<void>,
  ): void

  export function setNitroRedirectResponse(
    context: RenderContext,
    body: string,
    headers: Record<string, string>,
    status: number,
  ): void

  export {
    defineCachedEventHandler,
    defineCachedFunction,
    useRuntimeConfig,
    useStorage,
  } from 'nitropack/runtime'

  export {
    createError,
    defineEventHandler,
    getCookie,
    getRequestHeader,
    getRequestURL,
    getResponseHeaders,
    getResponseStatus,
    getRouterParam,
    sanitizeStatusCode,
    setCookie,
    setResponseHeader,
    setResponseStatus,
  } from 'h3'
}

declare module '#internal/i18n-type-generation-options' {
  export const dtsFile: string
}

declare module '#build/i18n-route-resources.mjs' {
  export const localizedPaths: string[]
  export const i18nPathToPath: Record<string, string>
  export const pathToI18nConfig: Record<string, Record<string, string | false>>
  export const disabledPaths: string[]
}
