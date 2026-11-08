export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  messages: {
    en: {
      // reading the request through the Nuxt app, which a nitro-side load has no way to reach (#4150)
      requestHost: useRequestURL().host
    }
  }
}))
