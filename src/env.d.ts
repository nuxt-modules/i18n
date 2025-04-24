declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production'
  }
}

declare let __DEBUG__: boolean
declare let __TEST__: boolean

declare let __IS_SSG__: boolean
declare let __HAS_PAGES__: boolean
declare let __PARALLEL_PLUGIN__: boolean

declare let __DYNAMIC_PARAMS_KEY__: string
declare let __DEFAULT_COOKIE_KEY__: string
declare let __NUXT_I18N_MODULE_ID__: string
declare let __SWITCH_LOCALE_PATH_LINK_IDENTIFIER__: string
