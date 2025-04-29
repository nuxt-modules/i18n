declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production'
  }
}

declare let __DEBUG__: boolean
declare let __TEST__: boolean

declare let __IS_SSG__: boolean
declare let __HAS_PAGES__: boolean
declare let __TRAILING_SLASH__: boolean
declare let __PARALLEL_PLUGIN__: boolean
declare let __DIFFERENT_DOMAINS__: boolean
declare let __MULTI_DOMAIN_LOCALES__: boolean
declare let __LAZY_LOCALES__: boolean

declare let __DYNAMIC_PARAMS_KEY__: string
declare let __DEFAULT_COOKIE_KEY__: string
declare let __NUXT_I18N_MODULE_ID__: string
declare let __SWITCH_LOCALE_PATH_LINK_IDENTIFIER__: string
declare let __I18N_STRATEGY__: 'no_prefix' | 'prefix' | 'prefix_except_default' | 'prefix_and_default'
declare let __ROUTE_NAME_SEPARATOR__: string
declare let __ROUTE_NAME_DEFAULT_SUFFIX__: string
declare let __DEFAULT_DIRECTION__: string
declare let __I18N_CACHE__: boolean
declare let __I18N_CACHE_LIFETIME__: number
