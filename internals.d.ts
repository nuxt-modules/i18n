declare module '#build/i18n-options.mjs' {
  import type { LocaleObject, VueI18nConfig } from '@nuxtjs/i18n'

  export type { LocaleObject }

  type LocaleLoader = { key: string, cache: boolean, load: () => Promise<never> }
  export const localeLoaders: Record<string, LocaleLoader[]>
  export const vueI18nConfigs: VueI18nConfig[]
  export const localeCodes: string[]
  export const normalizedLocales: LocaleObject[]
}

declare module '#internal/i18n-options.mjs' {
  import type { LocaleObject, VueI18nConfig } from '@nuxtjs/i18n'

  type LocaleLoader = { key: string, cache: boolean, load: () => Promise<never> }
  export const localeLoaders: Record<string, LocaleLoader[]>
  export const vueI18nConfigs: VueI18nConfig[]
  export const localeCodes: string[]
  export const normalizedLocales: LocaleObject[]
}

declare module '#internal/i18n-locale-detector.mjs' {
  export const localeDetector: ((event: H3Event, config: LocaleConfig) => string) | undefined
}

declare module '#internal/i18n-type-generation-options' {
  export const dtsFile: string
}

declare module '#build/i18n-route-resources.mjs' {
  export const i18nPathToPath: Record<string, string>
  export const pathToI18nConfig: Record<string, Record<string, string | boolean>>
}
