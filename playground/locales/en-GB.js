export default defineI18nLocale(async function (locale) {
  console.log('Loading locale', locale)
  return $fetch(`/api/${locale}`)
})
