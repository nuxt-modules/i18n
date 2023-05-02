export default defineI18nLocale(async function (locale) {
  return $fetch(`/api/${locale}`)
})
