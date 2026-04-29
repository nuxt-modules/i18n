declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production'
  }
}

declare let __IS_SSG__: boolean
declare let __IS_SSR__: boolean
declare let __TRAILING_SLASH__: boolean
declare let __PARALLEL_PLUGIN__: boolean
declare let __DIFFERENT_DOMAINS__: boolean
declare let __MULTI_DOMAIN_LOCALES__: boolean

declare let __DYNAMIC_PARAMS_KEY__: string
declare let __DEFAULT_COOKIE_KEY__: string
declare let __NUXT_I18N_VERSION__: string
declare let __SWITCH_LOCALE_PATH_LINK_IDENTIFIER__: string
declare let __I18N_STRATEGY__: 'no_prefix' | 'prefix' | 'prefix_except_default' | 'prefix_and_default'
declare let __ROUTE_NAME_SEPARATOR__: string
declare let __ROUTE_NAME_DEFAULT_SUFFIX__: string
declare let __DEFAULT_DIRECTION__: string
declare let __I18N_CACHE__: boolean
declare let __I18N_CACHE_LIFETIME__: number
declare let __I18N_HTTP_CACHE_DURATION__: number
declare let __I18N_FULL_STATIC__: boolean
declare let __I18N_STRIP_UNUSED__: boolean
declare let __I18N_PRELOAD__: boolean
/** Project has pages and strategy is not `no_prefix` */
declare let __I18N_ROUTING__: boolean
declare let __I18N_STRICT_SEO__: boolean
declare let __I18N_SERVER_REDIRECT__: boolean
/** Server route prefix for i18n message endpoints */
declare let __I18N_SERVER_ROUTE__: string
/** Absolute URL prefix used by the client to fetch messages (empty when not using a CDN) */
declare let __I18N_CDN_URL__: string
/** Per-locale content hash, used as the `:hash` segment of message routes */
declare let __I18N_LOCALE_HASHES__: Record<string, string>
/** Whether compact routes are enabled */
declare let __I18N_COMPACT_ROUTES__: boolean
