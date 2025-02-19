export default defineI18nLocale(function () {
  const config = useRuntimeConfig()
  return {
    runtimeConfigKey: config.public.myKey
  }
})
