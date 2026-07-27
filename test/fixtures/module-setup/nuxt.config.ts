export default defineNuxtConfig({
  modules: [
    './locale-provider',
    // `getLayerI18n` only picks up inline options when the module is referenced by this exact name
    [
      '@nuxtjs/i18n',
      {
        langDir: 'lang',
        defaultLocale: 'en',
        locales: [{ code: 'en', language: 'en-US', file: 'en.json', name: 'English' }]
      }
    ]
  ],
  i18n: {
    locales: [{ code: 'ja', language: 'ja-JP', file: 'ja.json', name: 'Japanese' }]
  }
})
