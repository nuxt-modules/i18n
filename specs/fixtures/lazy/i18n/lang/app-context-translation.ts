export default defineI18nLocale(() => {
  // reading the config through the Nuxt app, which a nitro-side load has no way to reach (#3940)
  const nuxt = useNuxtApp()
  return {
    runtimeConfigKey: `app-context-only:${nuxt.$config.public.myKey}`
  }
})
