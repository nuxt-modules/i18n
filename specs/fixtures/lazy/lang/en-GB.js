export default defineI18nLocale(async function (context, locale) {
  return $fetch(`/api/${locale}`)
})
