// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      {
        code: 'en',
        name: 'English',
        iso: 'en',
        file: 'en/pc.js',
        domain: 'en.nuxt-app.localhost'
      },
      {
        code: 'zh-CN',
        name: '简体中文',
        iso: 'zh',
        file: 'zh/pc.js',
        domain: 'zh.nuxt-app.localhost'
      }
    ],
    differentDomains: true,
    detectBrowserLanguage: false,
    defaultLocale: 'en',
    langDir: 'lang/'
  }
})
