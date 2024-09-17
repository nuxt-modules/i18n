export default defineI18nLocale(locale => {
  return {
    moduleLayerText: 'This is a merged module layer locale key in Dutch',
    big: useRuntimeConfig().public.longTextTest ? 'hallo,'.repeat(8 * 500) : ''
  }
})
