// other modules add their own options under `i18n` by augmenting `ModuleOptions` (#4138)
declare module '@nuxtjs/i18n' {
  interface ModuleOptions {
    augmentedOption?: boolean
  }
}

export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  experimental: {
    typedPages: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'nl'],
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    augmentedOption: true,
  },
})
