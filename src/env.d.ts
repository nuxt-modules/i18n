declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production'
    EXPERIMENTAL_HOOK: boolean
  }
}

declare let __DEBUG__: boolean
