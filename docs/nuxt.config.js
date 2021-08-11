import theme from '@nuxt/content-theme-docs'

export default theme({
  i18n: {
    locales: () => [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en-US.js',
        name: 'English'
      }
    ],
    defaultLocale: 'en'
  }
})
